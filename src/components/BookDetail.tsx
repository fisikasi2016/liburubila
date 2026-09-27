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
}

type Style = {
  id: number
  name: string
}

type Criterion = {
  id: number
  name: string
  position: number
}

type Rating = {
  id: number
  initials: string
  age: number
  comment: string | null
  created_at: string
}

type Score = {
  rating_id: number
  criterion_id: number
  score: number
}

type BookStyleRelation = {
  style_id: number
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

  const [styles, setStyles] =
    useState<Style[]>([])

  const [criteria, setCriteria] =
    useState<Criterion[]>([])

  const [ratings, setRatings] =
    useState<Rating[]>([])

  const [scores, setScores] =
    useState<Score[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // =========================
  // BORRADO LIBRO / COMENTARIO
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

  const [
    deleting,
    setDeleting,
  ] = useState(false)

  // =========================
  // VALORACIONES INDIVIDUALES
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

  async function loadBook() {
    try {
      setLoading(true)
      setError('')

      // =========================
      // LIBRO
      // =========================

      const {
        data: bookData,
        error: bookError,
      } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          publication_date,
          pages,
          language,
          cover_url
        `)
        .eq('id', bookId)
        .single()

      if (bookError) {
        throw bookError
      }

      setBook(bookData)

      // =========================
      // CRITERIOS
      // =========================

      const {
        data: criteriaData,
        error: criteriaError,
      } = await supabase
        .from('criteria')
        .select(`
          id,
          name,
          position
        `)
        .order('position', {
          ascending: true,
        })

      if (criteriaError) {
        console.error(
          'Error criterios:',
          criteriaError
        )
      }

      setCriteria(
        criteriaData ?? []
      )

      // =========================
      // APORTACIONES
      // =========================

      const {
        data: ratingsData,
        error: ratingsError,
      } = await supabase
        .from('ratings')
        .select(`
          id,
          initials,
          age,
          comment,
          created_at
        `)
        .eq('book_id', bookId)
        .order('created_at', {
          ascending: false,
        })

      if (ratingsError) {
        throw ratingsError
      }

      const loadedRatings =
        ratingsData ?? []

      setRatings(loadedRatings)

      // =========================
      // PUNTUACIONES
      // =========================

      const ratingIds =
        loadedRatings.map(
          (rating) =>
            rating.id
        )

      if (ratingIds.length > 0) {
        const {
          data: scoresData,
          error: scoresError,
        } = await supabase
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

        if (scoresError) {
          throw scoresError
        }

        setScores(
          (scoresData ?? []).map(
            (item) => ({
              ...item,
              score: Number(
                item.score
              ),
            })
          )
        )
      } else {
        setScores([])
      }

      // =========================
      // ESTILOS
      // =========================

      const {
        data: relationsData,
        error: relationsError,
      } = await supabase
        .from('book_styles')
        .select('style_id')
        .eq('book_id', bookId)

      if (relationsError) {
        console.error(
          'Error relaciones estilos:',
          relationsError
        )

        setStyles([])
      } else {
        const styleIds =
          (
            (relationsData ??
              []) as BookStyleRelation[]
          ).map(
            (relation) =>
              relation.style_id
          )

        if (styleIds.length > 0) {
          const {
            data: stylesData,
            error: stylesError,
          } = await supabase
            .from('styles')
            .select(`
              id,
              name
            `)
            .in(
              'id',
              styleIds
            )
            .order(
              'name',
              {
                ascending: true,
              }
            )

          if (stylesError) {
            console.error(
              'Error estilos:',
              stylesError
            )

            setStyles([])
          } else {
            setStyles(
              stylesData ?? []
            )
          }
        } else {
          setStyles([])
        }
      }
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

  // =========================
  // DATOS DERIVADOS
  // =========================

  const comments =
    useMemo(() => {
      return ratings
        .filter(
          (rating) =>
            typeof rating.comment ===
              'string' &&
            rating.comment
              .trim()
              .length > 0
        )
        .map(
          (rating) => ({
            ...rating,
            comment:
              rating.comment as string,
          })
        )
    }, [ratings])

  const ratedRatings =
    useMemo(() => {
      return ratings.filter(
        (rating) =>
          scores.some(
            (score) =>
              score.rating_id ===
              rating.id
          )
      )
    }, [ratings, scores])

  const overallAverage =
    useMemo(() => {
      const individualAverages =
        ratedRatings
          .map(
            (rating) => {
              const ratingScores =
                scores.filter(
                  (score) =>
                    score.rating_id ===
                    rating.id
                )

              if (
                ratingScores.length ===
                0
              ) {
                return null
              }

              return (
                ratingScores.reduce(
                  (
                    sum,
                    score
                  ) =>
                    sum +
                    score.score,
                  0
                ) /
                ratingScores.length
              )
            }
          )
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
          (
            sum,
            value
          ) =>
            sum + value,
          0
        ) /
        individualAverages.length
      )
    }, [
      ratedRatings,
      scores,
    ])

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
    }, [
      criteria,
      scores,
    ])

  // =========================
  // BORRAR LIBRO / COMENTARIO
  // =========================

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
        .eq(
          'id',
          ratingId
        )

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
    if (!book) {
      return
    }

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
              'Error borrando portada:',
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
        .eq(
          'id',
          bookId
        )

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

  // =========================
  // ACCESO A RATINGS
  // =========================

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

  // =========================
  // BORRAR RATING INDIVIDUAL
  // =========================

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

      const rating =
        ratings.find(
          (item) =>
            item.id ===
            ratingId
        )

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

  // =========================
  // CARGANDO / ERROR
  // =========================

  if (loading) {
    return (
      <section className="page">
        <p className="placeholder">
          Liburua kargatzen...
        </p>
      </section>
    )
  }

  if (
    error ||
    !book
  ) {
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
            Ezin izan da liburua
            kargatu.
          </strong>
        </div>
      </section>
    )
  }

  // =========================
  // RENDER PRINCIPAL
  // =========================

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
        <div className="book-detail-cover">
          {book.cover_url ? (
            <img
              src={
                book.cover_url
              }
              alt={
                book.title
              }
            />
          ) : (
            <div className="book-detail-no-cover">
              📖
            </div>
          )}
        </div>

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

          {/* =========================
              NOTA GENERAL
              ========================= */}

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
                {overallAverage ===
                null
                  ? '–'
                  : overallAverage
                      .toFixed(1)
                      .replace(
                        '.',
                        ','
                      )}
              </strong>

              <span>
                (
                {
                  ratedRatings.length
                }
                )
              </span>

              <button
                className="rating-inspect-button"
                onClick={
                  requestRatingsAccess
                }
                title="Balorazioak ikusi"
                aria-label="Balorazioak ikusi"
              >
                🔍
              </button>
            </div>
          </div>

          {/* =========================
              CRITERIOS
              ========================= */}

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
                      {average ===
                      null
                        ? '–'
                        : average
                            .toFixed(
                              1
                            )
                            .replace(
                              '.',
                              ','
                            )}
                    </strong>
                  </div>
                </div>
              )
            )}
          </div>

          {/* =========================
              DATOS TÉCNICOS
              ========================= */}

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

          {/* =========================
              ESTILOS
              ========================= */}

          {styles.length > 0 && (
            <div className="detail-styles">
              {styles.map(
                (style) => (
                  <span
                    key={
                      style.id
                    }
                  >
                    {
                      style.name
                    }
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================
          COMENTARIOS
          ========================= */}

      <section className="comments-section">
        <div className="comments-heading">
          <h2>
            Liburuaren iruzkinak
          </h2>

          <span>
            {comments.length}
          </span>
        </div>

        {comments.length ===
        0 ? (
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
                          {
                            comment.age
                          }{' '}
                          urte
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

      {/* =========================
          MODAL BORRADO
          ========================= */}

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
              aria-label="Itxi"
            >
              ×
            </button>

            <div className="modal-icon">
              🔐
            </div>

            <h2>
              Irakaslearen baimena
            </h2>

            <p>
              {deleteTarget.type ===
              'book'
                ? 'Liburua ezabatzeko irakaslearen pasahitza behar da.'
                : 'Iruzkina ezabatzeko irakaslearen pasahitza behar da.'}
            </p>

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
                placeholder="••••••••"
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

      {/* =========================
          PASSWORD PARA RATINGS
          ========================= */}

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
              aria-label="Itxi"
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
              Atal hau irakaslearentzat
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
                placeholder="••••••••"
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

      {/* =========================
          RATINGS INDIVIDUALES
          ========================= */}

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
              aria-label="Itxi"
            >
              ×
            </button>

            <h2>
              Banakako balorazioak
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
                        rating.id
                    )

                  const average =
                    ratingScores.reduce(
                      (
                        sum,
                        score
                      ) =>
                        sum +
                        score.score,
                      0
                    ) /
                    ratingScores.length

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
                            {
                              rating.age
                            }{' '}
                            urte ·{' '}
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
                          title="Balorazioa ezabatu"
                          aria-label="Balorazioa ezabatu"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="individual-main-score">
                        <StarRating
                          value={
                            average
                          }
                          small
                        />

                        <strong>
                          {average
                            .toFixed(
                              1
                            )
                            .replace(
                              '.',
                              ','
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

                            if (!score) {
                              return null
                            }

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
                                  {score.score
                                    .toFixed(
                                      1
                                    )
                                    .replace(
                                      '.',
                                      ','
                                    )}
                                </strong>
                              </div>
                            )
                          }
                        )}
                      </div>
                    </article>
                  )
                }
              )}

              {ratedRatings.length ===
                0 && (
                <div className="empty-library">
                  Ez dago baloraziorik.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// =========================
// ESTRELLAS CORREGIDAS
// =========================

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
      className={
        className
      }
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
              key={
                index
              }
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

// =========================
// FORMATEO DE IDIOMA
// =========================

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

// =========================
// FECHA Y HORA
// =========================

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

// =========================
// NOMBRE PORTADA STORAGE
// =========================

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