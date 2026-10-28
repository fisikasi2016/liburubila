import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Book = {
  id: number
  title: string
  author: string
  publication_date: string | null
  pages: number
  language: string
  cover_url: string | null
  genre_id: number | null
  topic_id: number | null
  subtopic_id: number | null
}

type Classification = {
  id: number
  name: string
}

type Tag = {
  id: number
  name: string
}

type Criterion = {
  id: number
  name: string
  description: string | null
  position: number
}

type Rating = {
  id: number
  initials: string
  age: number | null
  level: string | null
  comment: string | null
  created_at: string
}

type Score = {
  rating_id: number
  criterion_id: number
  score: number
}

type AgeRange = {
  id: number
  code: string
  label: string
  position: number
}

type RatingAgeRange = {
  rating_id: number
  age_range_id: number
}

type BookTagRelation = {
  tag_id: number
}

type DeleteTarget =
  | {
      type: 'book'
    }
  | {
      type: 'comment'
      ratingId: number
    }
  | null

type Props = {
  bookId: number
  onBack: () => void
}

export default function BookDetail({
  bookId,
  onBack,
}: Props) {
  const [book, setBook] =
    useState<Book | null>(null)

  const [genre, setGenre] =
    useState<Classification | null>(null)

  const [topic, setTopic] =
    useState<Classification | null>(null)

  const [subtopic, setSubtopic] =
    useState<Classification | null>(null)

  const [tags, setTags] =
    useState<Tag[]>([])

  const [criteria, setCriteria] =
    useState<Criterion[]>([])

  const [ratings, setRatings] =
    useState<Rating[]>([])

  const [scores, setScores] =
    useState<Score[]>([])

  const [ageRanges, setAgeRanges] =
    useState<AgeRange[]>([])

  const [
    ratingAgeRanges,
    setRatingAgeRanges,
  ] = useState<RatingAgeRange[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // =========================
  // BORRADO
  // =========================

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<DeleteTarget>(null)

  const [
    teacherPassword,
    setTeacherPassword,
  ] = useState('')

  const [
    passwordError,
    setPasswordError,
  ] = useState('')

  const [deleting, setDeleting] =
    useState(false)

  // =========================
  // BALORAZIO INDIVIDUALAK
  // =========================

  const [
    showRatingsPassword,
    setShowRatingsPassword,
  ] = useState(false)

  const [
    ratingsPassword,
    setRatingsPassword,
  ] = useState('')

  const [
    ratingsPasswordError,
    setRatingsPasswordError,
  ] = useState('')

  const [
    showIndividualRatings,
    setShowIndividualRatings,
  ] = useState(false)

  const [
    deletingRatingId,
    setDeletingRatingId,
  ] = useState<number | null>(null)

  useEffect(() => {
    loadBook()
  }, [bookId])

  // ============================================================
  // CARGAR DATOS
  // ============================================================

  async function loadBook() {
    try {
      setLoading(true)
      setError('')

      // ==========================================================
      // PRIMERA TANDA
      // Todo lo que no depende de otro resultado se pide a la vez.
      // ==========================================================

      const [
        bookResult,
        criteriaResult,
        ratingsResult,
        ageRangesResult,
        tagRelationsResult,
      ] = await Promise.all([
        supabase
          .from('books')
          .select(`
            id,
            title,
            author,
            publication_date,
            pages,
            language,
            cover_url,
            genre_id,
            topic_id,
            subtopic_id
          `)
          .eq('id', bookId)
          .single(),

        supabase
          .from('criteria')
          .select(`
            id,
            name,
            description,
            position
          `)
          .eq('active', true)
          .order('position', {
            ascending: true,
          }),

        supabase
          .from('ratings')
          .select(`
            id,
            initials,
            age,
            level,
            comment,
            created_at
          `)
          .eq('book_id', bookId)
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from(
            'recommendation_age_ranges'
          )
          .select(`
            id,
            code,
            label,
            position
          `)
          .order('position', {
            ascending: true,
          }),

        supabase
          .from('book_tags')
          .select('tag_id')
          .eq('book_id', bookId),
      ])

      if (bookResult.error) {
        throw bookResult.error
      }

      if (criteriaResult.error) {
        throw criteriaResult.error
      }

      if (ratingsResult.error) {
        throw ratingsResult.error
      }

      if (ageRangesResult.error) {
        throw ageRangesResult.error
      }

      if (tagRelationsResult.error) {
        throw tagRelationsResult.error
      }

      const loadedBook =
        bookResult.data as Book

      const loadedRatings =
        (ratingsResult.data ?? []) as Rating[]

      const loadedCriteria =
        (criteriaResult.data ?? []) as Criterion[]

      const loadedAgeRanges =
        (ageRangesResult.data ?? []) as AgeRange[]

      const tagIds =
        (
          (tagRelationsResult.data ?? []) as BookTagRelation[]
        ).map(
          (relation) =>
            relation.tag_id
        )

      setBook(loadedBook)
      setRatings(loadedRatings)
      setCriteria(loadedCriteria)
      setAgeRanges(loadedAgeRanges)

      const ratingIds =
        loadedRatings.map(
          (rating) =>
            rating.id
        )

      // ==========================================================
      // SEGUNDA TANDA
      // Ya conocemos IDs de libro, ratings y etiquetas.
      // Pedimos TODO lo restante simultáneamente.
      // ==========================================================

      const [
        scoresResult,
        ratingAgeRangesResult,
        genreResult,
        topicResult,
        subtopicResult,
        tagsResult,
      ] = await Promise.all([
        ratingIds.length > 0
          ? supabase
              .from('rating_scores')
              .select(`
                rating_id,
                criterion_id,
                score
              `)
              .in(
                'rating_id',
                ratingIds
              )
          : Promise.resolve({
              data: [],
              error: null,
            }),

        ratingIds.length > 0
          ? supabase
              .from(
                'rating_age_ranges'
              )
              .select(`
                rating_id,
                age_range_id
              `)
              .in(
                'rating_id',
                ratingIds
              )
          : Promise.resolve({
              data: [],
              error: null,
            }),

        loadedBook.genre_id
          ? supabase
              .from('genres')
              .select('id, name')
              .eq(
                'id',
                loadedBook.genre_id
              )
              .maybeSingle()
          : Promise.resolve({
              data: null,
              error: null,
            }),

        loadedBook.topic_id
          ? supabase
              .from('topics')
              .select('id, name')
              .eq(
                'id',
                loadedBook.topic_id
              )
              .maybeSingle()
          : Promise.resolve({
              data: null,
              error: null,
            }),

        loadedBook.subtopic_id
          ? supabase
              .from('subtopics')
              .select('id, name')
              .eq(
                'id',
                loadedBook.subtopic_id
              )
              .maybeSingle()
          : Promise.resolve({
              data: null,
              error: null,
            }),

        tagIds.length > 0
          ? supabase
              .from('tags')
              .select('id, name')
              .in(
                'id',
                tagIds
              )
              .order('name', {
                ascending: true,
              })
          : Promise.resolve({
              data: [],
              error: null,
            }),
      ])

      if (scoresResult.error) {
        throw scoresResult.error
      }

      if (
        ratingAgeRangesResult.error
      ) {
        throw ratingAgeRangesResult.error
      }

      if (genreResult.error) {
        throw genreResult.error
      }

      if (topicResult.error) {
        throw topicResult.error
      }

      if (subtopicResult.error) {
        throw subtopicResult.error
      }

      if (tagsResult.error) {
        throw tagsResult.error
      }

      setScores(
        (scoresResult.data ?? []).map(
          (item) => ({
            rating_id:
              item.rating_id,

            criterion_id:
              item.criterion_id,

            score:
              Number(
                item.score
              ),
          })
        )
      )

      setRatingAgeRanges(
        (ratingAgeRangesResult.data ??
          []) as RatingAgeRange[]
      )

      setGenre(
        genreResult.data
          ? (
              genreResult.data as Classification
            )
          : null
      )

      setTopic(
        topicResult.data
          ? (
              topicResult.data as Classification
            )
          : null
      )

      setSubtopic(
        subtopicResult.data
          ? (
              subtopicResult.data as Classification
            )
          : null
      )

      setTags(
        (tagsResult.data ?? []) as Tag[]
      )
    } catch (err) {
      console.error(
        'Error cargando libro:',
        err
      )

      setError(
        'Ezin izan da liburua kargatu.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // DATOS DERIVADOS
  // ============================================================

  const activeCriterionIds =
    useMemo(
      () =>
        criteria.map(
          (criterion) =>
            criterion.id
        ),
      [criteria]
    )

  const ratedRatings =
    useMemo(() => {
      return ratings.filter(
        (rating) =>
          scores.some(
            (score) =>
              score.rating_id ===
                rating.id &&
              activeCriterionIds.includes(
                score.criterion_id
              )
          )
      )
    }, [
      ratings,
      scores,
      activeCriterionIds,
    ])

  const comments =
    useMemo(() => {
      return ratings.filter(
        (rating) =>
          typeof rating.comment ===
            'string' &&
          rating.comment
            .trim()
            .length > 0
      )
    }, [ratings])

  // ============================================================
  // NOTA GENERAL
  // SOLO:
  // Asebetetze maila
  // Gomendatuko zenuke?
  // ============================================================

  const satisfactionCriterion =
    useMemo(
      () =>
        criteria.find(
          (criterion) =>
            criterion.name ===
            'Asebetetze maila'
        ),
      [criteria]
    )

  const recommendationCriterion =
    useMemo(
      () =>
        criteria.find(
          (criterion) =>
            criterion.name ===
            'Gomendatuko zenuke?'
        ),
      [criteria]
    )

  const overallAverage =
    useMemo(() => {
      if (
        !satisfactionCriterion ||
        !recommendationCriterion
      ) {
        return null
      }

      const individualAverages =
        ratedRatings
          .map((rating) => {
            const satisfactionScore =
              scores.find(
                (score) =>
                  score.rating_id ===
                    rating.id &&
                  score.criterion_id ===
                    satisfactionCriterion.id
              )

            const recommendationScore =
              scores.find(
                (score) =>
                  score.rating_id ===
                    rating.id &&
                  score.criterion_id ===
                    recommendationCriterion.id
              )

            if (
              !satisfactionScore ||
              !recommendationScore
            ) {
              return null
            }

            return (
              satisfactionScore.score +
              recommendationScore.score
            ) / 2
          })
          .filter(
            (
              value
            ): value is number =>
              value !== null
          )

      if (
        individualAverages.length ===
        0
      ) {
        return null
      }

      return (
        individualAverages.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        individualAverages.length
      )
    }, [
      ratedRatings,
      scores,
      satisfactionCriterion,
      recommendationCriterion,
    ])

  // ============================================================
  // MEDIA DE CADA CRITERIO
  // ============================================================

  const criterionAverages =
    useMemo(() => {
      return criteria.map(
        (criterion) => {
          const criterionScores =
            scores.filter(
              (score) =>
                score.criterion_id ===
                criterion.id
            )

          if (
            criterionScores.length ===
            0
          ) {
            return {
              criterion,
              average: null,
            }
          }

          return {
            criterion,

            average:
              criterionScores.reduce(
                (
                  sum,
                  score
                ) =>
                  sum +
                  score.score,
                0
              ) /
              criterionScores.length,
          }
        }
      )
    }, [criteria, scores])

  // ============================================================
  // PORCENTAJES DE EDAD
  // Denominador = personas que han valorado
  // ============================================================

  const ageRecommendations =
    useMemo(() => {
      const ratedRatingIds =
        new Set(
          ratedRatings.map(
            (rating) =>
              rating.id
          )
        )

      return ageRanges.map(
        (ageRange) => {
          const count =
            ratingAgeRanges.filter(
              (relation) =>
                relation.age_range_id ===
                  ageRange.id &&
                ratedRatingIds.has(
                  relation.rating_id
                )
            ).length

          const percentage =
            ratedRatings.length >
            0
              ? (count /
                  ratedRatings.length) *
                100
              : 0

          return {
            ...ageRange,
            count,
            percentage,
          }
        }
      )
    }, [
      ageRanges,
      ratingAgeRanges,
      ratedRatings,
    ])

  // ============================================================
  // BORRADO LIBRO / COMENTARIO
  // ============================================================

  function requestDeleteBook() {
    setTeacherPassword('')
    setPasswordError('')

    setDeleteTarget({
      type: 'book',
    })
  }

  function requestDeleteComment(
    ratingId: number
  ) {
    setTeacherPassword('')
    setPasswordError('')

    setDeleteTarget({
      type: 'comment',
      ratingId,
    })
  }

  function closeDeleteModal() {
    if (deleting) return

    setDeleteTarget(null)
    setTeacherPassword('')
    setPasswordError('')
  }

  async function confirmDelete(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setPasswordError('')

    if (
      teacherPassword !==
      'irakasle'
    ) {
      setPasswordError(
        'Pasahitza ez da zuzena.'
      )
      return
    }

    if (!deleteTarget) {
      return
    }

    if (
      deleteTarget.type ===
      'book'
    ) {
      const confirmed =
        window.confirm(
          'Ziur zaude liburu hau eta hari lotutako informazio guztia ezabatu nahi dituzula?'
        )

      if (confirmed) {
        await deleteBook()
      }

      return
    }

    const confirmed =
      window.confirm(
        'Ziur zaude iruzkin hau ezabatu nahi duzula?'
      )

    if (confirmed) {
      await deleteComment(
        deleteTarget.ratingId
      )
    }
  }

  async function deleteComment(
    ratingId: number
  ) {
    try {
      setDeleting(true)

      const {
        error: updateError,
      } = await supabase
        .from('ratings')
        .update({
          comment: null,
        })
        .eq('id', ratingId)

      if (updateError) {
        throw updateError
      }

      setDeleteTarget(null)

      await loadBook()
    } catch (err) {
      console.error(err)

      setPasswordError(
        'Ezin izan da iruzkina ezabatu.'
      )
    } finally {
      setDeleting(false)
    }
  }

  async function deleteBook() {
    if (!book) return

    try {
      setDeleting(true)

      if (book.cover_url) {
        const fileName =
          getCoverFileName(
            book.cover_url
          )

        if (fileName) {
          const {
            error:
              storageError,
          } =
            await supabase.storage
              .from(
                'book-covers'
              )
              .remove([
                fileName,
              ])

          if (
            storageError
          ) {
            console.error(
              storageError
            )
          }
        }
      }

      const {
        error: deleteError,
      } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)

      if (deleteError) {
        throw deleteError
      }

      setDeleteTarget(null)

      onBack()
    } catch (err) {
      console.error(err)

      setPasswordError(
        'Ezin izan da liburua ezabatu.'
      )
    } finally {
      setDeleting(false)
    }
  }

  // ============================================================
  // ACCESO DOCENTE
  // ============================================================

  function requestRatingsAccess() {
    setRatingsPassword('')
    setRatingsPasswordError('')
    setShowRatingsPassword(true)
  }

  function checkRatingsPassword(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (
      ratingsPassword !==
      'irakasle'
    ) {
      setRatingsPasswordError(
        'Pasahitza ez da zuzena.'
      )
      return
    }

    setShowRatingsPassword(false)
    setRatingsPassword('')
    setRatingsPasswordError('')
    setShowIndividualRatings(true)
  }

  // ============================================================
  // BORRAR BALORAZIO INDIVIDUAL
  // ============================================================

  async function deleteIndividualRating(
    ratingId: number
  ) {
    const confirmed =
      window.confirm(
        'Ziur zaude balorazio hau ezabatu nahi duzula? Iruzkina mantenduko da, baldin badago.'
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingRatingId(
        ratingId
      )

      // Eliminamos las puntuaciones.
      const {
        error: scoresError,
      } = await supabase
        .from('rating_scores')
        .delete()
        .eq(
          'rating_id',
          ratingId
        )

      if (scoresError) {
        throw scoresError
      }

      // También eliminamos la
      // recomendación de edad asociada
      // a esa valoración.
      const {
        error: ageError,
      } = await supabase
        .from(
          'rating_age_ranges'
        )
        .delete()
        .eq(
          'rating_id',
          ratingId
        )

      if (ageError) {
        throw ageError
      }

      const rating =
        ratings.find(
          (item) =>
            item.id ===
            ratingId
        )

      // Si no queda comentario,
      // eliminamos la fila vacía.
      if (
        !rating?.comment ||
        rating.comment
          .trim() ===
          ''
      ) {
        const {
          error: ratingError,
        } = await supabase
          .from('ratings')
          .delete()
          .eq(
            'id',
            ratingId
          )

        if (ratingError) {
          throw ratingError
        }
      }

      await loadBook()
    } catch (err) {
      console.error(err)

      alert(
        'Ezin izan da balorazioa ezabatu.'
      )
    } finally {
      setDeletingRatingId(
        null
      )
    }
  }

  // ============================================================
  // CARGANDO
  // ============================================================

  if (loading) {
    return (
      <section className="page">
        <p className="placeholder">
          Liburua kargatzen...
        </p>
      </section>
    )
  }

  if (error || !book) {
    return (
      <section className="page">
        <button
          className="back-button"
          onClick={onBack}
        >
          ← Itzuli
        </button>

        <div className="empty-library">
          <strong>
            Ezin izan da
            liburua kargatu.
          </strong>
        </div>
      </section>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="page">
      <div className="book-detail-topbar">
        <button
          className="back-button"
          onClick={onBack}
        >
          ← Itzuli
        </button>

        <button
          className="trash-button book-trash-button"
          onClick={
            requestDeleteBook
          }
          title="Liburua ezabatu"
          aria-label="Liburua ezabatu"
        >
          🗑️
        </button>
      </div>

      <div className="book-detail">
        {/* =====================
            PORTADA
            ===================== */}

        <div className="book-detail-cover">
          {book.cover_url ? (
            <img
              src={
                book.cover_url
              }
              alt={book.title}
            />
          ) : (
            <div className="book-detail-no-cover">
              📖
            </div>
          )}
        </div>

        {/* =====================
            INFORMACIÓN
            ===================== */}

        <div className="book-detail-info">
          <div className="small-logo detail-logo">
            LIBURUBILA
          </div>

          <h1>
            {book.title}
          </h1>

          <p className="book-detail-author">
            {book.author}
          </p>

          {/* =====================
              NOTA GENERAL
              ===================== */}

          <div className="book-main-rating">
            <span className="rating-label">
              BATEZ BESTEKO NOTA
            </span>

            <div className="main-rating-row">
              <StarRating
                value={
                  overallAverage
                }
              />

              <strong>
                {formatScore(
                  overallAverage
                )}
              </strong>

              <div className="rating-counts rating-counts-separated">
                <div className="rating-counts-vertical">
                  <div className="rating-count-item">
                    <span>Balorazioak:</span>

                    <strong>
                      {ratedRatings.length}
                    </strong>

                    <button
                      className="rating-inspect-button"
                      onClick={requestRatingsAccess}
                      title="Balorazioak ikusi"
                      aria-label="Balorazioak ikusi"
                    >
                      🔍
                    </button>
                  </div>

                  <div className="rating-count-item">
                    <span>Iruzkinak:</span>

                    <strong>
                      {comments.length}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            
          </div>

          {/* =====================
              CRITERIOS
              ===================== */}

          <div className="criteria-summary">
            {criterionAverages.map(
              ({
                criterion,
                average,
              }) => (
                <div
                  key={
                    criterion.id
                  }
                  className="criterion-summary-row"
                >
                  <span>
                    {
                      criterion.name
                    }
                  </span>

                  <div>
                    <StarRating
                      value={
                        average
                      }
                      small
                    />

                    <strong>
                      {formatScore(
                        average
                      )}
                    </strong>
                  </div>
                </div>
              )
            )}
          </div>

          {/* =====================
              DATOS
              ===================== */}

          <div className="book-metadata">
            <div>
              <span>
                Argitalpena
              </span>

              <strong>
                {book.publication_date
                  ? new Date(
                      book.publication_date
                    ).getFullYear()
                  : '–'}
              </strong>
            </div>

            <div>
              <span>
                Orrialdeak
              </span>

              <strong>
                {book.pages}
              </strong>
            </div>

            <div>
              <span>
                Hizkuntza
              </span>

              <strong>
                {formatLanguage(
                  book.language
                )}
              </strong>
            </div>
          </div>

          {/* =====================
              SAILKAPENA
              ===================== */}

          <div className="book-classification-detail">
            {genre && (
              <div>
                <span>
                  Generoa
                </span>

                <strong>
                  {genre.name}
                </strong>
              </div>
            )}

            {topic && (
              <div>
                <span>
                  Gaia
                </span>

                <strong>
                  {topic.name}
                </strong>
              </div>
            )}

            {subtopic && (
              <div>
                <span>
                  Azpigaia
                </span>

                <strong>
                  {subtopic.name}
                </strong>
              </div>
            )}
          </div>

          {/* =====================
              ETIKETAK
              ===================== */}

          {tags.length > 0 && (
            <div className="detail-tags">
              {tags.map(
                (tag) => (
                  <span
                    key={tag.id}
                  >
                    #{tag.name}
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          ADIN GOMENDIOA
          ======================================================== */}

      <section className="age-recommendation-section">
        <div className="section-heading-row">
          <div>
            <h2>
              Zein adinetarako
              gomendatzen dute?
            </h2>

            <p>
              Liburua baloratu duten
              pertsonen erantzunak.
            </p>
          </div>
        </div>

        <div className="age-recommendation-chart">
          {ageRecommendations.map(
            (item) => (
              <div
                key={item.id}
                className="age-chart-row"
              >
                <div className="age-chart-label">
                  <strong>
                    {item.label}
                  </strong>

                  <span>
                    {item.count}{' '}
                    pertsona
                  </span>
                </div>

                <div className="age-chart-track">
                  <div
                    className="age-chart-fill"
                    style={{
                      width:
                        `${item.percentage}%`,
                    }}
                  />
                </div>

                <strong className="age-chart-percentage">
                  {Math.round(
                    item.percentage
                  )}
                  %
                </strong>
              </div>
            )
          )}
        </div>
      </section>

      {/* ========================================================
          IRUZKINAK
          ======================================================== */}

      <section className="comments-section">
        <div className="comments-heading">
          <h2>
            Liburuaren iruzkinak
          </h2>

          <span>
            {comments.length}
          </span>
        </div>

        {comments.length === 0 ? (
          <div className="empty-library">
            <strong>
              Oraindik ez dago
              iruzkinik.
            </strong>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map(
              (comment) => (
                <article
                  key={
                    comment.id
                  }
                  className="comment-card"
                >
                  <div className="comment-top-row">
                    <div className="comment-author">
                      <div className="comment-avatar">
                        {comment.initials
                          .slice(
                            0,
                            2
                          )
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {
                            comment.initials
                          }
                        </strong>

                        <span>
                          {comment.level ||
                            (
                              comment.age !==
                                null
                                ? `${comment.age} urte`
                                : '–'
                            )}
                        </span>
                      </div>
                    </div>

                    <button
                      className="trash-button comment-trash-button"
                      onClick={() =>
                        requestDeleteComment(
                          comment.id
                        )
                      }
                      title="Iruzkina ezabatu"
                      aria-label="Iruzkina ezabatu"
                    >
                      🗑️
                    </button>
                  </div>

                  <p>
                    {
                      comment.comment
                    }
                  </p>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {/* ========================================================
          PASSWORD BORRADO
          ======================================================== */}

      {deleteTarget && (
        <div
          className="modal-overlay"
          onMouseDown={
            closeDeleteModal
          }
        >
          <div
            className="modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={
                closeDeleteModal
              }
            >
              ×
            </button>

            <div className="modal-icon">
              🔐
            </div>

            <h2>
              Irakaslearen baimena
            </h2>

            <form
              onSubmit={
                confirmDelete
              }
            >
              <label>
                Pasahitza
              </label>

              <input
                type="password"
                value={
                  teacherPassword
                }
                onChange={(e) =>
                  setTeacherPassword(
                    e.target.value
                  )
                }
                autoFocus
              />

              {passwordError && (
                <p className="error-message">
                  {
                    passwordError
                  }
                </p>
              )}

              <button
                className="danger-button"
                type="submit"
                disabled={
                  deleting
                }
              >
                {deleting
                  ? 'Ezabatzen...'
                  : 'Ezabatu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          PASSWORD BALORAZIOAK
          ======================================================== */}

      {showRatingsPassword && (
        <div
          className="modal-overlay"
          onMouseDown={() =>
            setShowRatingsPassword(
              false
            )
          }
        >
          <div
            className="modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() =>
                setShowRatingsPassword(
                  false
                )
              }
            >
              ×
            </button>

            <div className="modal-icon">
              🔍
            </div>

            <h2>
              Balorazioak ikusi
            </h2>

            <p>
              Atal hau
              irakaslearentzat
              bakarrik da.
            </p>

            <form
              onSubmit={
                checkRatingsPassword
              }
            >
              <label>
                Pasahitza
              </label>

              <input
                type="password"
                value={
                  ratingsPassword
                }
                onChange={(e) =>
                  setRatingsPassword(
                    e.target.value
                  )
                }
                autoFocus
              />

              {ratingsPasswordError && (
                <p className="error-message">
                  {
                    ratingsPasswordError
                  }
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
              >
                Sartu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          BALORAZIO INDIVIDUALAK
          ======================================================== */}

      {showIndividualRatings && (
        <div
          className="modal-overlay"
          onMouseDown={() =>
            setShowIndividualRatings(
              false
            )
          }
        >
          <div
            className="modal individual-ratings-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() =>
                setShowIndividualRatings(
                  false
                )
              }
            >
              ×
            </button>

            <h2>
              Banakako
              balorazioak
            </h2>

            <p>
              {
                ratedRatings.length
              }{' '}
              balorazio
            </p>

            <div className="individual-ratings-list">
              {ratedRatings.map(
                (rating) => {
                  const ratingScores =
                    scores.filter(
                      (score) =>
                        score.rating_id ===
                          rating.id &&
                        activeCriterionIds.includes(
                          score.criterion_id
                        )
                    )

                  const satisfaction =
                    satisfactionCriterion
                      ? ratingScores.find(
                          (score) =>
                            score.criterion_id ===
                            satisfactionCriterion.id
                        )
                      : null

                  const recommendation =
                    recommendationCriterion
                      ? ratingScores.find(
                          (score) =>
                            score.criterion_id ===
                            recommendationCriterion.id
                        )
                      : null

                  const individualOverall =
                    satisfaction &&
                    recommendation
                      ? (
                          satisfaction.score +
                          recommendation.score
                        ) / 2
                      : null

                  const selectedAges =
                    ageRecommendations
                      .filter(
                        (ageRange) =>
                          ratingAgeRanges.some(
                            (
                              relation
                            ) =>
                              relation.rating_id ===
                                rating.id &&
                              relation.age_range_id ===
                                ageRange.id
                          )
                      )

                  return (
                    <article
                      key={
                        rating.id
                      }
                      className="individual-rating-card"
                    >
                      <div className="individual-rating-header">
                        <div>
                          <strong>
                            {
                              rating.initials
                            }
                          </strong>

                          <span>
                            {rating.level ||
                              (
                                rating.age !==
                                  null
                                  ? `${rating.age} urte`
                                  : '–'
                              )}
                            {' · '}
                            {formatDateTime(
                              rating.created_at
                            )}
                          </span>
                        </div>

                        <button
                          className="trash-button comment-trash-button"
                          disabled={
                            deletingRatingId ===
                            rating.id
                          }
                          onClick={() =>
                            deleteIndividualRating(
                              rating.id
                            )
                          }
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="individual-main-score">
                        <StarRating
                          value={
                            individualOverall
                          }
                          small
                        />

                        <strong>
                          {formatScore(
                            individualOverall
                          )}
                        </strong>
                      </div>

                      <div className="individual-criteria">
                        {criteria.map(
                          (
                            criterion
                          ) => {
                            const score =
                              ratingScores.find(
                                (
                                  item
                                ) =>
                                  item.criterion_id ===
                                  criterion.id
                              )

                            return (
                              <div
                                key={
                                  criterion.id
                                }
                              >
                                <span>
                                  {
                                    criterion.name
                                  }
                                </span>

                                <strong>
                                  {score
                                    ? formatScore(
                                        score.score
                                      )
                                    : '–'}
                                </strong>
                              </div>
                            )
                          }
                        )}
                      </div>

                      {selectedAges.length >
                        0 && (
                        <div className="individual-age-tags">
                          <span>
                            Gomendatutako
                            adina:
                          </span>

                          <div>
                            {selectedAges.map(
                              (
                                ageRange
                              ) => (
                                <strong
                                  key={
                                    ageRange.id
                                  }
                                >
                                  {
                                    ageRange.label
                                  }
                                </strong>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  )
                }
              )}

              {ratedRatings.length ===
                0 && (
                <div className="empty-library">
                  Ez dago
                  baloraziorik.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ============================================================
// ESTRELLAS
// ============================================================

function StarRating({
  value,
  small = false,
}: {
  value: number | null
  small?: boolean
}) {
  const className =
    small
      ? 'star-rating star-rating-small'
      : 'star-rating'

  return (
    <span
      className={className}
      aria-label={
        value === null
          ? 'Baloraziorik gabe'
          : `${value.toFixed(1)} / 5`
      }
    >
      {[0, 1, 2, 3, 4].map(
        (index) => {
          const fill =
            value === null
              ? 0
              : Math.max(
                  0,
                  Math.min(
                    1,
                    value -
                      index
                  )
                )

          return (
            <span
              key={index}
              className="single-star"
              style={
                {
                  '--fill':
                    `${fill * 100}%`,
                } as React.CSSProperties
              }
            >
              ★
            </span>
          )
        }
      )}
    </span>
  )
}

function formatScore(
  value: number | null
) {
  if (value === null) {
    return '–'
  }

  return value
    .toFixed(1)
    .replace('.', ',')
}

function formatLanguage(
  language: string
) {
  switch (language) {
    case 'euskara':
      return 'Euskara'

    case 'gaztelera':
      return 'Gaztelera'

    case 'ingelesa':
      return 'Ingelesa'

    default:
      return language
  }
}

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    'eu-ES',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(
    new Date(value)
  )
}

function getCoverFileName(
  publicUrl: string
) {
  try {
    const marker =
      '/book-covers/'

    const index =
      publicUrl.indexOf(
        marker
      )

    if (index === -1) {
      return null
    }

    return decodeURIComponent(
      publicUrl.slice(
        index +
          marker.length
      )
    )
  } catch {
    return null
  }
}