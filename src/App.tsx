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

function App() {
  const [pantalla, setPantalla] =
    useState<Pantalla>('inicio')

  const [mostrarPassword, setMostrarPassword] =
    useState(false)

  const [password, setPassword] =
    useState('')

  const [errorPassword, setErrorPassword] =
    useState('')

  const [createdBookId, setCreatedBookId] =
    useState<number | null>(null)

  const [selectedBookId, setSelectedBookId] =
    useState<number | null>(null)

  const [detailBookId, setDetailBookId] =
    useState<number | null>(null)

  const [showCreatedModal, setShowCreatedModal] =
    useState(false)

  const [showRatingModal, setShowRatingModal] =
    useState(false)

  function abrirAccesoValoracion() {
    setPassword('')
    setErrorPassword('')
    setMostrarPassword(true)
  }

  function comprobarPassword(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (password === 'errekatxo') {
      setMostrarPassword(false)
      setPassword('')
      setErrorPassword('')
      setPantalla('gestion')
    } else {
      setErrorPassword(
        'Pasahitza ez da zuzena.'
      )
    }
  }

  if (
    pantalla === 'liburu-fitxa' &&
    detailBookId !== null
  ) {
    return (
      <main className="app">
        <BookDetail
          bookId={detailBookId}
          onBack={() =>
            setPantalla('biblioteca')
          }
        />
      </main>
    )
  }

  if (pantalla === 'liburu-berria') {
    return (
      <main className="app">
        <NewBookForm
          onBack={() => {
            setCreatedBookId(null)
            setShowCreatedModal(false)
            setShowRatingModal(false)
            setPantalla('gestion')
          }}
          onCreated={(bookId) => {
            setCreatedBookId(bookId)
            setShowCreatedModal(true)
          }}
        />

        {showCreatedModal && (
          <BookCreatedModal
            onRate={() => {
              setShowCreatedModal(false)
              setShowRatingModal(true)
            }}
            onFinish={() => {
              setShowCreatedModal(false)
              setCreatedBookId(null)
              setPantalla('gestion')
            }}
          />
        )}

        {showRatingModal &&
          createdBookId !== null && (
            <RatingModal
              bookId={createdBookId}
              onClose={() => {
                setShowRatingModal(false)
                setCreatedBookId(null)
                setPantalla('gestion')
              }}
              onSaved={() => {
                setShowRatingModal(false)
                setCreatedBookId(null)
                setPantalla('gestion')

                alert(
                  'Balorazioa behar bezala gorde da.'
                )
              }}
            />
          )}
      </main>
    )
  }

  if (
    pantalla ===
    'existitzen-den-liburua'
  ) {
    return (
      <main className="app">
        <ExistingBookSelector
          onBack={() => {
            setSelectedBookId(null)
            setShowRatingModal(false)
            setPantalla('gestion')
          }}
          onSelectBook={(bookId) => {
            setSelectedBookId(bookId)
            setShowRatingModal(true)
          }}
        />

        {showRatingModal &&
          selectedBookId !== null && (
            <RatingModal
              bookId={selectedBookId}
              onClose={() => {
                setShowRatingModal(false)
                setSelectedBookId(null)
              }}
              onSaved={() => {
                setShowRatingModal(false)
                setSelectedBookId(null)
                setPantalla('gestion')

                alert(
                  'Balorazioa behar bezala gorde da.'
                )
              }}
            />
          )}
      </main>
    )
  }

  if (pantalla === 'gestion') {
    return (
      <main className="app">
        <section className="page">
          <button
            className="back-button"
            onClick={() =>
              setPantalla('inicio')
            }
          >
            ← Itzuli
          </button>

          <div className="small-logo">
            LIBURUBILA
          </div>

          <h1 className="section-title">
            Zer egin nahi duzu?
          </h1>

          <div className="option-grid">
            <button
              className="option-card"
              onClick={() =>
                setPantalla(
                  'liburu-berria'
                )
              }
            >
              <span className="option-icon">
                ＋
              </span>

              <div>
                <h2>
                  Liburu berria
                </h2>

                <p>
                  Liburutegian oraindik ez
                  dagoen liburu bat gehitu.
                </p>
              </div>
            </button>

            <button
              className="option-card"
              onClick={() =>
                setPantalla(
                  'existitzen-den-liburua'
                )
              }
            >
              <span className="option-icon">
                ⌕
              </span>

              <div>
                <h2>
                  Existitzen den liburua
                </h2>

                <p>
                  Liburutegiko liburu bat
                  bilatu eta baloratu.
                </p>
              </div>
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (pantalla === 'biblioteca') {
    return (
      <main className="app">
        <LibraryView
          onBack={() =>
            setPantalla('inicio')
          }
          onRateBook={
            abrirAccesoValoracion
          }
          onOpenBook={(bookId) => {
            setDetailBookId(bookId)
            setPantalla('liburu-fitxa')
          }}
        />

        {mostrarPassword && (
          <PasswordModal
            password={password}
            setPassword={setPassword}
            error={errorPassword}
            onClose={() => {
              setMostrarPassword(false)
              setPassword('')
              setErrorPassword('')
            }}
            onSubmit={comprobarPassword}
          />
        )}
      </main>
    )
  }

  return (
    <main className="app">
      <section className="hero">
        <div className="brand-mark">
          L
        </div>

        <h1 className="logo">
          Liburubila
        </h1>

        <p className="tagline">
          Aukeratu zure liburua eta
          lagundu besteei aukeratzen
        </p>

        <div className="home-options">
          <button
            className="home-card"
            onClick={
              abrirAccesoValoracion
            }
          >
            <span className="home-icon">
              ✦
            </span>

            <span className="home-card-content">
              <strong>
                Liburu bat baloratu
              </strong>

              <small>
                Partekatu zure
                esperientzia
              </small>
            </span>

            <span className="arrow">
              →
            </span>
          </button>

          <button
            className="home-card featured"
            onClick={() =>
              setPantalla(
                'biblioteca'
              )
            }
          >
            <span className="home-icon">
              ⌕
            </span>

            <span className="home-card-content">
              <strong>
                Zer irakur dezaket?
              </strong>

              <small>
                Aurkitu zure hurrengo
                liburua
              </small>
            </span>

            <span className="arrow">
              →
            </span>
          </button>
        </div>
      </section>

      {mostrarPassword && (
        <PasswordModal
          password={password}
          setPassword={setPassword}
          error={errorPassword}
          onClose={() => {
            setMostrarPassword(false)
            setPassword('')
            setErrorPassword('')
          }}
          onSubmit={comprobarPassword}
        />
      )}
    </main>
  )
}

type PasswordModalProps = {
  password: string
  setPassword: (value: string) => void
  error: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

function PasswordModal({
  password,
  setPassword,
  error,
  onClose,
  onSubmit,
}: PasswordModalProps) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="modal"
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

        <div className="modal-icon">
          🔑
        </div>

        <h2>
          Liburu bat baloratu
        </h2>

        <p>
          Atal honetara sartzeko
          pasahitza idatzi.
        </p>

        <form onSubmit={onSubmit}>
          <label htmlFor="password">
            Pasahitza
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
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

export default App