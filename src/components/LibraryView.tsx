import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Props = {
  onBack: () => void
  onRateBook: () => void
  onOpenBook: (bookId: number) => void
}

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
  created_at: string
}

type Option = {
  id: number
  name: string
  position?: number
}

type Tag = {
  id: number
  name: string
}

type Criterion = {
  id: number
  name: string
}

type Rating = {
  id: number
  book_id: number
  comment: string | null
  level: string | null
}

type Score = {
  rating_id: number
  criterion_id: number
  score: number
}

type BookTag = {
  book_id: number
  tag_id: number
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

type BookStats = {
  overallAverage: number | null
  ratingCount: number
  commentCount: number
}

const SCORE_RANGES = [
  {
    key: '0-1',
    label: '0–1',
    min: 0,
    max: 1,
  },
  {
    key: '1-2',
    label: '1–2',
    min: 1,
    max: 2,
  },
  {
    key: '2-3',
    label: '2–3',
    min: 2,
    max: 3,
  },
  {
    key: '3-4',
    label: '3–4',
    min: 3,
    max: 4,
  },
  {
    key: '4-5',
    label: '4–5',
    min: 4,
    max: 5,
  },
]

export default function LibraryView({
  onBack,
  onRateBook,
  onOpenBook,
}: Props) {
  const [books, setBooks] =
    useState<Book[]>([])

  const [genres, setGenres] =
    useState<Option[]>([])

  const [topics, setTopics] =
    useState<Option[]>([])

  const [subtopics, setSubtopics] =
    useState<Option[]>([])

  const [tags, setTags] =
    useState<Tag[]>([])

  const [criteria, setCriteria] =
    useState<Criterion[]>([])

  const [ratings, setRatings] =
    useState<Rating[]>([])

  const [scores, setScores] =
    useState<Score[]>([])

  const [bookTags, setBookTags] =
    useState<BookTag[]>([])

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

  const [searchText, setSearchText] =
    useState('')

  const [showFilters, setShowFilters] =
    useState(false)

  const [mode, setMode] =
    useState<
      'library' | 'most-read'
    >('library')

  // ============================================================
  // FILTROS PENDIENTES
  // ============================================================

  const [
    pendingGenreId,
    setPendingGenreId,
  ] =
    useState<number | null>(
      null
    )

  const [
    pendingTopicId,
    setPendingTopicId,
  ] =
    useState<number | null>(
      null
    )

  const [
    pendingSubtopicId,
    setPendingSubtopicId,
  ] =
    useState<number | null>(
      null
    )

  const [
    pendingTagIds,
    setPendingTagIds,
  ] =
    useState<number[]>([])

  const [
    pendingAgeRangeIds,
    setPendingAgeRangeIds,
  ] =
    useState<number[]>([])

  const [
    pendingLanguages,
    setPendingLanguages,
  ] =
    useState<string[]>([])

  const [
    pendingMinPages,
    setPendingMinPages,
  ] =
    useState('')

  const [
    pendingMaxPages,
    setPendingMaxPages,
  ] =
    useState('')

  const [
    pendingCriterionRanges,
    setPendingCriterionRanges,
  ] = useState<
    Record<number, string[]>
  >({})

  // ============================================================
  // FILTROS APLICADOS
  // ============================================================

  const [
    genreId,
    setGenreId,
  ] =
    useState<number | null>(
      null
    )

  const [
    topicId,
    setTopicId,
  ] =
    useState<number | null>(
      null
    )

  const [
    subtopicId,
    setSubtopicId,
  ] =
    useState<number | null>(
      null
    )

  const [
    selectedTagIds,
    setSelectedTagIds,
  ] =
    useState<number[]>([])

  const [
    selectedAgeRangeIds,
    setSelectedAgeRangeIds,
  ] =
    useState<number[]>([])

  const [
    selectedLanguages,
    setSelectedLanguages,
  ] =
    useState<string[]>([])

  const [
    minPages,
    setMinPages,
  ] =
    useState('')

  const [
    maxPages,
    setMaxPages,
  ] =
    useState('')

  const [
    selectedCriterionRanges,
    setSelectedCriterionRanges,
  ] = useState<
    Record<number, string[]>
  >({})

  useEffect(() => {
    loadLibrary()
  }, [])

  // ============================================================
  // CARGAR DATOS
  // ============================================================

  async function loadLibrary() {
    try {
      setLoading(true)
      setError('')

      const [
        booksResult,
        genresResult,
        topicsResult,
        subtopicsResult,
        tagsResult,
        criteriaResult,
        ratingsResult,
        bookTagsResult,
        ageRangesResult,
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
            subtopic_id,
            created_at
          `)
          .order(
            'created_at',
            {
              ascending: false,
            }
          ),

        supabase
          .from('genres')
          .select(
            'id, name, position'
          )
          .order('position'),

        supabase
          .from('topics')
          .select(
            'id, name, position'
          )
          .order('position'),

        supabase
          .from('subtopics')
          .select(
            'id, name, position'
          )
          .order('position'),

        supabase
          .from('tags')
          .select(
            'id, name'
          )
          .order('name'),

        supabase
          .from('criteria')
          .select(
            'id, name'
          )
          .eq(
            'active',
            true
          )
          .order(
            'position',
            {
              ascending: true,
            }
          ),

        supabase
          .from('ratings')
          .select(`
            id,
            book_id,
            comment,
            level
          `),

        supabase
          .from('book_tags')
          .select(`
            book_id,
            tag_id
          `),

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
          .order(
            'position'
          ),
      ])

      const results = [
        booksResult,
        genresResult,
        topicsResult,
        subtopicsResult,
        tagsResult,
        criteriaResult,
        ratingsResult,
        bookTagsResult,
        ageRangesResult,
      ]

      const firstError =
        results.find(
          (result) =>
            result.error
        )?.error

      if (firstError) {
        throw firstError
      }

      const loadedBooks =
        (
          booksResult.data ??
          []
        ) as Book[]

      const loadedRatings =
        (
          ratingsResult.data ??
          []
        ) as Rating[]

      setBooks(
        loadedBooks
      )

      setGenres(
        genresResult.data ??
          []
      )

      setTopics(
        topicsResult.data ??
          []
      )

      setSubtopics(
        subtopicsResult.data ??
          []
      )

      setTags(
        tagsResult.data ??
          []
      )

      setCriteria(
        criteriaResult.data ??
          []
      )

      setRatings(
        loadedRatings
      )

      setBookTags(
        bookTagsResult.data ??
          []
      )

      setAgeRanges(
        ageRangesResult.data ??
          []
      )

      // Narratiba preseleccionada
      const narratiba =
        genresResult.data?.find(
          (genre) =>
            genre.name ===
            'Narratiba'
        )

      if (narratiba) {
        setPendingGenreId(
          narratiba.id
        )

        setGenreId(
          narratiba.id
        )
      }

      const ratingIds =
        loadedRatings.map(
          (rating) =>
            rating.id
        )

      if (
        ratingIds.length >
        0
      ) {
        const [
          scoresResult,
          ratingAgesResult,
        ] =
          await Promise.all([
            supabase
              .from(
                'rating_scores'
              )
              .select(`
                rating_id,
                criterion_id,
                score
              `)
              .in(
                'rating_id',
                ratingIds
              ),

            supabase
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
              ),
          ])

        if (
          scoresResult.error
        ) {
          throw scoresResult.error
        }

        if (
          ratingAgesResult.error
        ) {
          throw ratingAgesResult.error
        }

        setScores(
          (
            scoresResult.data ??
            []
          ).map(
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
          ratingAgesResult.data ??
            []
        )
      } else {
        setScores([])
        setRatingAgeRanges(
          []
        )
      }
    } catch (err) {
      console.error(
        err
      )

      setError(
        'Ezin izan da liburutegia kargatu.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // CRITERIOS PARA LA NOTA GENERAL
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

  // ============================================================
  // ESTADÍSTICAS GENERALES POR LIBRO
  // ============================================================

  const statsByBook =
    useMemo(() => {
      const stats =
        new Map<
          number,
          BookStats
        >()

      books.forEach(
        (book) => {
          const bookRatings =
            ratings.filter(
              (rating) =>
                rating.book_id ===
                book.id
            )

          const individualAverages:
            number[] = []

          bookRatings.forEach(
            (rating) => {
              if (
                !satisfactionCriterion ||
                !recommendationCriterion
              ) {
                return
              }

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
                satisfactionScore &&
                recommendationScore
              ) {
                individualAverages.push(
                  (
                    satisfactionScore.score +
                    recommendationScore.score
                  ) / 2
                )
              }
            }
          )

          const overallAverage =
            individualAverages.length >
            0
              ? individualAverages.reduce(
                  (
                    sum,
                    value
                  ) =>
                    sum +
                    value,
                  0
                ) /
                individualAverages.length
              : null

          const commentCount =
            bookRatings.filter(
              (rating) =>
                typeof rating.comment ===
                  'string' &&
                rating.comment
                  .trim()
                  .length >
                  0
            ).length

          stats.set(
            book.id,
            {
              overallAverage,

              ratingCount:
                individualAverages.length,

              commentCount,
            }
          )
        }
      )

      return stats
    }, [
      books,
      ratings,
      scores,
      satisfactionCriterion,
      recommendationCriterion,
    ])

  // ============================================================
  // MEDIA DE CADA IRIZPIDE POR LIBRO
  // ============================================================

  const criterionAveragesByBook =
    useMemo(() => {
      const result =
        new Map<
          number,
          Record<
            number,
            number | null
          >
        >()

      books.forEach(
        (book) => {
          const bookRatingIds =
            new Set(
              ratings
                .filter(
                  (rating) =>
                    rating.book_id ===
                    book.id
                )
                .map(
                  (rating) =>
                    rating.id
                )
            )

          const averages:
            Record<
              number,
              number | null
            > = {}

          criteria.forEach(
            (criterion) => {
              const criterionScores =
                scores.filter(
                  (score) =>
                    score.criterion_id ===
                      criterion.id &&
                    bookRatingIds.has(
                      score.rating_id
                    )
                )

              if (
                criterionScores.length ===
                0
              ) {
                averages[
                  criterion.id
                ] = null
              } else {
                averages[
                  criterion.id
                ] =
                  criterionScores.reduce(
                    (
                      sum,
                      score
                    ) =>
                      sum +
                      score.score,
                    0
                  ) /
                  criterionScores.length
              }
            }
          )

          result.set(
            book.id,
            averages
          )
        }
      )

      return result
    }, [
      books,
      ratings,
      scores,
      criteria,
    ])

  // ============================================================
  // ETIQUETAS POR LIBRO
  // ============================================================

  function getBookTags(
    bookId: number
  ) {
    const ids =
      bookTags
        .filter(
          (relation) =>
            relation.book_id ===
            bookId
        )
        .map(
          (relation) =>
            relation.tag_id
        )

    return tags.filter(
      (tag) =>
        ids.includes(
          tag.id
        )
    )
  }

  function getTopicName(
    topicIdValue:
      | number
      | null
  ) {
    if (!topicIdValue) {
      return null
    }

    return (
      topics.find(
        (topic) =>
          topic.id ===
          topicIdValue
      )?.name ?? null
    )
  }

  // ============================================================
  // FILTRADO
  // ============================================================

  const filteredBooks =
    useMemo(() => {
      const normalizedSearch =
        normalizeText(
          searchText
        )

      return books.filter(
        (book) => {
          // ==================================
          // BUSCADOR
          // ==================================

          if (
            normalizedSearch
          ) {
            const haystack =
              normalizeText(
                `${book.title} ${book.author}`
              )

            if (
              !haystack.includes(
                normalizedSearch
              )
            ) {
              return false
            }
          }

          // ==================================
          // GENEROA
          // ==================================

          if (
            genreId &&
            book.genre_id !==
              genreId
          ) {
            return false
          }

          // ==================================
          // GAIA
          // ==================================

          if (
            topicId &&
            book.topic_id !==
              topicId
          ) {
            return false
          }

          // ==================================
          // AZPIGAIA
          // ==================================

          if (
            subtopicId &&
            book.subtopic_id !==
              subtopicId
          ) {
            return false
          }

          // ==================================
          // ETIKETAK
          // OR dentro de las etiquetas
          // ==================================

          if (
            selectedTagIds.length >
            0
          ) {
            const bookTagIds =
              bookTags
                .filter(
                  (relation) =>
                    relation.book_id ===
                    book.id
                )
                .map(
                  (relation) =>
                    relation.tag_id
                )

            const matchesAnyTag =
              selectedTagIds.some(
                (tagId) =>
                  bookTagIds.includes(
                    tagId
                  )
              )

            if (
              !matchesAnyTag
            ) {
              return false
            }
          }

          // ==================================
          // HIZKUNTZA
          // ==================================

          if (
            selectedLanguages.length >
              0 &&
            !selectedLanguages.includes(
              book.language
            )
          ) {
            return false
          }

          // ==================================
          // ORRIALDEAK
          // ==================================

          if (
            minPages &&
            book.pages <
              Number(
                minPages
              )
          ) {
            return false
          }

          if (
            maxPages &&
            book.pages >
              Number(
                maxPages
              )
          ) {
            return false
          }

          // ==================================
          // IRIZPIDEAK
          //
          // Entre criterios = AND
          // Dentro de un criterio = OR
          // ==================================

          const criterionFilters =
            Object.entries(
              selectedCriterionRanges
            ).filter(
              (
                [, ranges]
              ) =>
                ranges.length >
                0
            )

          if (
            criterionFilters.length >
            0
          ) {
            const bookAverages =
              criterionAveragesByBook.get(
                book.id
              )

            if (
              !bookAverages
            ) {
              return false
            }

            const matchesAllCriteria =
              criterionFilters.every(
                ([
                  criterionIdText,
                  selectedRanges,
                ]) => {
                  const criterionId =
                    Number(
                      criterionIdText
                    )

                  const average =
                    bookAverages[
                      criterionId
                    ]

                  if (
                    average ===
                      null ||
                    average ===
                      undefined
                  ) {
                    return false
                  }

                  return selectedRanges.some(
                    (rangeKey) =>
                      scoreMatchesRange(
                        average,
                        rangeKey
                      )
                  )
                }
              )

            if (
              !matchesAllCriteria
            ) {
              return false
            }
          }

          // ==================================
          // GOMENDATUTAKO ADINA
          // OR entre rangos seleccionados
          // ==================================

          if (
            selectedAgeRangeIds.length >
            0
          ) {
            const bookRatingIds =
              ratings
                .filter(
                  (rating) =>
                    rating.book_id ===
                    book.id
                )
                .map(
                  (rating) =>
                    rating.id
                )

            const matchesAge =
              ratingAgeRanges.some(
                (relation) =>
                  bookRatingIds.includes(
                    relation.rating_id
                  ) &&
                  selectedAgeRangeIds.includes(
                    relation.age_range_id
                  )
              )

            if (
              !matchesAge
            ) {
              return false
            }
          }

          return true
        }
      )
    }, [
      books,
      searchText,
      genreId,
      topicId,
      subtopicId,
      selectedTagIds,
      selectedLanguages,
      minPages,
      maxPages,
      selectedCriterionRanges,
      selectedAgeRangeIds,
      bookTags,
      ratings,
      ratingAgeRanges,
      criterionAveragesByBook,
    ])

  // ============================================================
  // IRAKURRIENAK
  // ============================================================

  const mostReadByAge =
    useMemo(() => {
      return ageRanges.map(
        (ageRange) => {
          const ranking =
            books
              .map(
                (book) => {
                  const bookRatings =
                    ratings.filter(
                      (rating) =>
                        rating.book_id ===
                        book.id
                    )

                  const ratingIds =
                    new Set(
                      bookRatings.map(
                        (rating) =>
                          rating.id
                      )
                    )

                  const count =
                    ratingAgeRanges.filter(
                      (relation) =>
                        relation.age_range_id ===
                          ageRange.id &&
                        ratingIds.has(
                          relation.rating_id
                        )
                    ).length

                  return {
                    book,
                    count,
                  }
                }
              )
              .filter(
                (item) =>
                  item.count >
                  0
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  b.count -
                    a.count ||
                  a.book.title.localeCompare(
                    b.book.title,
                    'eu'
                  )
              )

          return {
            ageRange,
            books: ranking,
          }
        }
      )
    }, [
      books,
      ratings,
      ratingAgeRanges,
      ageRanges,
    ])

  // ============================================================
  // FILTROS · FUNCIONES
  // ============================================================

  function togglePendingTag(
    tagId: number
  ) {
    setPendingTagIds(
      (current) =>
        current.includes(
          tagId
        )
          ? current.filter(
              (id) =>
                id !==
                tagId
            )
          : [
              ...current,
              tagId,
            ]
    )
  }

  function togglePendingAge(
    ageId: number
  ) {
    setPendingAgeRangeIds(
      (current) =>
        current.includes(
          ageId
        )
          ? current.filter(
              (id) =>
                id !==
                ageId
            )
          : [
              ...current,
              ageId,
            ]
    )
  }

  function togglePendingLanguage(
    language: string
  ) {
    setPendingLanguages(
      (current) =>
        current.includes(
          language
        )
          ? current.filter(
              (value) =>
                value !==
                language
            )
          : [
              ...current,
              language,
            ]
    )
  }

  function togglePendingCriterionRange(
    criterionId: number,
    rangeKey: string
  ) {
    setPendingCriterionRanges(
      (current) => {
        const currentRanges =
          current[
            criterionId
          ] ?? []

        const newRanges =
          currentRanges.includes(
            rangeKey
          )
            ? currentRanges.filter(
                (value) =>
                  value !==
                  rangeKey
              )
            : [
                ...currentRanges,
                rangeKey,
              ]

        return {
          ...current,

          [criterionId]:
            newRanges,
        }
      }
    )
  }

  function applyFilters() {
    setGenreId(
      pendingGenreId
    )

    setTopicId(
      pendingTopicId
    )

    setSubtopicId(
      pendingSubtopicId
    )

    setSelectedTagIds(
      pendingTagIds
    )

    setSelectedAgeRangeIds(
      pendingAgeRangeIds
    )

    setSelectedLanguages(
      pendingLanguages
    )

    setMinPages(
      pendingMinPages
    )

    setMaxPages(
      pendingMaxPages
    )

    setSelectedCriterionRanges(
      pendingCriterionRanges
    )
  }

  function clearFilters() {
    const narratiba =
      genres.find(
        (genre) =>
          genre.name ===
          'Narratiba'
      )

    const defaultGenre =
      narratiba?.id ??
      null

    setPendingGenreId(
      defaultGenre
    )

    setGenreId(
      defaultGenre
    )

    setPendingTopicId(
      null
    )

    setTopicId(
      null
    )

    setPendingSubtopicId(
      null
    )

    setSubtopicId(
      null
    )

    setPendingTagIds(
      []
    )

    setSelectedTagIds(
      []
    )

    setPendingAgeRangeIds(
      []
    )

    setSelectedAgeRangeIds(
      []
    )

    setPendingLanguages(
      []
    )

    setSelectedLanguages(
      []
    )

    setPendingMinPages(
      ''
    )

    setMinPages(
      ''
    )

    setPendingMaxPages(
      ''
    )

    setMaxPages(
      ''
    )

    setPendingCriterionRanges(
      {}
    )

    setSelectedCriterionRanges(
      {}
    )
  }

  // ============================================================
  // CONTADOR DE FILTROS ACTIVOS
  // ============================================================

  const hasCriterionFilters =
    Object.values(
      selectedCriterionRanges
    ).some(
      (ranges) =>
        ranges.length >
        0
    )

  const activeFilterCount =
    [
      genreId,
      topicId,
      subtopicId,

      selectedTagIds.length >
        0,

      selectedAgeRangeIds.length >
        0,

      selectedLanguages.length >
        0,

      minPages,

      maxPages,

      hasCriterionFilters,
    ].filter(
      Boolean
    ).length

  // ============================================================
  // CARGANDO
  // ============================================================

  if (loading) {
    return (
      <section className="page">
        <p className="placeholder">
          Liburutegia
          kargatzen...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <button
          className="back-button"
          onClick={onBack}
        >
          ← Itzuli
        </button>

        <div className="empty-library">
          {error}
        </div>
      </section>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="page library-page">
      <div className="library-topbar">
        <button
          className="back-button"
          onClick={onBack}
        >
          ← Itzuli
        </button>

        <button
          className="primary-button"
          onClick={
            onRateBook
          }
        >
          Liburu bat
          baloratu
        </button>
      </div>

      <header className="library-header">
        <div className="small-logo">
          LIBURUBILA
        </div>

        <h1>
          Zer irakur dezaket?
        </h1>

        <p>
          Arakatu eta erabaki
          zer irakurri nahi
          duzun.
        </p>
      </header>

      {/* ======================================================
          LIBURUTEGIA / IRAKURRIENAK
          ====================================================== */}

      <div className="library-mode-switch">
        <button
          type="button"
          className={
            mode ===
            'library'
              ? 'selected'
              : ''
          }
          onClick={() =>
            setMode(
              'library'
            )
          }
        >
          Liburutegia
        </button>

        <button
          type="button"
          className={
            mode ===
            'most-read'
              ? 'selected'
              : ''
          }
          onClick={() =>
            setMode(
              'most-read'
            )
          }
        >
          Irakurrienak
        </button>
      </div>

      {mode ===
      'most-read' ? (
        <MostReadView
          sections={
            mostReadByAge
          }
          onOpenBook={
            onOpenBook
          }
        />
      ) : (
        <>
          {/* ==================================================
              BUSCADOR
              ================================================== */}

          <div className="library-search-row">
            <input
              type="search"
              value={
                searchText
              }
              onChange={(
                e
              ) =>
                setSearchText(
                  e.target
                    .value
                )
              }
              placeholder="Bilatu izenburuaren edo egilearen arabera..."
            />

            <button
              type="button"
              className="filters-toggle-button"
              onClick={() =>
                setShowFilters(
                  (
                    current
                  ) =>
                    !current
                )
              }
            >
              ⚙ Iragazkiak

              {activeFilterCount >
                0 && (
                <span>
                  {
                    activeFilterCount
                  }
                </span>
              )}
            </button>
          </div>

          {/* ==================================================
              FILTROS
              ================================================== */}

          {showFilters && (
            <section className="filters-panel">
              {/* ======================
                  GENEROA
                  ====================== */}

              <FilterSingleSelect
                title="Generoa"
                options={
                  genres
                }
                selectedId={
                  pendingGenreId
                }
                onSelect={
                  setPendingGenreId
                }
              />

              {/* ======================
                  GAIA
                  ====================== */}

              <FilterSingleSelect
                title="Gaia"
                options={
                  topics
                }
                selectedId={
                  pendingTopicId
                }
                onSelect={
                  setPendingTopicId
                }
                allowClear
              />

              {/* ======================
                  AZPIGAIA
                  ====================== */}

              <FilterSingleSelect
                title="Azpigaia"
                options={
                  subtopics
                }
                selectedId={
                  pendingSubtopicId
                }
                onSelect={
                  setPendingSubtopicId
                }
                allowClear
              />

              {/* ======================
                  ETIKETAK
                  ====================== */}

              <div className="filter-group">
                <h3>
                  Etiketak
                </h3>

                <p>
                  Nahi dituzun
                  guztiak aukeratu.
                  Liburuak
                  aukeratutako
                  etiketetako bat
                  izatea nahikoa da.
                </p>

                <div className="filter-chip-list">
                  {tags.map(
                    (tag) => (
                      <button
                        key={
                          tag.id
                        }
                        type="button"
                        className={
                          pendingTagIds.includes(
                            tag.id
                          )
                            ? 'filter-chip selected'
                            : 'filter-chip'
                        }
                        onClick={() =>
                          togglePendingTag(
                            tag.id
                          )
                        }
                      >
                        #
                        {
                          tag.name
                        }
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* ======================
                  GOMENDATUTAKO ADINA
                  ====================== */}

              <div className="filter-group">
                <h3>
                  Gomendatutako
                  adina
                </h3>

                <div className="filter-chip-list">
                  {ageRanges.map(
                    (
                      ageRange
                    ) => (
                      <button
                        key={
                          ageRange.id
                        }
                        type="button"
                        className={
                          pendingAgeRangeIds.includes(
                            ageRange.id
                          )
                            ? 'filter-chip selected'
                            : 'filter-chip'
                        }
                        onClick={() =>
                          togglePendingAge(
                            ageRange.id
                          )
                        }
                      >
                        {
                          ageRange.label
                        }
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* ======================
                  IRIZPIDEAK
                  ====================== */}

              <div className="filter-group">
                <h3>
                  Irizpideak
                </h3>

                <p>
                  Irizpide
                  bakoitzean nahi
                  dituzun tarteak
                  aukeratu.
                  Aukeratutako
                  irizpide guztiak
                  bete behar ditu
                  liburuak.
                </p>

                <div className="criteria-filter-list">
                  {criteria.map(
                    (
                      criterion
                    ) => {
                      const selectedRanges =
                        pendingCriterionRanges[
                          criterion
                            .id
                        ] ??
                        []

                      return (
                        <div
                          key={
                            criterion.id
                          }
                          className="criterion-filter-block"
                        >
                          <strong>
                            {
                              criterion.name
                            }
                          </strong>

                          <div className="filter-chip-list">
                            {SCORE_RANGES.map(
                              (
                                range
                              ) => (
                                <button
                                  key={
                                    range.key
                                  }
                                  type="button"
                                  className={
                                    selectedRanges.includes(
                                      range.key
                                    )
                                      ? 'filter-chip selected'
                                      : 'filter-chip'
                                  }
                                  onClick={() =>
                                    togglePendingCriterionRange(
                                      criterion.id,
                                      range.key
                                    )
                                  }
                                >
                                  {
                                    range.label
                                  }
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              </div>

              {/* ======================
                  HIZKUNTZA
                  ====================== */}

              <div className="filter-group">
                <h3>
                  Hizkuntza
                </h3>

                <div className="filter-chip-list">
                  {[
                    [
                      'euskara',
                      'Euskara',
                    ],
                    [
                      'gaztelera',
                      'Gaztelera',
                    ],
                    [
                      'ingelesa',
                      'Ingelesa',
                    ],
                  ].map(
                    ([
                      value,
                      label,
                    ]) => (
                      <button
                        key={
                          value
                        }
                        type="button"
                        className={
                          pendingLanguages.includes(
                            value
                          )
                            ? 'filter-chip selected'
                            : 'filter-chip'
                        }
                        onClick={() =>
                          togglePendingLanguage(
                            value
                          )
                        }
                      >
                        {
                          label
                        }
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* ======================
                  ORRIALDEAK
                  ====================== */}

              <div className="filter-group">
                <h3>
                  Orrialdeak
                </h3>

                <div className="pages-filter-grid">
                  <label>
                    <span>
                      Gutxienez
                    </span>

                    <input
                      type="number"
                      min="1"
                      value={
                        pendingMinPages
                      }
                      onChange={(
                        e
                      ) =>
                        setPendingMinPages(
                          e
                            .target
                            .value
                        )
                      }
                      placeholder="0"
                    />
                  </label>

                  <label>
                    <span>
                      Gehienez
                    </span>

                    <input
                      type="number"
                      min="1"
                      value={
                        pendingMaxPages
                      }
                      onChange={(
                        e
                      ) =>
                        setPendingMaxPages(
                          e
                            .target
                            .value
                        )
                      }
                      placeholder="500"
                    />
                  </label>
                </div>
              </div>

              {/* ======================
                  BOTONES
                  ====================== */}

              <div className="filters-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    clearFilters
                  }
                >
                  Garbitu
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    applyFilters
                  }
                >
                  Bilatu
                </button>
              </div>
            </section>
          )}

          {/* ==================================================
              RESULTADOS
              ================================================== */}

          <div className="library-results-summary">
            <strong>
              {
                filteredBooks.length
              }{' '}
              liburu aurkitu dira
            </strong>
          </div>

          {filteredBooks.length ===
          0 ? (
            <div className="empty-library">
              <strong>
                Ez da libururik
                aurkitu.
              </strong>

              <p>
                Saiatu iragazki
                batzuk aldatzen.
              </p>
            </div>
          ) : (
            <div className="library-grid">
              {filteredBooks.map(
                (book) => (
                  <BookCard
                    key={
                      book.id
                    }
                    book={
                      book
                    }
                    stats={
                      statsByBook.get(
                        book.id
                      ) ?? {
                        overallAverage:
                          null,

                        ratingCount:
                          0,

                        commentCount:
                          0,
                      }
                    }
                    topicName={
                      getTopicName(
                        book.topic_id
                      )
                    }
                    tags={
                      getBookTags(
                        book.id
                      )
                    }
                    onOpen={() =>
                      onOpenBook(
                        book.id
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ============================================================
// SELECTOR ÚNICO
// ============================================================

function FilterSingleSelect({
  title,
  options,
  selectedId,
  onSelect,
  allowClear = false,
}: {
  title: string
  options: Option[]
  selectedId:
    | number
    | null
  onSelect: (
    value:
      | number
      | null
  ) => void
  allowClear?: boolean
}) {
  return (
    <div className="filter-group">
      <h3>
        {title}
      </h3>

      <div className="filter-chip-list">
        {options.map(
          (option) => (
            <button
              key={
                option.id
              }
              type="button"
              className={
                selectedId ===
                option.id
                  ? 'filter-chip selected'
                  : 'filter-chip'
              }
              onClick={() => {
                if (
                  allowClear &&
                  selectedId ===
                    option.id
                ) {
                  onSelect(
                    null
                  )
                } else {
                  onSelect(
                    option.id
                  )
                }
              }}
            >
              {
                option.name
              }
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ============================================================
// TARJETA
// ============================================================

function BookCard({
  book,
  stats,
  topicName,
  tags,
  onOpen,
}: {
  book: Book
  stats: BookStats
  topicName:
    | string
    | null
  tags: Tag[]
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      className="library-book-card"
      onClick={
        onOpen
      }
    >
      <div className="library-book-cover">
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
          <div className="library-no-cover">
            📖
          </div>
        )}
      </div>

      <div className="library-book-info">
        <h2>
          {
            book.title
          }
        </h2>

        <p className="library-book-author">
          {
            book.author
          }
        </p>

        {topicName && (
          <span className="book-topic-badge">
            {
              topicName
            }
          </span>
        )}

        <div className="book-card-tags">
          {tags
            .slice(
              0,
              3
            )
            .map(
              (tag) => (
                <span
                  key={
                    tag.id
                  }
                >
                  #
                  {
                    tag.name
                  }
                </span>
              )
            )}
        </div>

        <div className="book-card-rating">
          <StarRating
            value={
              stats.overallAverage
            }
          />

          <strong>
            {formatScore(
              stats.overallAverage
            )}
          </strong>
        </div>

        <div className="book-card-counts">
          <span>
            Balorazioak:{' '}
            <strong>
              {
                stats.ratingCount
              }
            </strong>
          </span>

          <span>
            Iruzkinak:{' '}
            <strong>
              {
                stats.commentCount
              }
            </strong>
          </span>
        </div>
      </div>
    </button>
  )
}

// ============================================================
// IRAKURRIENAK
// ============================================================

function MostReadView({
  sections,
  onOpenBook,
}: {
  sections: {
    ageRange: AgeRange

    books: {
      book: Book
      count: number
    }[]
  }[]

  onOpenBook: (
    id: number
  ) => void
}) {
  return (
    <div className="most-read-view">
      <header className="most-read-header">
        <h2>
          Irakurrienak
        </h2>

        <p>
          Adin-tarte
          bakoitzean
          balorazio gehien
          jaso dituzten
          liburuak.
        </p>
      </header>

      {sections.map(
        (section) => (
          <section
            key={
              section
                .ageRange
                .id
            }
            className="most-read-section"
          >
            <h3>
              {
                section
                  .ageRange
                  .label
              }
            </h3>

            {section.books.length ===
            0 ? (
              <p className="most-read-empty">
                Oraindik ez dago
                daturik.
              </p>
            ) : (
              <div className="most-read-list">
                {section.books
                  .slice(
                    0,
                    10
                  )
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          item
                            .book
                            .id
                        }
                        className="most-read-row"
                      >
                        <span className="most-read-position">
                          {
                            index +
                            1
                          }
                        </span>

                        <div className="most-read-mini-cover">
                          {item
                            .book
                            .cover_url ? (
                            <img
                              src={
                                item
                                  .book
                                  .cover_url
                              }
                              alt={
                                item
                                  .book
                                  .title
                              }
                            />
                          ) : (
                            <span>
                              📖
                            </span>
                          )}
                        </div>

                        <div className="most-read-book-info">
                          <strong>
                            {
                              item
                                .book
                                .title
                            }
                          </strong>

                          <span>
                            {
                              item
                                .book
                                .author
                            }
                          </span>
                        </div>

                        <div className="most-read-count">
                          <strong>
                            {
                              item
                                .count
                            }
                          </strong>

                          <span>
                            balorazio
                          </span>
                        </div>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            onOpenBook(
                              item
                                .book
                                .id
                            )
                          }
                        >
                          Ikusi
                        </button>
                      </div>
                    )
                  )}
              </div>
            )}
          </section>
        )
      )}
    </div>
  )
}

// ============================================================
// ESTRELLAS
// ============================================================

function StarRating({
  value,
}: {
  value:
    | number
    | null
}) {
  return (
    <span className="star-rating star-rating-small">
      {[0, 1, 2, 3, 4].map(
        (index) => {
          const fill =
            value ===
            null
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

// ============================================================
// UTILIDADES
// ============================================================

function formatScore(
  value:
    | number
    | null
) {
  if (
    value === null
  ) {
    return '–'
  }

  return value
    .toFixed(1)
    .replace(
      '.',
      ','
    )
}

function normalizeText(
  value: string
) {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .trim()
}

function scoreMatchesRange(
  score: number,
  rangeKey: string
) {
  const range =
    SCORE_RANGES.find(
      (item) =>
        item.key ===
        rangeKey
    )

  if (!range) {
    return false
  }

  // El último intervalo
  // incluye exactamente 5.
  if (
    range.min === 4 &&
    range.max === 5
  ) {
    return (
      score >= 4 &&
      score <= 5
    )
  }

  // Los demás:
  // mínimo incluido,
  // máximo excluido.
  return (
    score >= range.min &&
    score < range.max
  )
}