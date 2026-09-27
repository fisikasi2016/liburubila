import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Style = {
  id: number
  name: string
  name_normalized: string
}

type Props = {
  onBack: () => void
  onCreated: (bookId: number) => void
}

export default function NewBookForm({
  onBack,
  onCreated,
}: Props) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [publicationDate, setPublicationDate] = useState('')
  const [pages, setPages] = useState('')
  const [language, setLanguage] = useState('euskara')

  const [styles, setStyles] = useState<Style[]>([])

  const [
    selectedStyles,
    setSelectedStyles,
  ] = useState<number[]>([])

  const [newStyle, setNewStyle] = useState('')

  const [cover, setCover] =
    useState<File | null>(null)

  const [preview, setPreview] =
    useState<string | null>(null)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    loadStyles()
  }, [])

  async function loadStyles() {
    const {
      data,
      error,
    } = await supabase
      .from('styles')
      .select(`
        id,
        name,
        name_normalized
      `)
      .order('name')

    if (error) {
      console.error(error)
      return
    }

    setStyles(data ?? [])
  }

  function toggleStyle(id: number) {
    setSelectedStyles(
      (current) =>
        current.includes(id)
          ? current.filter(
              (styleId) =>
                styleId !== id
            )
          : [
              ...current,
              id,
            ]
    )
  }

  async function addNewStyle() {
    setError('')

    const cleanName =
      cleanVisibleText(
        newStyle
      )

    if (!cleanName) {
      return
    }

    const normalizedName =
      normalizeText(
        cleanName
      )

    /*
      Primero buscamos entre los estilos
      ya cargados.
    */

    const localExisting =
      styles.find(
        (style) =>
          style.name_normalized ===
          normalizedName
      )

    if (localExisting) {
      if (
        !selectedStyles.includes(
          localExisting.id
        )
      ) {
        setSelectedStyles(
          (current) => [
            ...current,
            localExisting.id,
          ]
        )
      }

      setNewStyle('')
      return
    }

    /*
      Comprobamos también Supabase,
      por si otro usuario acaba de
      crear el mismo estilo.
    */

    const {
      data: existingStyle,
      error: existingError,
    } = await supabase
      .from('styles')
      .select(`
        id,
        name,
        name_normalized
      `)
      .eq(
        'name_normalized',
        normalizedName
      )
      .maybeSingle()

    if (existingError) {
      console.error(
        existingError
      )

      setError(
        'Ezin izan da estiloa egiaztatu.'
      )

      return
    }

    if (existingStyle) {
      setStyles(
        (current) => {
          const exists =
            current.some(
              (item) =>
                item.id ===
                existingStyle.id
            )

          if (exists) {
            return current
          }

          return [
            ...current,
            existingStyle,
          ].sort((a, b) =>
            a.name.localeCompare(
              b.name,
              'eu'
            )
          )
        }
      )

      setSelectedStyles(
        (current) =>
          current.includes(
            existingStyle.id
          )
            ? current
            : [
                ...current,
                existingStyle.id,
              ]
      )

      setNewStyle('')
      return
    }

    /*
      No existe:
      lo creamos.
    */

    const {
      data,
      error: insertError,
    } = await supabase
      .from('styles')
      .insert({
        name: cleanName,
      })
      .select(`
        id,
        name,
        name_normalized
      `)
      .single()

    if (insertError) {
      console.error(
        insertError
      )

      setError(
        'Ezin izan da estilo berria sortu.'
      )

      return
    }

    setStyles(
      (current) =>
        [
          ...current,
          data,
        ].sort((a, b) =>
          a.name.localeCompare(
            b.name,
            'eu'
          )
        )
    )

    setSelectedStyles(
      (current) => [
        ...current,
        data.id,
      ]
    )

    setNewStyle('')
  }

  function handleCoverChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0]

    if (!file) return

    setCover(file)

    if (preview) {
      URL.revokeObjectURL(
        preview
      )
    }

    setPreview(
      URL.createObjectURL(
        file
      )
    )
  }

  async function uploadCover() {
    if (!cover) {
      return null
    }

    const extension =
      cover.name
        .split('.')
        .pop()
        ?.toLowerCase() ||
      'jpg'

    const fileName =
      `${crypto.randomUUID()}.${extension}`

    const {
      error,
    } = await supabase.storage
      .from('book-covers')
      .upload(
        fileName,
        cover
      )

    if (error) {
      throw error
    }

    const {
      data,
    } = supabase.storage
      .from('book-covers')
      .getPublicUrl(
        fileName
      )

    return data.publicUrl
  }

  async function checkDuplicateBook() {
    const normalizedTitle =
      normalizeText(
        title
      )

    const normalizedAuthor =
      normalizeAuthor(
        author
      )

    const {
      data,
      error,
    } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author
      `)
      .eq(
        'title_normalized',
        normalizedTitle
      )
      .eq(
        'author_normalized',
        normalizedAuthor
      )
      .maybeSingle()

    if (error) {
      throw error
    }

    return data
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setError('')

    const cleanTitle =
      cleanVisibleText(
        title
      )

    const cleanAuthor =
      cleanVisibleText(
        author
      )

    if (!cleanTitle) {
      setError(
        'Liburuaren izenburua beharrezkoa da.'
      )
      return
    }

    if (!cleanAuthor) {
      setError(
        'Idazlearen izena beharrezkoa da.'
      )
      return
    }

    if (
      !pages ||
      Number(pages) <= 0
    ) {
      setError(
        'Orrialde kopurua zuzena izan behar da.'
      )
      return
    }

    if (
      selectedStyles.length ===
      0
    ) {
      setError(
        'Gutxienez estilo bat aukeratu behar da.'
      )
      return
    }

    if (!cover) {
      setError(
        'Azalaren irudia gehitu behar da.'
      )
      return
    }

    try {
      setSaving(true)

      /*
        Antes de subir la portada,
        comprobamos que el libro
        no exista.
      */

      const duplicate =
        await checkDuplicateBook()

      if (duplicate) {
        setError(
          `Liburu hau dagoeneko existitzen dela dirudi: "${duplicate.title}", ${duplicate.author}.`
        )

        return
      }

      const coverUrl =
        await uploadCover()

      const {
        data: book,
        error: bookError,
      } = await supabase
        .from('books')
        .insert({
          title:
            cleanTitle,

          author:
            cleanAuthor,

          publication_date:
            publicationDate ||
            null,

          pages:
            Number(pages),

          language,

          cover_url:
            coverUrl,
        })
        .select()
        .single()

      if (bookError) {
        /*
          Si dos personas intentasen
          crear el mismo libro casi
          simultáneamente, el índice
          UNIQUE de Supabase lo
          bloquearía igualmente.
        */

        if (
          bookError.code ===
          '23505'
        ) {
          setError(
            'Liburu hau dagoeneko existitzen da.'
          )

          return
        }

        throw bookError
      }

      const relations =
        selectedStyles.map(
          (styleId) => ({
            book_id:
              book.id,

            style_id:
              styleId,
          })
        )

      const {
        error:
          relationError,
      } = await supabase
        .from('book_styles')
        .insert(
          relations
        )

      if (relationError) {
        throw relationError
      }

      onCreated(
        book.id
      )
    } catch (err) {
      console.error(err)

      setError(
        'Errorea gertatu da liburua gordetzean.'
      )
    } finally {
      setSaving(false)
    }
  }

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
        Liburu berria
      </h1>

      <form
        className="book-form"
        onSubmit={
          handleSubmit
        }
      >
        <div className="form-layout">
          <div className="cover-column">
            <label className="cover-upload">
              {preview ? (
                <img
                  src={
                    preview
                  }
                  alt="Azalaren aurrebista"
                  className="cover-preview"
                />
              ) : (
                <div className="cover-placeholder">
                  <span>
                    ＋
                  </span>

                  <strong>
                    Azala gehitu
                  </strong>

                  <small>
                    JPG, PNG...
                  </small>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleCoverChange
                }
                hidden
              />
            </label>
          </div>

          <div className="fields-column">
            <div className="field">
              <label>
                Izenburua
              </label>

              <input
                type="text"
                value={
                  title
                }
                onChange={(e) =>
                  setTitle(
                    e.target
                      .value
                  )
                }
                placeholder="Liburuaren izenburua"
              />
            </div>

            <div className="field">
              <label>
                Idazlea
              </label>

              <input
                type="text"
                value={
                  author
                }
                onChange={(e) =>
                  setAuthor(
                    e.target
                      .value
                  )
                }
                placeholder="Idazlearen izena"
              />
            </div>

            <div className="form-row">
              <div className="field">
                <label>
                  Argitalpen-data
                </label>

                <input
                  type="date"
                  value={
                    publicationDate
                  }
                  onChange={(e) =>
                    setPublicationDate(
                      e.target
                        .value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>
                  Orrialde kopurua
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    pages
                  }
                  onChange={(e) =>
                    setPages(
                      e.target
                        .value
                    )
                  }
                  placeholder="250"
                />
              </div>
            </div>

            <div className="field">
              <label>
                Hizkuntza
              </label>

              <select
                value={
                  language
                }
                onChange={(e) =>
                  setLanguage(
                    e.target
                      .value
                  )
                }
              >
                <option value="euskara">
                  Euskara
                </option>

                <option value="gaztelera">
                  Gaztelera
                </option>

                <option value="ingelesa">
                  Ingelesa
                </option>
              </select>
            </div>

            <div className="field">
              <label>
                Estiloak
              </label>

              <div className="style-list">
                {styles.map(
                  (style) => (
                    <button
                      key={
                        style.id
                      }
                      type="button"
                      className={
                        selectedStyles.includes(
                          style.id
                        )
                          ? 'style-chip selected'
                          : 'style-chip'
                      }
                      onClick={() =>
                        toggleStyle(
                          style.id
                        )
                      }
                    >
                      {
                        style.name
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="new-style-row">
              <input
                type="text"
                value={
                  newStyle
                }
                onChange={(e) =>
                  setNewStyle(
                    e.target
                      .value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    'Enter'
                  ) {
                    e.preventDefault()

                    addNewStyle()
                  }
                }}
                placeholder="Beste estilo bat..."
              />

              <button
                type="button"
                onClick={
                  addNewStyle
                }
              >
                Gehitu
              </button>
            </div>

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            <button
              className="primary-button save-book-button"
              type="submit"
              disabled={
                saving
              }
            >
              {saving
                ? 'Gordetzen...'
                : 'Liburua sortu'}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

/* =========================
   NORMALIZACIÓN
   ========================= */

function cleanVisibleText(
  value: string
) {
  return value
    .trim()
    .replace(
      /\s+/g,
      ' '
    )
}

function normalizeText(
  value: string
) {
  return cleanVisibleText(
    value
  )
    .toLocaleLowerCase(
      'eu'
    )
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^\p{L}\p{N} ]/gu,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}

function normalizeAuthor(
  value: string
) {
  return normalizeText(
    value
  ).replace(
    /\s+/g,
    ''
  )
}