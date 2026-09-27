import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Book = {
  id: number
  title: string
  author: string
  cover_url: string | null
}

type Props = {
  onBack: () => void
  onSelectBook: (bookId: number) => void
}

export default function ExistingBookSelector({
  onBack,
  onSelectBook,
}: Props) {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBooks()
  }, [])

  async function loadBooks() {
    setLoading(true)

    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, cover_url')
      .order('title', { ascending: true })

    if (error) {
      console.error(error)
      setError('Ezin izan dira liburuak kargatu.')
      setLoading(false)
      return
    }

    setBooks(data ?? [])
    setLoading(false)
  }

  const filteredBooks = useMemo(() => {
    const term = search
      .trim()
      .toLocaleLowerCase()

    if (!term) return books

    return books.filter((book) => {
      const title = book.title.toLocaleLowerCase()
      const author = book.author.toLocaleLowerCase()

      return (
        title.includes(term) ||
        author.includes(term)
      )
    })
  }, [books, search])

  return (
    <section className="page">
      <button
        className="back-button"
        onClick={onBack}
      >
        ← Itzuli
      </button>

      <div className="small-logo">
        LIBURUBILA
      </div>

      <h1 className="section-title">
        Existitzen den liburua
      </h1>

      <div className="existing-book-container">
        <div className="book-search-wrapper">
          <span className="book-search-icon">
            ⌕
          </span>

          <input
            className="book-search-input"
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Bilatu izenburuaren edo idazlearen arabera..."
            autoFocus
          />

          {search && (
            <button
              className="clear-search"
              onClick={() => setSearch('')}
              type="button"
            >
              ×
            </button>
          )}
        </div>

        {loading && (
          <p className="placeholder">
            Liburuak kargatzen...
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
                Oraindik ez dago libururik.
              </strong>

              <p>
                Lehenengo liburu bat sortu behar da.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          books.length > 0 && (
            <>
              <div className="search-result-count">
                {filteredBooks.length}{' '}
                {filteredBooks.length === 1
                  ? 'liburu'
                  : 'liburu'}
              </div>

              <div className="existing-book-list">
                {filteredBooks.map((book) => (
                  <button
                    key={book.id}
                    className="existing-book-item"
                    onClick={() =>
                      onSelectBook(book.id)
                    }
                  >
                    <div className="existing-book-cover">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                        />
                      ) : (
                        <span>📖</span>
                      )}
                    </div>

                    <div className="existing-book-info">
                      <strong>
                        {book.title}
                      </strong>

                      <span>
                        {book.author}
                      </span>
                    </div>

                    <span className="existing-book-arrow">
                      →
                    </span>
                  </button>
                ))}

                {filteredBooks.length === 0 && (
                  <div className="empty-library">
                    <strong>
                      Ez da libururik aurkitu.
                    </strong>

                    <p>
                      Saiatu beste izenburu edo
                      idazle batekin.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
      </div>
    </section>
  )
}