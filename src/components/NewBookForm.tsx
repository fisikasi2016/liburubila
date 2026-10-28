import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Option = {
  id: number
  name: string
  position?: number
}

type Tag = {
  id: number
  name: string
  name_normalized: string | null
}

type Props = {
  onCreated: (bookId: number) => void
  onBack: () => void
}

const LANGUAGES = [
  {
    value: 'euskara',
    label: 'Euskara',
  },
  {
    value: 'gaztelera',
    label: 'Gaztelera',
  },
  {
    value: 'ingelesa',
    label: 'Ingelesa',
  },
]

export default function NewBookForm({
  onCreated,
  onBack,
}: Props) {
  // =========================
  // DATOS DEL LIBRO
  // =========================

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')

  const [
    publicationDate,
    setPublicationDate,
  ] = useState('')

  const [pages, setPages] = useState('')

  const [language, setLanguage] =
    useState('euskara')

  const [coverFile, setCoverFile] =
    useState<File | null>(null)

  const [
    coverPreview,
    setCoverPreview,
  ] = useState<string | null>(null)

  // =========================
  // CLASIFICACIÓN
  // =========================

  const [genres, setGenres] = useState<
    Option[]
  >([])

  const [topics, setTopics] = useState<
    Option[]
  >([])

  const [subtopics, setSubtopics] =
    useState<Option[]>([])

  const [tags, setTags] = useState<Tag[]>(
    []
  )

  const [
    selectedGenreId,
    setSelectedGenreId,
  ] = useState<number | null>(null)

  const [
    selectedTopicId,
    setSelectedTopicId,
  ] = useState<number | null>(null)

  const [
    selectedSubtopicId,
    setSelectedSubtopicId,
  ] = useState<number | null>(null)

  const [
    selectedTagIds,
    setSelectedTagIds,
  ] = useState<number[]>([])

  const [
    newTagName,
    setNewTagName,
  ] = useState('')

  const [
    tagSearch,
    setTagSearch,
  ] = useState('')

  const [
    creatingTag,
    setCreatingTag,
  ] = useState(false)

  // =========================
  // ESTADO GENERAL
  // =========================

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  useEffect(() => {
    loadClassification()
  }, [])

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }

    const objectUrl =
      URL.createObjectURL(coverFile)

    setCoverPreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [coverFile])

  // =========================
  // CARGAR BANCOS
  // =========================

  async function loadClassification() {
    try {
      setLoading(true)
      setError('')

      const [
        genresResult,
        topicsResult,
        subtopicsResult,
        tagsResult,
      ] = await Promise.all([
        supabase
          .from('genres')
          .select('id, name, position')
          .order('position', {
            ascending: true,
          }),

        supabase
          .from('topics')
          .select('id, name, position')
          .order('position', {
            ascending: true,
          }),

        supabase
          .from('subtopics')
          .select('id, name, position')
          .order('position', {
            ascending: true,
          }),

        supabase
          .from('tags')
          .select(
            'id, name, name_normalized'
          )
          .order('name', {
            ascending: true,
          }),
      ])

      if (genresResult.error) {
        throw genresResult.error
      }

      if (topicsResult.error) {
        throw topicsResult.error
      }

      if (subtopicsResult.error) {
        throw subtopicsResult.error
      }

      if (tagsResult.error) {
        throw tagsResult.error
      }

      const loadedGenres =
        genresResult.data ?? []

      const loadedTopics =
        topicsResult.data ?? []

      const loadedSubtopics =
        subtopicsResult.data ?? []

      setGenres(loadedGenres)
      setTopics(loadedTopics)
      setSubtopics(loadedSubtopics)

      setTags(
        (tagsResult.data ?? []) as Tag[]
      )

      // Narratiba preseleccionada también
      // en el formulario de creación.
      const narratiba =
        loadedGenres.find(
          (genre) =>
            genre.name === 'Narratiba'
        )

      if (narratiba) {
        setSelectedGenreId(
          narratiba.id
        )
      }
    } catch (err) {
      console.error(err)

      setError(
        'Ezin izan dira sailkapen-aukerak kargatu.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // ETIQUETAS
  // =========================

  const filteredTags = useMemo(() => {
    const query =
      normalizeText(tagSearch)

    if (!query) {
      return tags
    }

    return tags.filter((tag) =>
      normalizeText(tag.name).includes(
        query
      )
    )
  }, [tags, tagSearch])

  function toggleTag(tagId: number) {
    setSelectedTagIds(
      (current) => {
        if (
          current.includes(tagId)
        ) {
          return current.filter(
            (id) => id !== tagId
          )
        }

        return [
          ...current,
          tagId,
        ]
      }
    )
  }

  async function createTag() {
    const cleaned =
      cleanVisibleText(newTagName)
        .replace(/^#+/, '')
        .trim()

    if (!cleaned) {
      return
    }

    const normalized =
      normalizeText(cleaned)

    const existingLocal =
      tags.find(
        (tag) =>
          tag.name_normalized ===
            normalized ||
          normalizeText(tag.name) ===
            normalized
      )

    if (existingLocal) {
      if (
        !selectedTagIds.includes(
          existingLocal.id
        )
      ) {
        setSelectedTagIds(
          (current) => [
            ...current,
            existingLocal.id,
          ]
        )
      }

      setNewTagName('')
      return
    }

    try {
      setCreatingTag(true)
      setError('')

      const {
        data,
        error: insertError,
      } = await supabase
        .from('tags')
        .insert({
          name: cleaned,
        })
        .select(
          'id, name, name_normalized'
        )
        .single()

      if (insertError) {
        // Puede ocurrir si otra persona
        // ha creado la misma etiqueta.
        if (
          insertError.code ===
          '23505'
        ) {
          const {
            data: existing,
            error: existingError,
          } = await supabase
            .from('tags')
            .select(
              'id, name, name_normalized'
            )
            .eq(
              'name_normalized',
              normalized
            )
            .single()

          if (
            existingError ||
            !existing
          ) {
            throw insertError
          }

          setTags(
            (current) =>
              sortTags([
                ...current,
                existing as Tag,
              ])
          )

          setSelectedTagIds(
            (current) =>
              current.includes(
                existing.id
              )
                ? current
                : [
                    ...current,
                    existing.id,
                  ]
          )

          setNewTagName('')
          return
        }

        throw insertError
      }

      const createdTag =
        data as Tag

      setTags((current) =>
        sortTags([
          ...current,
          createdTag,
        ])
      )

      setSelectedTagIds(
        (current) => [
          ...current,
          createdTag.id,
        ]
      )

      setNewTagName('')
    } catch (err) {
      console.error(err)

      setError(
        'Ezin izan da etiketa berria sortu.'
      )
    } finally {
      setCreatingTag(false)
    }
  }

  // =========================
  // GUARDAR LIBRO
  // =========================

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setError('')
    setSuccessMessage('')

    const cleanedTitle =
      cleanVisibleText(title)

    const cleanedAuthor =
      cleanVisibleText(author)

    if (!cleanedTitle) {
      setError(
        'Liburuaren izenburua idatzi.'
      )
      return
    }

    if (!cleanedAuthor) {
      setError(
        'Egilea idatzi.'
      )
      return
    }

    if (!pages) {
      setError(
        'Orrialde kopurua idatzi.'
      )
      return
    }

    const numericPages =
      Number(pages)

    if (
      !Number.isInteger(
        numericPages
      ) ||
      numericPages <= 0
    ) {
      setError(
        'Orrialde kopurua ez da zuzena.'
      )
      return
    }

    if (!selectedGenreId) {
      setError(
        'Generoa aukeratu.'
      )
      return
    }

    if (!selectedTopicId) {
      setError(
        'Gaia aukeratu.'
      )
      return
    }

    if (!selectedSubtopicId) {
      setError(
        'Azpigaia aukeratu.'
      )
      return
    }

    try {
      setSaving(true)

      // =========================
      // DUPLICADOS
      // =========================

      const titleNormalized =
        normalizeText(
          cleanedTitle
        )

      const authorNormalized =
        normalizeAuthor(
          cleanedAuthor
        )

      const {
        data: duplicateBook,
        error: duplicateError,
      } = await supabase
        .from('books')
        .select(
          'id, title, author'
        )
        .eq(
          'title_normalized',
          titleNormalized
        )
        .eq(
          'author_normalized',
          authorNormalized
        )
        .maybeSingle()

      if (duplicateError) {
        throw duplicateError
      }

      if (duplicateBook) {
        setError(
          `Liburu hori dagoeneko existitzen da: "${duplicateBook.title}", ${duplicateBook.author}.`
        )

        return
      }

      // =========================
      // PORTADA
      // =========================

      let coverUrl:
        | string
        | null = null

      let uploadedPath:
        | string
        | null = null

      if (coverFile) {
        const extension =
          getFileExtension(
            coverFile.name
          )

        const safeTitle =
          normalizeText(
            cleanedTitle
          )
            .replace(/\s+/g, '-')
            .slice(0, 40)

        const fileName =
          `${Date.now()}-${crypto.randomUUID()}-${safeTitle}.${extension}`

        uploadedPath =
          fileName

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(
              'book-covers'
            )
            .upload(
              fileName,
              coverFile,
              {
                cacheControl:
                  '3600',

                upsert: false,
              }
            )

        if (uploadError) {
          throw uploadError
        }

        const {
          data: publicData,
        } =
          supabase.storage
            .from(
              'book-covers'
            )
            .getPublicUrl(
              fileName
            )

        coverUrl =
          publicData.publicUrl
      }

      // =========================
      // CREAR LIBRO
      // =========================

      const {
        data: createdBook,
        error: bookError,
      } = await supabase
        .from('books')
        .insert({
          title:
            cleanedTitle,

          author:
            cleanedAuthor,

          publication_date:
            publicationDate ||
            null,

          pages:
            numericPages,

          language,

          cover_url:
            coverUrl,

          genre_id:
            selectedGenreId,

          topic_id:
            selectedTopicId,

          subtopic_id:
            selectedSubtopicId,
        })
        .select('id')
        .single()

      if (bookError) {
        // Si la creación falla
        // después de subir la portada,
        // intentamos limpiar Storage.
        if (uploadedPath) {
          await supabase.storage
            .from(
              'book-covers'
            )
            .remove([
              uploadedPath,
            ])
        }

        if (
          bookError.code ===
          '23505'
        ) {
          setError(
            'Liburu hori dagoeneko existitzen da.'
          )

          return
        }

        throw bookError
      }

      // =========================
      // GUARDAR ETIQUETAS
      // =========================

      if (
        selectedTagIds.length >
        0
      ) {
        const relations =
          selectedTagIds.map(
            (tagId) => ({
              book_id:
                createdBook.id,

              tag_id:
                tagId,
            })
          )

        const {
          error:
            tagsRelationError,
        } = await supabase
          .from('book_tags')
          .insert(relations)

        if (
          tagsRelationError
        ) {
          throw tagsRelationError
        }
      }

      setSuccessMessage(
        'Liburua behar bezala gehitu da.'
      )

      onCreated(
        createdBook.id
      )
    } catch (err) {
      console.error(
        'Error creando libro:',
        err
      )

      setError(
        'Ezin izan da liburua sortu. Saiatu berriro.'
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // CARGANDO
  // =========================

  if (loading) {
    return (
      <section className="page">
        <p className="placeholder">
          Aukerak kargatzen...
        </p>
      </section>
    )
  }

  // =========================
  // RENDER
  // =========================

  return (
    <section className="page">
      <div className="new-book-page">
        <button
          className="back-button"
          onClick={onBack}
          type="button"
        >
          ← Itzuli
        </button>

        <header className="form-header">
          <div className="small-logo">
            LIBURUBILA
          </div>

          <h1>
            Liburua gehitu
          </h1>

          <p>
            Gehitu oraindik
            Liburubilan ez dagoen
            liburu bat.
          </p>
        </header>

        <form
          className="new-book-form"
          onSubmit={
            handleSubmit
          }
        >
          {/* ======================
              LIBURUAREN DATUAK
              ====================== */}

          <section className="form-section">
            <div className="form-section-heading">
              <span className="form-step">
                1
              </span>

              <div>
                <h2>
                  Liburuaren datuak
                </h2>

                <p>
                  Oinarrizko
                  informazioa.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <label className="form-field form-field-wide">
                <span>
                  Izenburua
                </span>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target
                        .value
                    )
                  }
                  placeholder="Liburuaren izenburua"
                  required
                />
              </label>

              <label className="form-field form-field-wide">
                <span>
                  Egilea
                </span>

                <input
                  type="text"
                  value={author}
                  onChange={(e) =>
                    setAuthor(
                      e.target
                        .value
                    )
                  }
                  placeholder="Egilearen izen-abizenak"
                  required
                />
              </label>

              <label className="form-field">
                <span>
                  Argitalpen-data
                </span>

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
              </label>

              <label className="form-field">
                <span>
                  Orrialdeak
                </span>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={pages}
                  onChange={(e) =>
                    setPages(
                      e.target
                        .value
                    )
                  }
                  placeholder="Adib. 320"
                  required
                />
              </label>

              <label className="form-field">
                <span>
                  Hizkuntza
                </span>

                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(
                      e.target
                        .value
                    )
                  }
                >
                  {LANGUAGES.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>
          </section>

          {/* ======================
              SAILKAPENA
              ====================== */}

          <section className="form-section">
            <div className="form-section-heading">
              <span className="form-step">
                2
              </span>

              <div>
                <h2>
                  Sailkapena
                </h2>

                <p>
                  Aukeratu
                  liburua hobekien
                  deskribatzen duten
                  aukerak.
                </p>
              </div>
            </div>

            {/* GENEROA */}

            <div className="classification-block">
              <div className="classification-heading">
                <h3>
                  Generoa
                </h3>

                <span>
                  Aukera bat
                </span>
              </div>

              <div className="classification-options">
                {genres.map(
                  (genre) => (
                    <button
                      key={
                        genre.id
                      }
                      type="button"
                      className={
                        selectedGenreId ===
                        genre.id
                          ? 'classification-option selected'
                          : 'classification-option'
                      }
                      onClick={() =>
                        setSelectedGenreId(
                          genre.id
                        )
                      }
                    >
                      {
                        genre.name
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            {/* GAIA */}

            <div className="classification-block">
              <div className="classification-heading">
                <h3>
                  Gaia
                </h3>

                <span>
                  Aukera bat
                </span>
              </div>

              <div className="classification-options">
                {topics.map(
                  (topic) => (
                    <button
                      key={
                        topic.id
                      }
                      type="button"
                      className={
                        selectedTopicId ===
                        topic.id
                          ? 'classification-option selected'
                          : 'classification-option'
                      }
                      onClick={() =>
                        setSelectedTopicId(
                          topic.id
                        )
                      }
                    >
                      {
                        topic.name
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            {/* AZPIGAIA */}

            <div className="classification-block">
              <div className="classification-heading">
                <h3>
                  Azpigaia
                </h3>

                <span>
                  Aukera bat
                </span>
              </div>

              <div className="classification-options">
                {subtopics.map(
                  (
                    subtopic
                  ) => (
                    <button
                      key={
                        subtopic.id
                      }
                      type="button"
                      className={
                        selectedSubtopicId ===
                        subtopic.id
                          ? 'classification-option selected'
                          : 'classification-option'
                      }
                      onClick={() =>
                        setSelectedSubtopicId(
                          subtopic.id
                        )
                      }
                    >
                      {
                        subtopic.name
                      }
                    </button>
                  )
                )}
              </div>
            </div>
          </section>

          {/* ======================
              ETIKETAK
              ====================== */}

          <section className="form-section">
            <div className="form-section-heading">
              <span className="form-step">
                3
              </span>

              <div>
                <h2>
                  Etiketak
                </h2>

                <p>
                  Aukeratu nahi
                  dituzun guztiak,
                  edo sortu etiketa
                  berri bat.
                </p>
              </div>
            </div>

            <label className="form-field form-field-wide">
              <span>
                Etiketak bilatu
              </span>

              <input
                type="search"
                value={tagSearch}
                onChange={(e) =>
                  setTagSearch(
                    e.target
                      .value
                  )
                }
                placeholder="Adib. magia, saga, lagunak..."
              />
            </label>

            <div className="tags-bank">
              {filteredTags.map(
                (tag) => {
                  const selected =
                    selectedTagIds.includes(
                      tag.id
                    )

                  return (
                    <button
                      key={
                        tag.id
                      }
                      type="button"
                      className={
                        selected
                          ? 'tag-option selected'
                          : 'tag-option'
                      }
                      onClick={() =>
                        toggleTag(
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
                }
              )}
            </div>

            {filteredTags.length ===
              0 && (
              <p className="tags-empty">
                Ez da etiketa
                hori aurkitu.
                Berria sor dezakezu.
              </p>
            )}

            <div className="new-tag-box">
              <label className="form-field">
                <span>
                  Etiketa berria
                </span>

                <input
                  type="text"
                  value={
                    newTagName
                  }
                  onChange={(e) =>
                    setNewTagName(
                      e.target
                        .value
                    )
                  }
                  onKeyDown={(
                    e
                  ) => {
                    if (
                      e.key ===
                      'Enter'
                    ) {
                      e.preventDefault()

                      createTag()
                    }
                  }}
                  placeholder="Adib. Slow burn"
                />
              </label>

              <button
                type="button"
                className="secondary-button add-tag-button"
                disabled={
                  creatingTag ||
                  !newTagName.trim()
                }
                onClick={
                  createTag
                }
              >
                {creatingTag
                  ? 'Sortzen...'
                  : '+ Etiketa sortu'}
              </button>
            </div>

            {selectedTagIds.length >
              0 && (
              <div className="selected-tags-summary">
                <strong>
                  Aukeratutako
                  etiketak
                </strong>

                <div>
                  {tags
                    .filter(
                      (tag) =>
                        selectedTagIds.includes(
                          tag.id
                        )
                    )
                    .map(
                      (tag) => (
                        <button
                          key={
                            tag.id
                          }
                          type="button"
                          onClick={() =>
                            toggleTag(
                              tag.id
                            )
                          }
                        >
                          #
                          {
                            tag.name
                          }{' '}
                          ×
                        </button>
                      )
                    )}
                </div>
              </div>
            )}
          </section>

          {/* ======================
              PORTADA
              ====================== */}

          <section className="form-section">
            <div className="form-section-heading">
              <span className="form-step">
                4
              </span>

              <div>
                <h2>
                  Azala
                </h2>

                <p>
                  Liburuaren azala
                  gehitu.
                </p>
              </div>
            </div>

            <div className="cover-upload-area">
              {coverPreview ? (
                <div className="cover-preview">
                  <img
                    src={
                      coverPreview
                    }
                    alt="Azalaren aurrebista"
                  />

                  <button
                    type="button"
                    className="remove-cover-button"
                    onClick={() =>
                      setCoverFile(
                        null
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="cover-placeholder">
                  📖
                </div>
              )}

              <label className="cover-upload-button">
                <span>
                  {coverFile
                    ? 'Beste azal bat aukeratu'
                    : 'Azala aukeratu'}
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file =
                      e.target
                        .files?.[0] ??
                      null

                    setCoverFile(
                      file
                    )
                  }}
                />
              </label>
            </div>
          </section>

          {/* ======================
              ERRORES
              ====================== */}

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="success-message">
              {
                successMessage
              }
            </p>
          )}

          {/* ======================
              GUARDAR
              ====================== */}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onBack}
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
                : 'Liburua gehitu'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

// ============================================================
// UTILIDADES
// ============================================================

function cleanVisibleText(
  value: string
) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
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
    .replace(
      /[^a-z0-9\s]/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeAuthor(
  value: string
) {
  return normalizeText(
    value
  ).replace(/\s+/g, '')
}

function sortTags(
  tags: Tag[]
) {
  const unique = Array.from(
    new Map(
      tags.map((tag) => [
        tag.id,
        tag,
      ])
    ).values()
  )

  return unique.sort(
    (a, b) =>
      a.name.localeCompare(
        b.name,
        'eu',
        {
          sensitivity:
            'base',
        }
      )
  )
}

function getFileExtension(
  fileName: string
) {
  const extension =
    fileName
      .split('.')
      .pop()
      ?.toLowerCase()

  if (
    extension === 'png' ||
    extension === 'jpg' ||
    extension === 'jpeg' ||
    extension === 'webp'
  ) {
    return extension
  }

  return 'jpg'
}