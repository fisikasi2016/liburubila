import { useState } from 'react'
import './App.css'

import NewBookForm from './components/NewBookForm'
import RatingModal from './components/RatingModal'
import BookCreatedModal from './components/BookCreatedModal'
import ExistingBookSelector from './components/ExistingBookSelector'
import LibraryView from './components/LibraryView'
import BookDetail from './components/BookDetail'

type Pantalla =
  | 'inicio'
  | 'gestion'
  | 'liburu-berria'
  | 'existitzen-den-liburua'
  | 'biblioteca'
  | 'liburu-fitxa'

export default function App() {
  const [
    pantalla,
    setPantalla,
  ] =
    useState<Pantalla>(
      'inicio'
    )

  // ============================================================
  // PASSWORD ERREKATXO
  // ============================================================

  const [
    mostrarPassword,
    setMostrarPassword,
  ] =
    useState(false)

  const [
    password,
    setPassword,
  ] =
    useState('')

  const [
    errorPassword,
    setErrorPassword,
  ] =
    useState('')

  // ============================================================
  // LIBURU BERRIA
  // ============================================================

  const [
    createdBookId,
    setCreatedBookId,
  ] =
    useState<
      number | null
    >(null)

  const [
    showCreatedModal,
    setShowCreatedModal,
  ] =
    useState(false)

  // ============================================================
  // BALORAZIOA
  // ============================================================

  const [
    selectedBookId,
    setSelectedBookId,
  ] =
    useState<
      number | null
    >(null)

  const [
    showRatingModal,
    setShowRatingModal,
  ] =
    useState(false)

  // ============================================================
  // LIBURU FITXA
  // ============================================================

  const [
    detailBookId,
    setDetailBookId,
  ] =
    useState<
      number | null
    >(null)

  // ============================================================
  // PASSWORD FLOW
  // ============================================================

  function openRatingAccess() {
    setPassword('')
    setErrorPassword('')
    setMostrarPassword(
      true
    )
  }

  function closePasswordModal() {
    setMostrarPassword(
      false
    )

    setPassword('')
    setErrorPassword('')
  }

  function checkPassword(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (
      password !==
      'errekatxo'
    ) {
      setErrorPassword(
        'Pasahitza ez da zuzena.'
      )

      return
    }

    setMostrarPassword(
      false
    )

    setPassword('')
    setErrorPassword('')

    setPantalla(
      'gestion'
    )
  }

  // ============================================================
  // LIBURU BERRIA SORTU
  // ============================================================

  function handleBookCreated(
    bookId: number
  ) {
    setCreatedBookId(
      bookId
    )

    setShowCreatedModal(
      true
    )
  }

  function rateCreatedBook() {
    if (
      createdBookId ===
      null
    ) {
      return
    }

    setShowCreatedModal(
      false
    )

    setSelectedBookId(
      createdBookId
    )

    setShowRatingModal(
      true
    )
  }

  function closeCreatedModal() {
    setShowCreatedModal(
      false
    )

    setCreatedBookId(
      null
    )

    setPantalla(
      'gestion'
    )
  }

  // ============================================================
  // EXISTITZEN DEN LIBURUA
  // ============================================================

  function selectExistingBook(
    bookId: number
  ) {
    setSelectedBookId(
      bookId
    )

    setShowRatingModal(
      true
    )
  }

  // ============================================================
  // BALORAZIO MODALA
  // ============================================================

  function closeRatingModal() {
    setShowRatingModal(
      false
    )

    setSelectedBookId(
      null
    )
  }

  function ratingSaved() {
    setShowRatingModal(
      false
    )

    setSelectedBookId(
      null
    )

    setPantalla(
      'gestion'
    )
  }

  // ============================================================
  // LIBURU FITXA
  // ============================================================

  function openBookDetail(
    bookId: number
  ) {
    setDetailBookId(
      bookId
    )

    setPantalla(
      'liburu-fitxa'
    )
  }

  // ============================================================
  // BOOK DETAIL
  // ============================================================

  if (
    pantalla ===
      'liburu-fitxa' &&
    detailBookId !==
      null
  ) {
    return (
      <BookDetail
        bookId={
          detailBookId
        }
        onBack={() => {
          setDetailBookId(
            null
          )

          setPantalla(
            'biblioteca'
          )
        }}
      />
    )
  }

  // ============================================================
  // LIBURU BERRIA
  // ============================================================

  if (
    pantalla ===
    'liburu-berria'
  ) {
    return (
      <>
        <NewBookForm
          onBack={() =>
            setPantalla(
              'gestion'
            )
          }
          onCreated={
            handleBookCreated
          }
        />

        {showCreatedModal &&
          createdBookId !==
            null && (
            <BookCreatedModal
              onRate={rateCreatedBook}
              onFinish={closeCreatedModal}
            />
          )}

        {showRatingModal &&
          selectedBookId !==
            null && (
            <RatingModal
              bookId={
                selectedBookId
              }
              onClose={
                closeRatingModal
              }
              onSaved={
                ratingSaved
              }
            />
          )}
      </>
    )
  }

  // ============================================================
  // EXISTITZEN DEN LIBURUA
  // ============================================================

  if (
    pantalla ===
    'existitzen-den-liburua'
  ) {
    return (
      <>
        <ExistingBookSelector
          onBack={() =>
            setPantalla(
              'gestion'
            )
          }
          onSelectBook={
            selectExistingBook
          }
        />

        {showRatingModal &&
          selectedBookId !==
            null && (
            <RatingModal
              bookId={
                selectedBookId
              }
              onClose={
                closeRatingModal
              }
              onSaved={
                ratingSaved
              }
            />
          )}
      </>
    )
  }

  // ============================================================
  // LIBURUTEGIA
  // ============================================================

  if (
    pantalla ===
    'biblioteca'
  ) {
    return (
      <>
        <LibraryView
          onBack={() =>
            setPantalla(
              'inicio'
            )
          }
          onRateBook={
            openRatingAccess
          }
          onOpenBook={
            openBookDetail
          }
        />

        {mostrarPassword && (
          <PasswordModal
            password={
              password
            }
            error={
              errorPassword
            }
            onPasswordChange={
              setPassword
            }
            onSubmit={
              checkPassword
            }
            onClose={
              closePasswordModal
            }
          />
        )}
      </>
    )
  }

  // ============================================================
  // GESTIÓN
  // ============================================================

  if (
    pantalla ===
    'gestion'
  ) {
    return (
      <main className="app-shell">
        <section className="home-page">
          <button
            className="back-button"
            type="button"
            onClick={() =>
              setPantalla(
                'inicio'
              )
            }
          >
            ← Itzuli
          </button>

          <header className="home-header">
            <div className="brand-mark">
              L
            </div>

            <div className="small-logo">
              LIBURUBILA
            </div>

            <h1>
              Zer egin nahi
              duzu?
            </h1>
          </header>

          <div className="home-options">
            {/* LIBURUA GEHITU */}

            <button
              className="home-option-card"
              type="button"
              onClick={() =>
                setPantalla(
                  'liburu-berria'
                )
              }
            >
              <div className="home-option-icon">
                ＋
              </div>

              <div>
                <h2>
                  Liburua gehitu
                </h2>

                <p>
                  Liburutegian
                  oraindik ez dagoen
                  liburu bat gehitu.
                </p>
              </div>

              <span className="home-option-arrow">
                →
              </span>
            </button>

            {/* IRITZIA EMAN */}

            <button
              className="home-option-card"
              type="button"
              onClick={() =>
                setPantalla(
                  'existitzen-den-liburua'
                )
              }
            >
              <div className="home-option-icon">
                ★
              </div>

              <div>
                <h2>
                  Iritzia eman
                </h2>

                <p>
                  Liburutegiko
                  liburu bat bilatu
                  eta baloratu.
                </p>
              </div>

              <span className="home-option-arrow">
                →
              </span>
            </button>
          </div>
        </section>
      </main>
    )
  }

  // ============================================================
  // HASIERA
  // ============================================================

  return (
    <>
      <main className="app-shell">
        <section className="home-page">
          <header className="home-header main-home-header">
            <div className="brand-mark">
              L
            </div>

            <div className="small-logo">
              LIBURUBILA
            </div>

            <blockquote className="home-quote">
              <p>
                “Irakurtzea nor
                bere gelatik atera
                gabe mundu osoari
                buelta ematea da,
                mugarik eta
                menderatzerik
                gabe.”
              </p>

              <cite>
                Arantxa
                Urretabizkaia
              </cite>
            </blockquote>
          </header>

          <div className="home-options">
            {/* LIBURU BAT BALORATU */}

            <button
              className="home-option-card"
              type="button"
              onClick={
                openRatingAccess
              }
            >
              <div className="home-option-icon">
                ★
              </div>

              <div>
                <h2>
                  Liburu bat
                  baloratu
                </h2>

                <p>
                  Elkarbanatu
                  zure
                  esperientzia.
                </p>
              </div>

              <span className="home-option-arrow">
                →
              </span>
            </button>

            {/* ZER IRAKUR DEZAKET? */}

            <button
              className="home-option-card"
              type="button"
              onClick={() =>
                setPantalla(
                  'biblioteca'
                )
              }
            >
              <div className="home-option-icon">
                📖
              </div>

              <div>
                <h2>
                  Zer irakur
                  dezaket?
                </h2>

                <p>
                  Arakatu eta
                  erabaki zer
                  irakurri nahi
                  duzun.
                </p>
              </div>

              <span className="home-option-arrow">
                →
              </span>
            </button>
          </div>
        </section>
      </main>

      {mostrarPassword && (
        <PasswordModal
          password={
            password
          }
          error={
            errorPassword
          }
          onPasswordChange={
            setPassword
          }
          onSubmit={
            checkPassword
          }
          onClose={
            closePasswordModal
          }
        />
      )}
    </>
  )
}

// ============================================================
// PASSWORD MODAL
// ============================================================

function PasswordModal({
  password,
  error,
  onPasswordChange,
  onSubmit,
  onClose,
}: {
  password: string
  error: string
  onPasswordChange: (
    value: string
  ) => void
  onSubmit: (
    e: React.FormEvent
  ) => void
  onClose: () => void
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={
        onClose
      }
    >
      <div
        className="modal"
        onMouseDown={(
          e
        ) =>
          e.stopPropagation()
        }
      >
        <button
          className="modal-close"
          type="button"
          onClick={
            onClose
          }
          aria-label="Itxi"
        >
          ×
        </button>

        <div className="modal-icon">
          🔐
        </div>

        <h2>
          Pasahitza
        </h2>

        <p>
          Liburuak gehitu
          edo baloratzeko
          pasahitza idatzi.
        </p>

        <form
          onSubmit={
            onSubmit
          }
        >
          <label>
            Pasahitza
          </label>

          <input
            type="password"
            value={
              password
            }
            onChange={(
              e
            ) =>
              onPasswordChange(
                e.target
                  .value
              )
            }
            autoFocus
            placeholder="••••••••"
          />

          {error && (
            <p className="error-message">
              {error}
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
  )
}