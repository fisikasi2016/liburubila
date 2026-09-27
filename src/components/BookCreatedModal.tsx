type Props = {
  onRate: () => void
  onFinish: () => void
}

export default function BookCreatedModal({
  onRate,
  onFinish,
}: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal success-modal">
        <div className="success-icon">
          ✓
        </div>

        <h2>Liburua sortu da</h2>

        <p>
          Liburua Liburubilan gorde da.
          Orain baloratu dezakezu, nahi
          baduzu.
        </p>

        <div className="success-actions">
          <button
            className="primary-button"
            onClick={onRate}
          >
            Baloratu
          </button>

          <button
            className="cancel-button"
            onClick={onFinish}
          >
            Orain ez
          </button>
        </div>
      </div>
    </div>
  )
}