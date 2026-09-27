import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Criterion = {
  id: number
  name: string
  position: number
}

type Style = {
  id: number
  name: string
}

type BookStyle = {
  book_id: number
  style_id: number
}

type RatingScore = {
  rating_id: number
  criterion_id: number
  score: number
}

type Rating = {
  id: number
  book_id: number
}

type Book = {
  id: number
  title: string
  author: string
  pages: number
  language: string
  cover_url: string | null
  created_at: string
  recommended: boolean
}

type CriterionAverage = {
  criterionId: number
  average: number
}

type BookWithStats = Book & {
  average: number | null
  ratingCount: number
  styleIds: number[]
  criterionAverages: CriterionAverage[]
}

type RangeKey =
  | '0-1'
  | '1-2'
  | '2-3'
  | '3-4'
  | '4-5'

type FilterState = {
  overallRanges: RangeKey[]
  criterionRanges: Record<number, RangeKey[]>
  styleIds: number[]
  authors: string[]
  languages: string[]
  minPages: string
  maxPages: string
}

type Props = {
  onBack: () => void
  onRateBook: () => void
  onOpenBook: (bookId: number) => void
}

const ratingRanges: {
  key: RangeKey
  label: string
  min: number
  max: number
}[] = [
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

function createEmptyFilters(): FilterState {
  return {
    overallRanges: [],
    criterionRanges: {},
    styleIds: [],
    authors: [],
    languages: [],
    minPages: '',
    maxPages: '',
  }
}

export default function LibraryView({
  onBack,
  onRateBook,
  onOpenBook,
}: Props) {
  const [books, setBooks] =
    useState<BookWithStats[]>([])

  const [criteria, setCriteria] =
    useState<Criterion[]>([])

  const [styles, setStyles] =
    useState<Style[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [
    showRecommendations,
    setShowRecommendations,
  ] = useState(false)

  const [
    showFilters,
    setShowFilters,
  ] = useState(false)

  /*
    pendingFilters:
    lo que el usuario está tocando.

    appliedFilters:
    los filtros que realmente están
    aplicados al grid.
  */

  const [
    pendingFilters,
    setPendingFilters,
  ] = useState<FilterState>(
    createEmptyFilters()
  )

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState<FilterState>(
    createEmptyFilters()
  )

  useEffect(() => {
    loadLibrary()
  }, [])

  async function loadLibrary() {
    try {
      setLoading(true)
      setError('')

      // =========================
      // LIBROS
      // =========================

      const {
        data: booksData,
        error: booksError,
      } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          pages,
          language,
          cover_url,
          created_at,
          recommended
        `)
        .order(
          'created_at',
          {
            ascending: false,
          }
        )

      if (booksError) {
        throw booksError
      }

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
        .eq('active', true)
        .order(
          'position',
          {
            ascending: true,
          }
        )

      if (criteriaError) {
        throw criteriaError
      }

      // =========================
      // ESTILOS
      // =========================

      const {
        data: stylesData,
        error: stylesError,
      } = await supabase
        .from('styles')
        .select(`
          id,
          name
        `)
        .order(
          'name',
          {
            ascending: true,
          }
        )

      if (stylesError) {
        throw stylesError
      }

      // =========================
      // LIBROS - ESTILOS
      // =========================

      const {
        data: bookStylesData,
        error: bookStylesError,
      } = await supabase
        .from('book_styles')
        .select(`
          book_id,
          style_id
        `)

      if (bookStylesError) {
        throw bookStylesError
      }

      // =========================
      // VALORACIONES
      // =========================

      const {
        data: ratingsData,
        error: ratingsError,
      } = await supabase
        .from('ratings')
        .select(`
          id,
          book_id
        `)

      if (ratingsError) {
        throw ratingsError
      }

      // =========================
      // PUNTUACIONES
      // =========================

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

      if (scoresError) {
        throw scoresError
      }

      const loadedCriteria =
        (criteriaData ?? []) as Criterion[]

      const loadedStyles =
        (stylesData ?? []) as Style[]

      const loadedBookStyles =
        (bookStylesData ??
          []) as BookStyle[]

      const loadedRatings =
        (ratingsData ??
          []) as Rating[]

      const loadedScores =
        (
          (scoresData ??
            []) as RatingScore[]
        ).map(
          (item) => ({
            ...item,
            score: Number(
              item.score
            ),
          })
        )

      setCriteria(
        loadedCriteria
      )

      setStyles(
        loadedStyles
      )

      // =========================
      // ESTADÍSTICAS
      // =========================

      const booksWithStats =
        (
          (booksData ??
            []) as Book[]
        ).map(
          (book) => {
            const bookRatings =
              loadedRatings.filter(
                (rating) =>
                  rating.book_id ===
                  book.id
              )

            /*
              Solo cuentan como
              valoraciones aquellas
              aportaciones que tengan
              rating_scores.
            */

            const validRatings =
              bookRatings.filter(
                (rating) =>
                  loadedScores.some(
                    (score) =>
                      score.rating_id ===
                      rating.id
                  )
              )

            const individualAverages =
              validRatings.map(
                (rating) => {
                  const ratingScores =
                    loadedScores.filter(
                      (score) =>
                        score.rating_id ===
                        rating.id
                    )

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

            const average =
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

            // MEDIA DE CADA CRITERIO

            const criterionAverages =
              loadedCriteria
                .map(
                  (criterion) => {
                    const criterionScores =
                      validRatings
                        .map(
                          (rating) =>
                            loadedScores.find(
                              (
                                score
                              ) =>
                                score.rating_id ===
                                  rating.id &&
                                score.criterion_id ===
                                  criterion.id
                            )
                        )
                        .filter(
                          (
                            score
                          ): score is RatingScore =>
                            Boolean(
                              score
                            )
                        )

                    if (
                      criterionScores.length ===
                      0
                    ) {
                      return null
                    }

                    const criterionAverage =
                      criterionScores.reduce(
                        (
                          sum,
                          item
                        ) =>
                          sum +
                          item.score,
                        0
                      ) /
                      criterionScores.length

                    return {
                      criterionId:
                        criterion.id,
                      average:
                        criterionAverage,
                    }
                  }
                )
                .filter(
                  (
                    item
                  ): item is CriterionAverage =>
                    item !== null
                )

            // ESTILOS

            const styleIds =
              loadedBookStyles
                .filter(
                  (relation) =>
                    relation.book_id ===
                    book.id
                )
                .map(
                  (relation) =>
                    relation.style_id
                )

            return {
              ...book,
              average,
              ratingCount:
                validRatings.length,
              styleIds,
              criterionAverages,
            }
          }
        )

      setBooks(
        booksWithStats
      )

      if (
        booksWithStats.some(
          (book) =>
            book.recommended
        )
      ) {
        setShowRecommendations(
          true
        )
      }
    } catch (err) {
      console.error(
        'Error cargando biblioteca:',
        err
      )

      setError(
        'Ezin izan da liburutegia kargatu.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // OPCIONES DE FILTRO
  // =========================

  const authors =
    useMemo(() => {
      return Array.from(
        new Set(
          books.map(
            (book) =>
              book.author
          )
        )
      ).sort((a, b) =>
        a.localeCompare(
          b,
          'eu'
        )
      )
    }, [books])

  const recommendedBooks =
    useMemo(() => {
      return books.filter(
        (book) =>
          book.recommended
      )
    }, [books])

  // =========================
  // RESULTADOS FILTRADOS
  // =========================

  const filteredBooks =
    useMemo(() => {
      return books.filter(
        (book) => {
          // NOTA GENERAL

          if (
            appliedFilters
              .overallRanges
              .length > 0
          ) {
            if (
              book.average ===
              null
            ) {
              return false
            }

            if (
              !valueMatchesRanges(
                book.average,
                appliedFilters.overallRanges
              )
            ) {
              return false
            }
          }

          // CRITERIOS

          for (
            const [
              criterionIdText,
              ranges,
            ] of Object.entries(
              appliedFilters
                .criterionRanges
            )
          ) {
            if (
              ranges.length === 0
            ) {
              continue
            }

            const criterionId =
              Number(
                criterionIdText
              )

            const criterionAverage =
              book.criterionAverages.find(
                (item) =>
                  item.criterionId ===
                  criterionId
              )

            if (
              !criterionAverage
            ) {
              return false
            }

            if (
              !valueMatchesRanges(
                criterionAverage.average,
                ranges
              )
            ) {
              return false
            }
          }

          // ESTILOS
          // OR:
          // basta con que tenga uno
          // de los seleccionados.

          if (
            appliedFilters
              .styleIds.length >
            0
          ) {
            const hasStyle =
              appliedFilters.styleIds.some(
                (styleId) =>
                  book.styleIds.includes(
                    styleId
                  )
              )

            if (!hasStyle) {
              return false
            }
          }

          // AUTORES

          if (
            appliedFilters
              .authors.length >
            0
          ) {
            if (
              !appliedFilters.authors.includes(
                book.author
              )
            ) {
              return false
            }
          }

          // IDIOMAS

          if (
            appliedFilters
              .languages.length >
            0
          ) {
            if (
              !appliedFilters.languages.includes(
                book.language
              )
            ) {
              return false
            }
          }

          // PÁGINAS MÍNIMAS

          if (
            appliedFilters
              .minPages !== ''
          ) {
            if (
              book.pages <
              Number(
                appliedFilters.minPages
              )
            ) {
              return false
            }
          }

          // PÁGINAS MÁXIMAS

          if (
            appliedFilters
              .maxPages !== ''
          ) {
            if (
              book.pages >
              Number(
                appliedFilters.maxPages
              )
            ) {
              return false
            }
          }

          return true
        }
      )
    }, [
      books,
      appliedFilters,
    ])

  // =========================
  // CAMBIAR FILTROS
  // =========================

  function toggleOverallRange(
    range: RangeKey
  ) {
    setPendingFilters(
      (current) => ({
        ...current,

        overallRanges:
          toggleValue(
            current.overallRanges,
            range
          ),
      })
    )
  }

  function toggleCriterionRange(
    criterionId: number,
    range: RangeKey
  ) {
    setPendingFilters(
      (current) => {
        const currentRanges =
          current
            .criterionRanges[
            criterionId
          ] ?? []

        return {
          ...current,

          criterionRanges: {
            ...current
              .criterionRanges,

            [criterionId]:
              toggleValue(
                currentRanges,
                range
              ),
          },
        }
      }
    )
  }

  function toggleStyle(
    styleId: number
  ) {
    setPendingFilters(
      (current) => ({
        ...current,

        styleIds:
          toggleValue(
            current.styleIds,
            styleId
          ),
      })
    )
  }

  function toggleAuthor(
    author: string
  ) {
    setPendingFilters(
      (current) => ({
        ...current,

        authors:
          toggleValue(
            current.authors,
            author
          ),
      })
    )
  }

  function toggleLanguage(
    language: string
  ) {
    setPendingFilters(
      (current) => ({
        ...current,

        languages:
          toggleValue(
            current.languages,
            language
          ),
      })
    )
  }

  function applyFilters() {
    setAppliedFilters({
      overallRanges: [
        ...pendingFilters
          .overallRanges,
      ],

      criterionRanges:
        Object.fromEntries(
          Object.entries(
            pendingFilters
              .criterionRanges
          ).map(
            ([
              key,
              ranges,
            ]) => [
              key,
              [...ranges],
            ]
          )
        ),

      styleIds: [
        ...pendingFilters
          .styleIds,
      ],

      authors: [
        ...pendingFilters
          .authors,
      ],

      languages: [
        ...pendingFilters
          .languages,
      ],

      minPages:
        pendingFilters
          .minPages,

      maxPages:
        pendingFilters
          .maxPages,
    })

    /*
      En móvil es agradable que
      al buscar vuelva directamente
      a los resultados.
    */

    setShowFilters(false)
  }

  function clearFilters() {
    const empty =
      createEmptyFilters()

    setPendingFilters(
      empty
    )

    setAppliedFilters(
      createEmptyFilters()
    )
  }

  const activeFiltersCount =
    countActiveFilters(
      appliedFilters
    )

  return (
    <section className="page">
      {/* CABECERA */}

      <div className="library-header">
        <button
          className="back-button"
          onClick={onBack}
        >
          ← Itzuli
        </button>

        <button
          className="secondary-button"
          onClick={
            onRateBook
          }
        >
          Liburu bat baloratu
        </button>
      </div>

      <div className="small-logo">
        LIBURUBILA
      </div>

      <h1 className="section-title">
        Zer irakur dezaket?
      </h1>

      {/* ACCIONES */}

      <div className="library-actions">
        <button
          className={
            showFilters
              ? 'filter-toggle-button active'
              : 'filter-toggle-button'
          }
          onClick={() =>
            setShowFilters(
              (current) =>
                !current
            )
          }
        >
          ⚙ Iragazkiak

          {activeFiltersCount >
            0 && (
            <span>
              {
                activeFiltersCount
              }
            </span>
          )}
        </button>

        {recommendedBooks.length >
          0 && (
          <button
            className="recommended-books-button"
            onClick={() =>
              setShowRecommendations(
                true
              )
            }
          >
            ★ Gomendatutakoak
          </button>
        )}
      </div>

      {/* FILTROS */}

      {showFilters && (
        <section className="filters-panel">
          <div className="filters-panel-heading">
            <div>
              <h2>
                Iragazkiak
              </h2>

              <p>
                Aukeratu nahi dituzun
                baldintzak eta sakatu
                Bilatu.
              </p>
            </div>

            <button
              className="filters-clear-button"
              onClick={
                clearFilters
              }
            >
              Garbitu
            </button>
          </div>

          {/* NOTA GENERAL */}

          <FilterSection
            title="Nota orokorra"
          >
            <RatingRangeSelector
              selected={
                pendingFilters
                  .overallRanges
              }
              onToggle={
                toggleOverallRange
              }
            />
          </FilterSection>

          {/* CRITERIOS */}

          <FilterSection
            title="Irizpideak"
          >
            <div className="criteria-filter-list">
              {criteria.map(
                (criterion) => (
                  <div
                    key={
                      criterion.id
                    }
                    className="criterion-filter"
                  >
                    <span>
                      {
                        criterion.name
                      }
                    </span>

                    <RatingRangeSelector
                      selected={
                        pendingFilters
                          .criterionRanges[
                          criterion.id
                        ] ?? []
                      }
                      onToggle={(
                        range
                      ) =>
                        toggleCriterionRange(
                          criterion.id,
                          range
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          </FilterSection>

          {/* ESTILOS */}

          <FilterSection
            title="Estiloak"
          >
            <div className="filter-chip-list">
              {styles.map(
                (style) => (
                  <FilterChip
                    key={
                      style.id
                    }
                    active={
                      pendingFilters.styleIds.includes(
                        style.id
                      )
                    }
                    onClick={() =>
                      toggleStyle(
                        style.id
                      )
                    }
                  >
                    {style.name}
                  </FilterChip>
                )
              )}
            </div>
          </FilterSection>

          {/* PÁGINAS */}

          <FilterSection
            title="Orrialde kopurua"
          >
            <div className="pages-filter">
              <div className="field">
                <label>
                  Gutxienez
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    pendingFilters.minPages
                  }
                  onChange={(e) =>
                    setPendingFilters(
                      (
                        current
                      ) => ({
                        ...current,

                        minPages:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div className="field">
                <label>
                  Gehienez
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    pendingFilters.maxPages
                  }
                  onChange={(e) =>
                    setPendingFilters(
                      (
                        current
                      ) => ({
                        ...current,

                        maxPages:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="500"
                />
              </div>
            </div>
          </FilterSection>

          {/* AUTORES */}

          <FilterSection
            title="Idazlea"
          >
            <div className="filter-chip-list">
              {authors.map(
                (author) => (
                  <FilterChip
                    key={
                      author
                    }
                    active={
                      pendingFilters.authors.includes(
                        author
                      )
                    }
                    onClick={() =>
                      toggleAuthor(
                        author
                      )
                    }
                  >
                    {author}
                  </FilterChip>
                )
              )}
            </div>
          </FilterSection>

          {/* IDIOMAS */}

          <FilterSection
            title="Hizkuntza"
          >
            <div className="filter-chip-list">
              <FilterChip
                active={
                  pendingFilters.languages.includes(
                    'euskara'
                  )
                }
                onClick={() =>
                  toggleLanguage(
                    'euskara'
                  )
                }
              >
                Euskara
              </FilterChip>

              <FilterChip
                active={
                  pendingFilters.languages.includes(
                    'gaztelera'
                  )
                }
                onClick={() =>
                  toggleLanguage(
                    'gaztelera'
                  )
                }
              >
                Gaztelera
              </FilterChip>

              <FilterChip
                active={
                  pendingFilters.languages.includes(
                    'ingelesa'
                  )
                }
                onClick={() =>
                  toggleLanguage(
                    'ingelesa'
                  )
                }
              >
                Ingelesa
              </FilterChip>
            </div>
          </FilterSection>

          <button
            className="search-books-button"
            onClick={
              applyFilters
            }
          >
            Bilatu
          </button>
        </section>
      )}

      {/* CONTENIDO */}

      {loading && (
        <p className="placeholder">
          Liburutegia kargatzen...
        </p>
      )}

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        books.length === 0 && (
          <div className="empty-library">
            <strong>
              Oraindik ez dago
              libururik.
            </strong>
          </div>
        )}

      {!loading &&
        !error &&
        books.length > 0 && (
          <>
            <div className="library-results-heading">
              <div>
                <strong>
                  {
                    filteredBooks.length
                  }{' '}
                  {filteredBooks.length ===
                  1
                    ? 'liburu aurkitu da'
                    : 'liburu aurkitu dira'}
                </strong>

                {activeFiltersCount >
                  0 && (
                  <span>
                    {
                      activeFiltersCount
                    }{' '}
                    iragazki aktibo
                  </span>
                )}
              </div>

              {activeFiltersCount >
                0 && (
                <button
                  onClick={
                    clearFilters
                  }
                >
                  Iragazkiak kendu
                </button>
              )}
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
                  batzuk kentzen.
                </p>
              </div>
            ) : (
              <div className="books-grid">
                {filteredBooks.map(
                  (book) => (
                    <BookCard
                      key={
                        book.id
                      }
                      book={
                        book
                      }
                      onOpen={
                        onOpenBook
                      }
                    />
                  )
                )}
              </div>
            )}
          </>
        )}

      {/* GOMENDATUTAKOAK */}

      {showRecommendations &&
        recommendedBooks.length >
          0 && (
          <div
            className="modal-overlay"
            onMouseDown={() =>
              setShowRecommendations(
                false
              )
            }
          >
            <div
              className="modal recommendations-modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >
              <button
                className="modal-close"
                onClick={() =>
                  setShowRecommendations(
                    false
                  )
                }
                aria-label="Itxi"
              >
                ×
              </button>

              <div className="recommendation-star">
                ★
              </div>

              <h2>
                Azken gomendapenak
              </h2>

              <p>
                Une honetan nabarmendu
                nahi ditugun liburuak.
              </p>

              <div className="recommended-grid">
                {recommendedBooks.map(
                  (book) => (
                    <button
                      key={
                        book.id
                      }
                      className="recommended-card"
                      onClick={() => {
                        setShowRecommendations(
                          false
                        )

                        onOpenBook(
                          book.id
                        )
                      }}
                    >
                      <div className="recommended-cover">
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
                          <div>
                            📖
                          </div>
                        )}
                      </div>

                      <strong>
                        {
                          book.title
                        }
                      </strong>

                      <span>
                        {
                          book.author
                        }
                      </span>

                      <div className="recommended-rating">
                        ★{' '}
                        {book.average ===
                        null
                          ? '–'
                          : book.average
                              .toFixed(
                                1
                              )
                              .replace(
                                '.',
                                ','
                              )}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
    </section>
  )
}

// =========================
// TARJETA DE LIBRO
// =========================

type BookCardProps = {
  book: BookWithStats
  onOpen: (
    bookId: number
  ) => void
}

function BookCard({
  book,
  onOpen,
}: BookCardProps) {
  return (
    <button
      className="book-card"
      onClick={() =>
        onOpen(book.id)
      }
    >
      <div className="book-card-cover">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
          />
        ) : (
          <div className="book-card-no-cover">
            📖
          </div>
        )}

        {book.recommended && (
          <div className="recommended-badge">
            ★
          </div>
        )}
      </div>

      <div className="book-card-body">
        <h2>
          {book.title}
        </h2>

        <p className="book-card-author">
          {book.author}
        </p>

        <div className="book-card-rating">
          <span className="rating-star">
            ★
          </span>

          <strong>
            {book.average ===
            null
              ? '–'
              : book.average
                  .toFixed(1)
                  .replace(
                    '.',
                    ','
                  )}
          </strong>

          {book.ratingCount >
            0 && (
            <span className="rating-count">
              (
              {
                book.ratingCount
              }
              )
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// =========================
// SECCIÓN DE FILTRO
// =========================

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="filter-section">
      <h3>
        {title}
      </h3>

      {children}
    </div>
  )
}

// =========================
// CHIP
// =========================

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={
        active
          ? 'filter-chip active'
          : 'filter-chip'
      }
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// =========================
// INTERVALOS DE NOTA
// =========================

function RatingRangeSelector({
  selected,
  onToggle,
}: {
  selected: RangeKey[]
  onToggle: (
    range: RangeKey
  ) => void
}) {
  return (
    <div className="rating-range-list">
      {ratingRanges.map(
        (range) => (
          <button
            key={
              range.key
            }
            type="button"
            className={
              selected.includes(
                range.key
              )
                ? 'rating-range-chip active'
                : 'rating-range-chip'
            }
            onClick={() =>
              onToggle(
                range.key
              )
            }
          >
            {range.label}
          </button>
        )
      )}
    </div>
  )
}

// =========================
// UTILIDADES
// =========================

function toggleValue<T>(
  current: T[],
  value: T
) {
  if (
    current.includes(value)
  ) {
    return current.filter(
      (item) =>
        item !== value
    )
  }

  return [
    ...current,
    value,
  ]
}

function valueMatchesRanges(
  value: number,
  ranges: RangeKey[]
) {
  return ranges.some(
    (rangeKey) => {
      const range =
        ratingRanges.find(
          (item) =>
            item.key ===
            rangeKey
        )

      if (!range) {
        return false
      }

      /*
        Evitamos que exactamente 1,
        2, 3 o 4 pertenezcan a dos
        intervalos a la vez.

        0–1 -> 0 <= x < 1
        1–2 -> 1 <= x < 2
        ...
        4–5 -> 4 <= x <= 5
      */

      if (
        range.key ===
        '4-5'
      ) {
        return (
          value >= range.min &&
          value <= range.max
        )
      }

      return (
        value >= range.min &&
        value < range.max
      )
    }
  )
}

function countActiveFilters(
  filters: FilterState
) {
  let count = 0

  if (
    filters.overallRanges
      .length > 0
  ) {
    count++
  }

  Object.values(
    filters.criterionRanges
  ).forEach(
    (ranges) => {
      if (
        ranges.length > 0
      ) {
        count++
      }
    }
  )

  if (
    filters.styleIds.length >
    0
  ) {
    count++
  }

  if (
    filters.authors.length >
    0
  ) {
    count++
  }

  if (
    filters.languages.length >
    0
  ) {
    count++
  }

  if (
    filters.minPages !== '' ||
    filters.maxPages !== ''
  ) {
    count++
  }

  return count
}