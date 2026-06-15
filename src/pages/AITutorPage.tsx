import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import Button from '../components/ui/Button'

const COURSES = [
  { id: 'all', label: 'All Courses' },
  { id: 'bigdata', label: 'Big Data Analytics' },
  { id: 'dbms', label: 'Database Management Systems' },
  { id: 'ml', label: 'Machine Learning' },
  { id: 'networks', label: 'Computer Networks' },
]

const QUICK_PROMPTS = [
  'Explain MapReduce to me',
  "What's on my next deadline?",
  'Quiz me on SQL Joins',
  'Help me with my Lab Report',
]

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

function getMockResponse(text: string): string {
  const lower = text.toLowerCase()

  if (lower.includes('mapreduce') || lower.includes('hadoop')) {
    return `## MapReduce Explained

**MapReduce** is a programming model for processing large data sets across a distributed cluster.

### Two Core Phases

- **Map Phase**: Takes input data and converts it into key-value pairs. Each mapper processes a chunk of the input independently.
- **Reduce Phase**: Aggregates all values associated with the same key to produce a final result.

### How It Works

1. **Input Splitting** — The input dataset is split into fixed-size chunks.
2. **Mapping** — Each chunk is processed by a mapper function that emits \`(key, value)\` pairs.
3. **Shuffling & Sorting** — The framework groups all values by key.
4. **Reducing** — A reducer function merges all values for each key into a single output.

### Classic Example: Word Count

\`\`\`
Map("Hello World") -> [("hello", 1), ("world", 1)]
Reduce("hello", [1, 1]) -> ("hello", 2)
\`\`\`

**Hadoop** is the most popular open-source implementation of MapReduce. It uses HDFS (Hadoop Distributed File System) to store data across nodes.

> **Key advantage**: Fault tolerance — if a node fails, Hadoop automatically re-runs the task on another node.`
  }

  if (lower.includes('sql') || lower.includes('join')) {
    return `## SQL Joins Explained

SQL Joins combine rows from two or more tables based on a related column.

### Types of Joins

| Join Type | Description |
|-----------|-------------|
| **INNER JOIN** | Returns rows with matching values in both tables |
| **LEFT JOIN** | Returns all rows from the left table + matched rows from right |
| **RIGHT JOIN** | Returns all rows from the right table + matched rows from left |
| **FULL OUTER JOIN** | Returns all rows when there is a match in either table |
| **CROSS JOIN** | Returns the Cartesian product of both tables |

### Example

\`\`\`sql
-- INNER JOIN example
SELECT students.name, courses.title
FROM students
INNER JOIN enrollments ON students.id = enrollments.student_id
INNER JOIN courses ON enrollments.course_id = courses.id;
\`\`\`

### Tips to Remember

- **INNER JOIN** = intersection (only matches)
- **LEFT JOIN** = all left + matches on right (NULLs where no match)
- Always specify join conditions to avoid accidental CROSS JOINs
- Use table aliases to keep queries readable

> Think of Venn diagrams — each join type selects a different region.`
  }

  if (lower.includes('quiz')) {
    return `## Quiz Time!

Test your knowledge with these questions.

---

### Question 1
**What does the "Map" phase in MapReduce output?**

**Answer:** Key-value pairs. Each mapper emits \`(key, value)\` tuples that are then sorted and passed to reducers.

---

### Question 2
**What is the difference between a LEFT JOIN and an INNER JOIN in SQL?**

**Answer:** An **INNER JOIN** returns only rows with matches in both tables. A **LEFT JOIN** returns all rows from the left table, plus matched rows from the right — unmatched right rows appear as NULL.

---

### Question 3
**In a distributed system, what is "fault tolerance"?**

**Answer:** The ability of a system to continue operating correctly even when some of its components fail. In Hadoop, this is achieved by replicating data blocks across multiple nodes and re-scheduling failed tasks.

---

Reply **"more"** for additional questions or ask me to focus on a specific topic!`
  }

  if (lower.includes('deadline') || lower.includes('assignment')) {
    return `## Upcoming Deadlines

Here are your next assignments and deadlines:

### This Week

- **Lab Report 3** — *Big Data Analytics* — Due **Jun 17, 11:59 PM**
- **Problem Set 5** — *Database Management Systems* — Due **Jun 18, 5:00 PM**

### Next Week

- **Mid-term Project Proposal** — *Machine Learning* — Due **Jun 22, 11:59 PM**
- **Networking Lab Exercise** — *Computer Networks* — Due **Jun 24, 11:59 PM**

### Tips

- **Lab Report 3** is worth 15% of your grade — start with the methodology section.
- The **ML Project Proposal** should be 2-3 pages covering your dataset, model choice, and evaluation plan.

> Set a reminder 48 hours before each deadline to leave time for review!`
  }

  return `## Hi! I'm UniMate AI

I'm your **course-aware study assistant**. I can help you with:

- **Concept explanations** — Ask me to break down complex topics
- **Quizzes** — Test your understanding before exams
- **Assignment help** — Get guidance on your lab reports and projects
- **Study planning** — Create personalised study schedules
- **Deadline tracking** — Stay on top of upcoming submissions

### Try asking me:

- *"Explain MapReduce to me"*
- *"Quiz me on SQL Joins"*
- *"What's on my next deadline?"*
- *"Help me understand neural networks"*

What would you like to work on today?`
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 max-w-[80%]">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm font-bold">*</span>
      </div>
      <div className="bg-gray-100 dark:bg-white/10 rounded-2xl px-4 py-3 flex gap-1 items-center">
        <span
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  )
}

function XPToast() {
  return (
    <div className="fixed bottom-24 right-6 z-50 animate-bounce pointer-events-none">
      <div className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
        +5 XP
      </div>
    </div>
  )
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
    </svg>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [isTyping, setIsTyping] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedCourseLabel = COURSES.find((c) => c.id === selectedCourse)?.label ?? 'All Courses'

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const adjustTextareaHeight = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const maxHeight = 24 * 4 + 24
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    adjustTextareaHeight()
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      setIsTyping(true)

      await new Promise((res) => setTimeout(res, 1500))

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: getMockResponse(text),
        timestamp: new Date(),
      }

      setIsTyping(false)
      setMessages((prev) => [...prev, aiMsg])
      setShowXP(true)
      setTimeout(() => setShowXP(false), 2000)
    },
    [isTyping]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <SparkleIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                UniMate AI Tutor
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Powered by course-aware AI
              </p>
            </div>
          </div>

          {/* Course selector */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="course-select"
              className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block"
            >
              Focus on:
            </label>
            <select
              id="course-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              {COURSES.map((c) => (
                <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Course focus pill */}
        {selectedCourse !== 'all' && (
          <div className="max-w-3xl mx-auto mt-2">
            <span className="inline-flex items-center gap-1.5 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              Focused on: {selectedCourseLabel}
            </span>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
          {isEmpty ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg">
                <SparkleIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Ask me anything about your courses
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  I can explain concepts, quiz you, and help with assignments.
                </p>
              </div>

              {/* Quick prompt chips */}
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-full px-4 py-2 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 hover:shadow-md"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <SparkleIcon className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                      }`}
                    >
                      {msg.role === 'ai' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-code:bg-gray-200 dark:prose-code:bg-white/10 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-800 dark:prose-pre:bg-black/30">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <span>{msg.content}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 px-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && <TypingIndicator />}
            </>
          )}

          {/* Scroll anchor */}
          <div ref={scrollAnchorRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your courses..."
                rows={1}
                className="w-full resize-none bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 leading-6 overflow-hidden"
                style={{ minHeight: '48px', maxHeight: `${24 * 4 + 24}px` }}
              />
              {input.length > 200 && (
                <span
                  className={`absolute bottom-2 right-3 text-xs ${input.length > 500 ? 'text-red-400' : 'text-gray-400'}`}
                >
                  {input.length}
                </span>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              disabled={!input.trim() || isTyping}
              onClick={() => sendMessage(input)}
              className="flex-shrink-0 h-12 w-12 rounded-2xl p-0"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </Button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2 text-center">
            Press{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-gray-500 dark:text-gray-400">
              Enter
            </kbd>{' '}
            to send,{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-gray-500 dark:text-gray-400">
              Shift+Enter
            </kbd>{' '}
            for new line
          </p>
        </div>
      </div>

      {/* XP Toast */}
      {showXP && <XPToast />}
    </div>
  )
}
