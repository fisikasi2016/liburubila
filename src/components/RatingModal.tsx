import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Criterion = {
  id: number
  name: string
  description: string | null
  position: number
}

type AgeRange = {
  id: number
  code: string
  label: string
  position: number
}

type Props = {
  bookId: number
  onClose: () => void
  onSaved: () => void
}

const LEVELS = [
  'DBH1',
  'DBH2',
  'DBH3',
  'DBH4',
  '1. BATX',
  '2. BATX',
  'Beste bat',
]

export default function RatingModal({
  bookId,
  onClose,
  onSaved,
}: Props) {
  const [criteria, setCriteria] =
    useState<Criterion[]>([])

  const [ageRanges, setAgeRanges] =
    useState<AgeRange[]>([])

  const [initials, setInitials] =
    useState('')

  const [level, setLevel] =
    useState('')

  const [comment, setComment] =
    useState('')

  const [scores, setScores] =
    useState<Record<number, number | null>>(
      {}
    )

  const [
    selectedAgeRangeIds,
    setSelectedAgeRangeIds,
  ] = useState<number[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [
        criteriaResult,
        ageRangesResult,
      ] = await Promise.all([
        supabase
          .from('criteria')
          .select(
            'id, name, description, position'
          )
          .eq('active', true)
          .order('position', {
            ascending: true,
          }),

        supabase
          .from(
            'recommendation_age_ranges'
          )
          .select(
            'id, code, label, position'
          )
          .order('position', {
            ascending: true,
          }),
      ])

      if (criteriaResult.error) {
        throw criteriaResult.error
      }

      if (ageRangesResult.error) {
        throw ageRangesResult.error
      }

      const loadedCriteria =
        criteriaResult.data ?? []

      setCriteria(loadedCriteria)
      setAgeRanges(
        ageRangesResult.data ?? []
      )

      const emptyScores: Record<
        number,
        number | null
      > = {}

      loadedCriteria.forEach(
        (criterion) => {
          emptyScores[
            criterion.id
          ] = null
        }
      )

      setScores(emptyScores)
    } catch (err) {
      console.error(err)

      setError(
        'Ezin izan dira balorazio-aukerak kargatu.'
      )
    } finally {
      setLoading(false)
    }
  }

  function setScore(
    criterionId: number,
    value: number
  ) {
    setScores((current) => ({
      ...current,
      [criterionId]: value,
    }))
  }

  function clearScore(
    criterionId: number
  ) {
    setScores((current) => ({
      ...current,
      [criterionId]: null,
    }))
  }

  function toggleAgeRange(
    ageRangeId: number
  ) {
    setSelectedAgeRangeIds(
      (current) =>
        current.includes(ageRangeId)
          ? current.filter(
              (id) =>
                id !== ageRangeId
            )
          : [
              ...current,
              ageRangeId,
            ]
    )
  }

  const allScoresCompleted =
    useMemo(() => {
      if (criteria.length === 0) {
        return false
      }

      return criteria.every(
        (criterion) =>
          scores[criterion.id] !==
          null &&
          scores[criterion.id] !==
          undefined
      )
    }, [criteria, scores])

  async function saveRating(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setError('')

    const cleanedInitials =
      initials.trim()

    if (!cleanedInitials) {
      setError(
        'Izen-abizenaren lehen letrak idatzi.'
      )
      return
    }

    if (!level) {
      setError(
        'Maila aukeratu.'
      )
      return
    }

    if (!allScoresCompleted) {
      setError(
        'Balorazioa osatzeko lau irizpideak baloratu behar dituzu.'
      )
      return
    }

    try {
      setSaving(true)

      // =========================
      // RATING PRINCIPAL
      // =========================

      const {
        data: createdRating,
        error: ratingError,
      } = await supabase
        .from('ratings')
        .insert({
          book_id: bookId,
          initials:
            cleanedInitials,
          level,
          age: null,
          comment:
            comment.trim() ||
            null,
        })
        .select('id')
        .single()

      if (ratingError) {
        throw ratingError
      }

      // =========================
      // 4 CRITERIOS
      // =========================

      const scoreRows =
        criteria.map(
          (criterion) => ({
            rating_id:
              createdRating.id,

            criterion_id:
              criterion.id,

            score:
              scores[
                criterion.id
              ] as number,
          })
        )

      const {
        error: scoresError,
      } = await supabase
        .from('rating_scores')
        .insert(scoreRows)

      if (scoresError) {
        throw scoresError
      }

      // =========================
      // EDADES RECOMENDADAS
      // =========================

      if (
        selectedAgeRangeIds.length >
        0
      ) {
        const ageRows =
          selectedAgeRangeIds.map(
            (ageRangeId) => ({
              rating_id:
                createdRating.id,

              age_range_id:
                ageRangeId,
            })
          )

        const {
          error: ageError,
        } = await supabase
          .from(
            'rating_age_ranges'
          )
          .insert(ageRows)

        if (ageError) {
          throw ageError
        }
      }

      onSaved()
    } catch (err) {
      console.error(
        'Error guardando valoración:',
        err
      )

      setError(
        'Ezin izan da balorazioa gorde. Saiatu berriro.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal rating-modal">
          <p className="placeholder">
            Balorazioa kargatzen...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={() => {
        if (!saving) {
          onClose()
        }
      }}
    >
      <div
        className="modal rating-modal rating-modal-v2"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          disabled={saving}
          aria-label="Itxi"
        >
          ×
        </button>

        <header className="rating-modal-header">
          <div className="small-logo">
            LIBURUBILA
          </div>

          <h2>
            Iritzia eman
          </h2>

          <p>
            Partekatu liburuari
            buruzko zure iritzia.
          </p>
        </header>

        <form
          onSubmit={saveRating}
          className="rating-form"
        >
          {/* =====================
              NOR ZARA?
              ===================== */}

          <section className="rating-section">
            <h3>
              Zure datuak
            </h3>

            <div className="rating-user-grid">
              <label className="form-field">
                <span>
                  Izen-abizenaren
                  lehen letrak
                </span>

                <input
                  type="text"
                  value={initials}
                  onChange={(e) =>
                    setInitials(
                      e.target.value
                    )
                  }
                  placeholder="Adib. IA"
                  maxLength={8}
                  required
                />
              </label>

              <label className="form-field">
                <span>
                  Maila
                </span>

                <select
                  value={level}
                  onChange={(e) =>
                    setLevel(
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Aukeratu maila
                  </option>

                  {LEVELS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>
          </section>

          {/* =====================
              BALORAZIOA
              ===================== */}

          <section className="rating-section">
            <div className="rating-section-title">
              <div>
                <h3>
                  Balorazioa
                </h3>

                <p>
                  Lau irizpideak
                  derrigorrezkoak
                  dira.
                </p>
              </div>

              <span className="required-badge">
                Derrigorrezkoa
              </span>
            </div>

            <div className="criteria-rating-list">
              {criteria.map(
                (
                  criterion,
                  index
                ) => {
                  const value =
                    scores[
                      criterion.id
                    ]

                  const progress =
                    value === null ||
                    value ===
                      undefined
                      ? 0
                      : (value /
                          5) *
                        100

                  return (
                    <div
                      key={
                        criterion.id
                      }
                      className="criterion-slider-block"
                    >
                      <div className="criterion-slider-header">
                        <div className="criterion-title-group">
                          <span className="criterion-number">
                            {index +
                              1}
                          </span>

                          <div>
                            <strong>
                              {
                                criterion.name
                              }
                            </strong>

                            {criterion.description && (
                              <p>
                                {
                                  criterion.description
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="slider-score">
                          {value ===
                            null ||
                          value ===
                            undefined
                            ? '–'
                            : value
                                .toFixed(
                                  1
                                )
                                .replace(
                                  '.',
                                  ','
                                )}
                        </span>
                      </div>

                      <input
                        className="rating-slider"
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={
                          value ??
                          0
                        }
                        style={
                          {
                            '--slider-progress':
                              `${progress}%`,
                          } as React.CSSProperties
                        }
                        onChange={(
                          e
                        ) =>
                          setScore(
                            criterion.id,
                            Number(
                              e
                                .target
                                .value
                            )
                          )
                        }
                      />

                      <div className="slider-meaning">
                        <span>
                          0 · {getLowLabel(criterion.name)}
                        </span>

                        <span>
                          5 · {getHighLabel(criterion.name)}
                        </span>
                      </div>

                      {value !==
                        null &&
                        value !==
                          undefined && (
                          <button
                            type="button"
                            className="clear-rating-button"
                            onClick={() =>
                              clearScore(
                                criterion.id
                              )
                            }
                          >
                            Balorazioa
                            ezabatu
                          </button>
                        )}
                    </div>
                  )
                }
              )}
            </div>
          </section>

          {/* =====================
              ADIN GOMENDIOA
              ===================== */}

          <section className="rating-section">
            <div className="rating-section-title">
              <div>
                <h3>
                  Zein adinetarako
                  gomendatuko zenuke?
                </h3>

                <p>
                  Aukera bat baino
                  gehiago hauta
                  dezakezu.
                </p>
              </div>
            </div>

            <div className="age-range-options">
              {ageRanges.map(
                (ageRange) => {
                  const selected =
                    selectedAgeRangeIds.includes(
                      ageRange.id
                    )

                  return (
                    <button
                      key={
                        ageRange.id
                      }
                      type="button"
                      className={
                        selected
                          ? 'age-range-option selected'
                          : 'age-range-option'
                      }
                      onClick={() =>
                        toggleAgeRange(
                          ageRange.id
                        )
                      }
                    >
                      {
                        ageRange.label
                      }
                    </button>
                  )
                }
              )}
            </div>
          </section>

          {/* =====================
              IRUZKINA
              ===================== */}

          <section className="rating-section">
            <h3>
              Liburuaren iruzkina
            </h3>

            <p className="comment-instruction">
              Jarrera kritikoa
              agertuz, eman zure
              iritzia.
            </p>

            <textarea
              value={comment}
              onChange={(e) =>
                setComment(
                  e.target.value
                )
              }
              placeholder="Idatzi hemen zure iritzia..."
              rows={5}
            />
          </section>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <div className="rating-modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Utzi
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? 'Gordetzen...'
                : 'Balorazioa gorde'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
  function getLowLabel(
  criterionName: string
) {
  switch (criterionName) {
    case 'Istorioaren interesa':
      return 'Batere interesgarria ez'

    case 'Ulergarritasuna':
      return 'Oso zaila'

    case 'Asebetetze maila':
      return 'Batere gustuko ez'

    case 'Gomendatuko zenuke?':
      return 'Ez nuke gomendatuko'

    default:
      return ''
  }
}

function getHighLabel(
  criterionName: string
) {
  switch (criterionName) {
    case 'Istorioaren interesa':
      return 'Oso interesgarria'

    case 'Ulergarritasuna':
      return 'Oso erraza'

    case 'Asebetetze maila':
      return 'Asko gustatu zait'

    case 'Gomendatuko zenuke?':
      return 'Erabat gomendatuko nuke'

    default:
      return ''
  }
}
}