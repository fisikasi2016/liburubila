import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Criterion = {
  id: number
  name: string
  position: number
}

type Props = {
  bookId: number
  onClose: () => void
  onSaved: () => void
}

export default function RatingModal({
  bookId,
  onClose,
  onSaved,
}: Props) {
  const [criteria, setCriteria] = useState<Criterion[]>([])

  const [initials, setInitials] = useState('')
  const [age, setAge] = useState('')
  const [comment, setComment] = useState('')

  const [scores, setScores] = useState<
    Record<number, number | null>
  >({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [recommended, setRecommended] = useState(false)

  const [
    showRecommendationPassword,
    setShowRecommendationPassword,
  ] = useState(false)

  const [
    recommendationPassword,
    setRecommendationPassword,
  ] = useState('')

  const [
    recommendationError,
    setRecommendationError,
  ] = useState('')

  const [
    changingRecommendation,
    setChangingRecommendation,
  ] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [bookId])

  async function loadInitialData() {
    setLoading(true)
    setError('')

    const {
      data: criteriaData,
      error: criteriaError,
    } = await supabase
      .from('criteria')
      .select('id, name, position')
      .eq('active', true)
      .order('position', {
        ascending: true,
      })

    if (criteriaError) {
      console.error(criteriaError)

      setError(
        'Ezin izan dira irizpideak kargatu.'
      )

      setLoading(false)
      return
    }

    const loadedCriteria = criteriaData ?? []

    setCriteria(loadedCriteria)

    const initialScores: Record<
      number,
      number | null
    > = {}

    loadedCriteria.forEach((criterion) => {
      initialScores[criterion.id] = null
    })

    setScores(initialScores)

    const {
      data: bookData,
      error: bookError,
    } = await supabase
      .from('books')
      .select('recommended')
      .eq('id', bookId)
      .single()

    if (bookError) {
      console.error(bookError)
    } else {
      setRecommended(
        bookData.recommended ?? false
      )
    }

    setLoading(false)
  }

  function setScore(
    criterionId: number,
    score: number
  ) {
    setScores((current) => ({
      ...current,
      [criterionId]: score,
    }))
  }

  function clearScores() {
    const clearedScores: Record<
      number,
      number | null
    > = {}

    criteria.forEach((criterion) => {
      clearedScores[criterion.id] = null
    })

    setScores(clearedScores)
  }

  async function saveRating() {
    setError('')

    const hasComment =
      comment.trim().length > 0

    const scoreValues = criteria.map(
      (criterion) =>
        scores[criterion.id]
    )

    const answeredScores =
      scoreValues.filter(
        (value) => value !== null
      ).length

    const hasAnyScore =
      answeredScores > 0

    const hasAllScores =
      criteria.length > 0 &&
      answeredScores === criteria.length

    if (
      hasAnyScore &&
      !hasAllScores
    ) {
      setError(
        'Balorazioa egiten baduzu, irizpide guztiak bete behar dituzu.'
      )

      return
    }

    if (!hasComment && !hasAllScores) {
      setError(
        'Balorazioa edo liburuaren iruzkina bete behar duzu.'
      )

      return
    }

    if (!initials.trim()) {
      setError(
        'Izen-abizenaren lehen letrak idatzi behar dituzu.'
      )

      return
    }

    if (
      !age ||
      Number(age) <= 0 ||
      Number(age) >= 120
    ) {
      setError(
        'Adina zuzena idatzi behar duzu.'
      )

      return
    }

    try {
      setSaving(true)

      const {
        data: rating,
        error: ratingError,
      } = await supabase
        .from('ratings')
        .insert({
          book_id: bookId,

          initials: initials
            .trim()
            .toUpperCase(),

          age: Number(age),

          comment:
            hasComment
              ? comment.trim()
              : null,
        })
        .select()
        .single()

      if (ratingError) {
        throw ratingError
      }

      if (hasAllScores) {
        const scoreRows =
          criteria.map(
            (criterion) => ({
              rating_id:
                rating.id,

              criterion_id:
                criterion.id,

              score:
                scores[
                  criterion.id
                ],
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
      }

      onSaved()
    } catch (err) {
      console.error(err)

      setError(
        'Errorea gertatu da gordetzean.'
      )
    } finally {
      setSaving(false)
    }
  }

  function openRecommendationPassword() {
    setRecommendationPassword('')
    setRecommendationError('')
    setShowRecommendationPassword(true)
  }

  function closeRecommendationPassword() {
    if (changingRecommendation) return

    setShowRecommendationPassword(false)
    setRecommendationPassword('')
    setRecommendationError('')
  }

  async function changeRecommendation(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setRecommendationError('')

    if (
      recommendationPassword !==
      'irakasle'
    ) {
      setRecommendationError(
        'Pasahitza ez da zuzena.'
      )

      return
    }

    try {
      setChangingRecommendation(true)

      if (recommended) {
        const {
          error: updateError,
        } = await supabase
          .from('books')
          .update({
            recommended: false,
          })
          .eq('id', bookId)

        if (updateError) {
          throw updateError
        }

        setRecommended(false)

        setShowRecommendationPassword(false)
        setRecommendationPassword('')
        setRecommendationError('')

        return
      }

      const {
        count,
        error: countError,
      } = await supabase
        .from('books')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('recommended', true)

      if (countError) {
        throw countError
      }

      if (
        count !== null &&
        count >= 3
      ) {
        setRecommendationError(
          'Dagoeneko 3 liburu gomendatuta daude. Beste bat kendu behar duzu lehenengo.'
        )

        return
      }

      const {
        error: updateError,
      } = await supabase
        .from('books')
        .update({
          recommended: true,
        })
        .eq('id', bookId)

      if (updateError) {
        throw updateError
      }

      setRecommended(true)

      setShowRecommendationPassword(false)
      setRecommendationPassword('')
      setRecommendationError('')
    } catch (err) {
      console.error(err)

      setRecommendationError(
        'Ezin izan da gomendioa aldatu.'
      )
    } finally {
      setChangingRecommendation(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal rating-modal">
          <p>
            Irizpideak kargatzen...
          </p>
        </div>
      </div>
    )
  }

  const hasAnyScore =
    Object.values(scores).some(
      (value) =>
        value !== null
    )

  return (
    <>
      <div
        className="modal-overlay"
        onMouseDown={onClose}
      >
        <div
          className="modal rating-modal"
          onMouseDown={(e) =>
            e.stopPropagation()
          }
        >
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Itxi"
          >
            ×
          </button>

          <div className="small-logo rating-logo">
            LIBURUBILA
          </div>

          <h2>
            Liburuari buruzko zure iritzia
          </h2>

          <p className="rating-explanation">
            Liburua baloratu, iruzkin bat
            idatzi edo biak egin ditzakezu.
          </p>

          <div className="rating-person-data">
            <div className="field">
              <label>
                Izen-abizenaren lehen letrak
              </label>

              <input
                value={initials}
                onChange={(e) =>
                  setInitials(
                    e.target.value
                  )
                }
                placeholder="IB"
                maxLength={6}
              />
            </div>

            <div className="field">
              <label>
                Adina
              </label>

              <input
                type="number"
                min="1"
                max="119"
                value={age}
                onChange={(e) =>
                  setAge(
                    e.target.value
                  )
                }
                placeholder="14"
              />
            </div>
          </div>

          <div className="rating-section-header">
            <div>
              <h3>
                Balorazioa
              </h3>

              <p>
                Aukerakoa da, baina
                baloratzen baduzu irizpide
                guztiak bete behar dituzu.
              </p>
            </div>

            {hasAnyScore && (
              <button
                type="button"
                className="clear-rating-button"
                onClick={clearScores}
              >
                Balorazioa ezabatu
              </button>
            )}
          </div>

          <div className="criteria-list">
            {criteria.map(
              (criterion) => (
                <CriterionSlider
                  key={criterion.id}
                  criterion={
                    criterion
                  }
                  value={
                    scores[
                      criterion.id
                    ]
                  }
                  onChange={(
                    score
                  ) =>
                    setScore(
                      criterion.id,
                      score
                    )
                  }
                />
              )
            )}
          </div>

          <div className="field">
            <label>
              Liburuaren iruzkina
              <span className="optional-text">
                {' '}
                · aukerakoa
              </span>
            </label>

            <textarea
              value={comment}
              onChange={(e) =>
                setComment(
                  e.target.value
                )
              }
              placeholder="Zer iruditu zaizu liburua?"
              rows={5}
            />
          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            className="primary-button"
            onClick={saveRating}
            disabled={saving}
          >
            {saving
              ? 'Gordetzen...'
              : 'Gorde'}
          </button>

          <div className="teacher-recommendation">
            <div>
              <span className="teacher-label">
                IRAKASLEA
              </span>

              <h3>
                Azken gomendapena
              </h3>

              <p>
                Liburu hau Liburubilaren
                gomendioen artean nabarmendu.
              </p>
            </div>

            <button
              type="button"
              className={
                recommended
                  ? 'recommend-button active'
                  : 'recommend-button'
              }
              onClick={
                openRecommendationPassword
              }
            >
              <span>
                {recommended
                  ? '★'
                  : '☆'}
              </span>

              {recommended
                ? 'Gomendatuta'
                : 'Gomendatu'}
            </button>
          </div>
        </div>
      </div>

      {showRecommendationPassword && (
        <div
          className="modal-overlay recommendation-overlay"
          onMouseDown={
            closeRecommendationPassword
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
                closeRecommendationPassword
              }
              aria-label="Itxi"
            >
              ×
            </button>

            <div className="modal-icon">
              🔐
            </div>

            <h2>
              Azken gomendapena
            </h2>

            <p>
              Gomendioa aldatzeko
              irakaslearen pasahitza idatzi.
            </p>

            <form
              onSubmit={
                changeRecommendation
              }
            >
              <label>
                Pasahitza
              </label>

              <input
                type="password"
                value={
                  recommendationPassword
                }
                onChange={(e) =>
                  setRecommendationPassword(
                    e.target.value
                  )
                }
                autoFocus
                placeholder="••••••••"
              />

              {recommendationError && (
                <p className="error-message">
                  {
                    recommendationError
                  }
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={
                  changingRecommendation
                }
              >
                {changingRecommendation
                  ? 'Aldatzen...'
                  : recommended
                  ? 'Gomendioa kendu'
                  : 'Gomendatu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

type CriterionSliderProps = {
  criterion: Criterion
  value: number | null
  onChange: (
    value: number
  ) => void
}

function CriterionSlider({
  criterion,
  value,
  onChange,
}: CriterionSliderProps) {
  const sliderValue =
    value === null
      ? 0
      : value

  const percentage =
    (sliderValue / 5) *
    100

  return (
    <div
      className={
        value === null
          ? 'criterion-slider-block inactive'
          : 'criterion-slider-block'
      }
    >
      <div className="criterion-slider-header">
        <strong>
          {criterion.name}
        </strong>

        <span
          className={
            value === null
              ? 'slider-score empty'
              : 'slider-score'
          }
        >
          {value === null
            ? '–'
            : value
                .toFixed(1)
                .replace(
                  '.',
                  ','
                )}
        </span>
      </div>

      <div className="slider-wrapper">
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={
            sliderValue
          }
          onChange={(e) =>
            onChange(
              Number(
                e.target.value
              )
            )
          }
          className={
            value === null
              ? 'rating-slider inactive'
              : 'rating-slider'
          }
          style={{
            '--slider-progress':
              `${percentage}%`,
          } as React.CSSProperties}
          aria-label={
            criterion.name
          }
        />
      </div>

      <div className="slider-scale">
        <span>0</span>
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>

      {value === null && (
        <p className="slider-help">
          Mugitu barra baloratzeko
        </p>
      )}
    </div>
  )
}