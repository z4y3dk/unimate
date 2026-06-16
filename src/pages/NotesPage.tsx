import { useState, useRef, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Button from '../components/ui/Button'
import { useNotes } from '../hooks/useNotes'
import { useCourses } from '../hooks/useCourses'
import { useNoteFolders } from '../hooks/useNoteFolders'
import { useNotePages } from '../hooks/useNotePages'
import {
  Search,
  Plus,
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Pen,
  Highlighter,
  Eraser,
  Undo2,
  Trash2,
  Sparkles,
  Loader2,
  ChevronLeft,
  Folder,
  FolderPlus,
  X,
  Tag,
  ChevronRight,
  FileText,
} from 'lucide-react'

const AI_MOCK: Record<string, string> = {
  Summarize:
    '**Summary:** This note covers key concepts including data processing pipelines, distributed computing with Hadoop, and MapReduce fundamentals. Key terms: **HDFS**, **MapReduce**, **YARN**.',
  Expand:
    '**Expanded:** MapReduce is a programming model for processing large datasets in parallel across a distributed cluster. It consists of two phases: the **Map** phase, which filters and sorts data, and the **Reduce** phase, which performs a summary operation...',
  'Quiz Me':
    '**Quiz:**\n1. What does HDFS stand for?\n2. Name the two phases of MapReduce.\n3. What is the role of YARN in Hadoop?',
  Simplify:
    "**Simplified:** Big Data Analytics is about working with huge amounts of data that normal computers can't handle. Hadoop is like a team of workers — each one handles a small piece of the data, then they combine results.",
}

type EditorMode = 'write' | 'draw' | 'preview'
type DrawTool = 'pen' | 'highlighter' | 'eraser'

interface Stroke {
  points: { x: number; y: number }[]
  color: string
  size: number
  tool: DrawTool
}

const DRAW_COLORS = ['#7c3aed', '#0891b2', '#059669', '#dc2626', '#d97706', '#1f2937']
const DRAW_SIZES = [2, 4, 8, 16]

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function drawStrokes(canvas: HTMLCanvasElement, strokeList: Stroke[]) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const stroke of strokeList) {
    if (stroke.points.length < 2) continue
    ctx.beginPath()
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.globalAlpha = 1
    } else if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = stroke.color
      ctx.globalAlpha = 0.35
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = stroke.color
      ctx.globalAlpha = 1
    }
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
}

export default function NotesPage() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes()
  const { courses } = useCourses()
  const { folders, addFolder, updateFolder, deleteFolder } = useNoteFolders()

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('All Courses')
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode>('write')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [aiOutput, setAiOutput] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showMobileEditor, setShowMobileEditor] = useState(false)

  // Folder management UI
  const [showFolderEditor, setShowFolderEditor] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Tag input
  const [tagInput, setTagInput] = useState('')

  // Local content/title buffers so typing doesn't wait on round-trips
  const [draftContent, setDraftContent] = useState('')
  const [draftTitle, setDraftTitle] = useState('')

  // Pages (multi-page notes)
  const { pages, addPage, updatePage, deletePage } = useNotePages(activeNoteId)
  const [activePageIndex, setActivePageIndex] = useState(0)

  // Draw state
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawTool, setDrawTool] = useState<DrawTool>('pen')
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[0])
  const [drawSize, setDrawSize] = useState(DRAW_SIZES[1])
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const currentStrokeRef = useRef<Stroke | null>(null)
  const isDrawing = useRef(false)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Select first note once notes load
  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id)
    }
  }, [notes, activeNoteId])

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null
  const activePage = pages[activePageIndex] ?? null

  // Sync draft buffers when active note changes
  useEffect(() => {
    setDraftTitle(activeNote?.title ?? '')
    setActivePageIndex(0)
  }, [activeNote?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync draft content when the active page changes (pages loaded/changed/switched)
  useEffect(() => {
    setDraftContent(activePage?.content ?? activeNote?.content ?? '')
  }, [activePage?.id, activeNote?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const courseNames = courses.map((c) => c.name)
  const COURSES_FILTER = ['All Courses', ...courseNames]

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags ?? []))).sort()

  const filteredNotes = notes.filter((n) => {
    const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCourse = selectedCourse === 'All Courses' || n.course_name === selectedCourse
    const matchFolder = selectedFolderId === 'all' || n.folder_id === selectedFolderId
    const matchTag = !selectedTag || (n.tags ?? []).includes(selectedTag)
    return matchSearch && matchCourse && matchFolder && matchTag
  })

  // Redraw canvas when switching to draw mode
  useEffect(() => {
    if (editorMode === 'draw' && canvasRef.current) {
      drawStrokes(canvasRef.current, strokes)
    }
  }, [editorMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save debounce (writes to the active page; falls back to note.content for page 1
  // when no note_pages row exists yet, e.g. legacy notes not yet backfilled)
  const handleContentChange = useCallback(
    (value: string) => {
      setDraftContent(value)
      setSaveStatus('saving')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        if (activePage) {
          updatePage(activePage.id, { content: value })
        } else if (activeNoteId) {
          updateNote(activeNoteId, { content: value })
        }
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, 2000)
    },
    [activeNoteId, activePage, updateNote, updatePage]
  )

  const handleTitleChange = useCallback(
    (value: string) => {
      setDraftTitle(value)
      setSaveStatus('saving')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        if (activeNoteId) {
          updateNote(activeNoteId, { title: value })
        }
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, 2000)
    },
    [activeNoteId, updateNote]
  )

  // Toolbar insert helpers
  const insertAtCursor = useCallback((before: string, after = '') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = ta.value.slice(start, end)
    const newVal = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
    nativeInputValueSetter?.call(ta, newVal)
    ta.dispatchEvent(new Event('input', { bubbles: true }))
    ta.focus()
    requestAnimationFrame(() => {
      ta.selectionStart = start + before.length
      ta.selectionEnd = start + before.length + selected.length
    })
  }, [])

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      if ('touches' in e) {
        const touch = e.touches[0]
        return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }
      }
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
    },
    []
  )

  const handleCanvasStart = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      isDrawing.current = true
      const pt = getCanvasPoint(e)
      currentStrokeRef.current = { points: [pt], color: drawColor, size: drawSize, tool: drawTool }
    },
    [drawColor, drawSize, drawTool, getCanvasPoint]
  )

  const handleCanvasMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      if (!isDrawing.current || !currentStrokeRef.current) return
      const pt = getCanvasPoint(e)
      currentStrokeRef.current = {
        ...currentStrokeRef.current,
        points: [...currentStrokeRef.current.points, pt],
      }
      if (canvasRef.current) {
        drawStrokes(canvasRef.current, [...strokes, currentStrokeRef.current])
      }
    },
    [getCanvasPoint, strokes]
  )

  const handleCanvasEnd = useCallback(() => {
    if (!isDrawing.current || !currentStrokeRef.current) return
    isDrawing.current = false
    const finished = currentStrokeRef.current
    currentStrokeRef.current = null
    setStrokes((prev) => [...prev, finished])
  }, [])

  const handleUndo = useCallback(() => {
    setStrokes((prev) => {
      const next = prev.slice(0, -1)
      if (canvasRef.current) drawStrokes(canvasRef.current, next)
      return next
    })
  }, [])

  const handleClearCanvas = useCallback(() => {
    setStrokes([])
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const handleAiAction = async (action: string) => {
    setAiLoading(true)
    setAiOutput(null)
    await new Promise((r) => setTimeout(r, 1500))
    setAiOutput(AI_MOCK[action] ?? '')
    setAiLoading(false)
  }

  // ── Page navigation ───────────────────────────────────────────────────
  const handleAddPage = async () => {
    const nextPageNumber = (pages[pages.length - 1]?.page_number ?? 0) + 1
    const result = await addPage({ page_number: nextPageNumber, content: '', canvas_data: null })
    if (result?.data) {
      setActivePageIndex(pages.length)
    }
  }

  const handlePrevPage = () => {
    setActivePageIndex((i) => Math.max(0, i - 1))
  }

  const handleNextPage = () => {
    setActivePageIndex((i) => Math.min(pages.length - 1, i + 1))
  }

  const handleDeletePage = async (id: string) => {
    if (pages.length <= 1) return
    await deletePage(id)
    setActivePageIndex((i) => Math.max(0, i - 1))
  }

  // ── Folder management ────────────────────────────────────────────────
  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    await addFolder({ name })
    setNewFolderName('')
  }

  const handleStartRenameFolder = (id: string, currentName: string) => {
    setRenamingFolderId(id)
    setRenameValue(currentName)
  }

  const handleConfirmRenameFolder = async () => {
    const name = renameValue.trim()
    if (renamingFolderId && name) {
      await updateFolder(renamingFolderId, { name })
    }
    setRenamingFolderId(null)
    setRenameValue('')
  }

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id)
    if (selectedFolderId === id) setSelectedFolderId('all')
  }

  // ── Tag management ───────────────────────────────────────────────────
  const handleAddTag = async () => {
    const tag = tagInput.trim()
    if (!tag || !activeNote) return
    const existing = activeNote.tags ?? []
    if (existing.includes(tag)) {
      setTagInput('')
      return
    }
    await updateNote(activeNote.id, { tags: [...existing, tag] })
    setTagInput('')
  }

  const handleRemoveTag = async (tag: string) => {
    if (!activeNote) return
    const existing = activeNote.tags ?? []
    await updateNote(activeNote.id, { tags: existing.filter((t) => t !== tag) })
  }

  const handleNewNote = async () => {
    const firstCourse = courses[0]
    const result = await addNote({
      title: 'Untitled Note',
      course_id: firstCourse?.id ?? null,
      course_name: firstCourse?.name ?? 'General',
      course_color: firstCourse?.color ?? '#7c3aed',
      content: '',
    })
    if (result?.data) {
      setActiveNoteId(result.data.id)
      setShowMobileEditor(true)
      setEditorMode('write')
    }
  }

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id)
    if (activeNoteId === id) {
      setActiveNoteId(null)
    }
  }

  const handleSelectNote = (id: string) => {
    setActiveNoteId(id)
    setShowMobileEditor(true)
    setAiOutput(null)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Loading notes...
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={[
          'flex-shrink-0 w-full md:w-72 flex flex-col',
          'bg-gray-50 dark:bg-white/[0.03] border-r border-gray-200 dark:border-white/10',
          showMobileEditor ? 'hidden md:flex' : 'flex',
        ].join(' ')}
      >
        {/* Sidebar header */}
        <div className="p-4 space-y-3 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notes</h2>
            <Button size="sm" variant="primary" onClick={handleNewNote} className="gap-1">
              <Plus size={14} />
              New
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Course filter */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            {COURSES_FILTER.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Folder filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="all">All Folders</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowFolderEditor((v) => !v)}
              title="Manage folders"
              className={[
                'p-1.5 rounded-md transition-colors flex-shrink-0',
                showFolderEditor
                  ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10',
              ].join(' ')}
            >
              <FolderPlus size={16} />
            </button>
          </div>

          {/* Folder editor */}
          {showFolderEditor && (
            <div className="space-y-2 p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="New folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  className="flex-1 px-2 py-1 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button
                  onClick={handleCreateFolder}
                  className="p-1 rounded-md text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  title="Add folder"
                >
                  <Plus size={14} />
                </button>
              </div>
              {folders.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-1">No folders yet</p>
              ) : (
                folders.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 px-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                    {renamingFolderId === f.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmRenameFolder()}
                        onBlur={handleConfirmRenameFolder}
                        className="flex-1 px-1 py-0.5 text-xs bg-gray-50 dark:bg-white/10 border border-violet-300 dark:border-violet-700 rounded text-gray-900 dark:text-white focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => handleStartRenameFolder(f.id, f.name)}
                        className="flex-1 text-left text-xs text-gray-700 dark:text-gray-300 truncate hover:text-violet-600 dark:hover:text-violet-400"
                      >
                        {f.name}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFolder(f.id)}
                      className="p-0.5 rounded text-gray-400 hover:text-red-500"
                      title="Delete folder"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag size={12} className="text-gray-400 flex-shrink-0" />
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag((t) => (t === tag ? null : tag))}
                  className={[
                    'px-2 py-0.5 text-xs rounded-full transition-colors',
                    selectedTag === tag
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20',
                  ].join(' ')}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredNotes.length === 0 ? (
            <p className="text-center text-sm text-gray-400 mt-8">No notes found</p>
          ) : (
            filteredNotes.map((note) => {
              const isActive = note.id === activeNoteId
              return (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note.id)}
                  className={[
                    'w-full text-left px-4 py-3 transition-colors border-l-2',
                    isActive
                      ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-500'
                      : 'border-transparent hover:bg-gray-100 dark:hover:bg-white/5',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: note.course_color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{note.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{note.course_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        {note.content.replace(/[#*\-`]/g, '').slice(0, 60)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {note.folder_id && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                            <Folder size={10} />
                            {folders.find((f) => f.id === note.folder_id)?.name}
                          </span>
                        )}
                        {(note.tags ?? []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatRelative(note.updated_at)}</p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Editor panel */}
      <div
        className={[
          'flex-1 flex flex-col min-w-0 overflow-hidden',
          !showMobileEditor ? 'hidden md:flex' : 'flex',
        ].join(' ')}
      >
        {!activeNote ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Select or create a note
          </div>
        ) : (
          <>
            {/* Editor top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile back */}
                <button
                  onClick={() => setShowMobileEditor(false)}
                  className="md:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 flex-shrink-0"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Note title */}
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-base font-semibold bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-1 min-w-0 truncate"
                />
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Save status */}
                <span className="text-xs text-gray-400 dark:text-gray-500 min-w-[60px] text-right">
                  {saveStatus === 'saving' && 'Saving...'}
                  {saveStatus === 'saved' && 'Saved ✓'}
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete note"
                >
                  <Trash2 size={16} />
                </button>

                {/* Mode toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
                  {(['write', 'draw', 'preview'] as EditorMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setEditorMode(mode)}
                      className={[
                        'px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors',
                        editorMode === mode
                          ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                      ].join(' ')}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Folder / tags / page bar */}
            <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-gray-200 dark:border-white/10 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                {/* Folder assignment */}
                <div className="flex items-center gap-1">
                  <Folder size={14} className="text-gray-400" />
                  <select
                    value={activeNote.folder_id ?? ''}
                    onChange={(e) => updateNote(activeNote.id, { folder_id: e.target.value || null })}
                    className="text-xs bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md px-1.5 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">No Folder</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag size={14} className="text-gray-400" />
                  {(activeNote.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    className="w-20 px-1.5 py-0.5 text-xs bg-transparent border border-dashed border-gray-300 dark:border-white/20 rounded-md text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <FileText size={14} className="text-gray-400" />
                <button
                  onClick={handlePrevPage}
                  disabled={activePageIndex === 0}
                  className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[70px] text-center">
                  Page {pages.length > 0 ? activePageIndex + 1 : 1} / {pages.length > 0 ? pages.length : 1}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={activePageIndex >= pages.length - 1}
                  className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                  title="Next page"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={handleAddPage}
                  className="p-1 rounded-md text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  title="Add page"
                >
                  <Plus size={14} />
                </button>
                {pages.length > 1 && activePage && (
                  <button
                    onClick={() => handleDeletePage(activePage.id)}
                    className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete page"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Write mode toolbar */}
            {editorMode === 'write' && (
              <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                {[
                  { icon: Heading1, label: 'H1', action: () => insertAtCursor('# ') },
                  { icon: Heading2, label: 'H2', action: () => insertAtCursor('## ') },
                  { icon: Bold, label: 'Bold', action: () => insertAtCursor('**', '**') },
                  { icon: Italic, label: 'Italic', action: () => insertAtCursor('*', '*') },
                  { icon: List, label: 'Bullet', action: () => insertAtCursor('- ') },
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    title={label}
                    onClick={action}
                    className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            )}

            {/* Draw mode toolbar */}
            {editorMode === 'draw' && (
              <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                {/* Tools */}
                <div className="flex items-center gap-1">
                  {(
                    [
                      ['pen', Pen],
                      ['highlighter', Highlighter],
                      ['eraser', Eraser],
                    ] as [DrawTool, React.ElementType][]
                  ).map(([tool, Icon]) => (
                    <button
                      key={tool}
                      title={tool}
                      onClick={() => setDrawTool(tool)}
                      className={[
                        'p-1.5 rounded-md transition-colors capitalize',
                        drawTool === tool
                          ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10',
                      ].join(' ')}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>

                {/* Colors */}
                <div className="flex items-center gap-1">
                  {DRAW_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setDrawColor(c)}
                      title={c}
                      className={[
                        'w-5 h-5 rounded-full border-2 transition-transform',
                        drawColor === c ? 'border-white scale-125' : 'border-transparent',
                      ].join(' ')}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                {/* Sizes */}
                <div className="flex items-center gap-1">
                  {DRAW_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setDrawSize(s)}
                      title={`Size ${s}`}
                      className={[
                        'flex items-center justify-center w-6 h-6 rounded-md transition-colors',
                        drawSize === s
                          ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10',
                      ].join(' ')}
                    >
                      <span
                        className="rounded-full bg-current"
                        style={{ width: Math.min(s, 12), height: Math.min(s, 12) }}
                      />
                    </button>
                  ))}
                </div>

                {/* Undo / Clear */}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={handleUndo}
                    disabled={strokes.length === 0}
                    className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 transition-colors"
                    title="Undo"
                  >
                    <Undo2 size={16} />
                  </button>
                  <button
                    onClick={handleClearCanvas}
                    className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    title="Clear"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Editor content */}
            <div className="flex-1 overflow-y-auto p-4">
              {editorMode === 'write' && (
                <textarea
                  ref={textareaRef}
                  value={draftContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start writing your note..."
                  className="w-full h-full min-h-[300px] bg-transparent text-gray-900 dark:text-gray-100 text-sm leading-relaxed resize-none focus:outline-none placeholder-gray-400 font-mono"
                  spellCheck
                />
              )}

              {editorMode === 'draw' && (
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={400}
                  onMouseDown={handleCanvasStart}
                  onMouseMove={handleCanvasMove}
                  onMouseUp={handleCanvasEnd}
                  onMouseLeave={handleCanvasEnd}
                  onTouchStart={handleCanvasStart}
                  onTouchMove={handleCanvasMove}
                  onTouchEnd={handleCanvasEnd}
                  className="border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-950 cursor-crosshair w-full"
                  style={{ height: '400px', touchAction: 'none' }}
                />
              )}

              {editorMode === 'preview' && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{draftContent}</ReactMarkdown>
                </div>
              )}

              {/* AI actions (write + preview mode) */}
              {(editorMode === 'write' || editorMode === 'preview') && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Sparkles size={14} className="text-violet-500" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">AI Actions:</span>
                    {['Summarize', 'Expand', 'Quiz Me', 'Simplify'].map((action) => (
                      <Button
                        key={action}
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAiAction(action)}
                        disabled={aiLoading}
                        className="text-xs"
                      >
                        {action}
                      </Button>
                    ))}
                  </div>

                  {aiLoading && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <Loader2 size={16} className="animate-spin text-violet-500" />
                      Generating...
                    </div>
                  )}

                  {aiOutput && !aiLoading && (
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mt-4 border border-gray-100 dark:border-white/10">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{aiOutput}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
