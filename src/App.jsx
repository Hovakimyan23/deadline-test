import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { loadTasks, saveTasks } from './lib/storage.js'
import {
  PRIORITIES,
  priorityOrder,
  formatDeadline,
  deadlineStatus,
  todayISO,
} from './lib/tasks.js'
import './App.css'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
]

const SORTS = [
  { key: 'deadline', label: 'Deadline' },
  { key: 'priority', label: 'Priority' },
  { key: 'created', label: 'Newest' },
]

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export default function App() {
  const [tasks, setTasks] = useState(() => loadTasks())
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('deadline')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [error, setError] = useState('')
  const errorTimer = useRef(null)

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const showError = useCallback((msg) => {
    setError(msg)
    clearTimeout(errorTimer.current)
    errorTimer.current = setTimeout(() => setError(''), 3000)
  }, [])

  const addTask = useCallback(
    (e) => {
      e?.preventDefault()
      const trimmed = title.trim()
      if (!trimmed) return showError('Task cannot be empty')
      if (!deadline) return showError('Please set a deadline')

      setTasks((prev) => [
        ...prev,
        {
          id: uid(),
          title: trimmed,
          deadline,
          priority,
          completed: false,
          created_at: Date.now(),
        },
      ])
      setTitle('')
      setDeadline('')
      setPriority('medium')
    },
    [title, deadline, priority, showError],
  )

  const toggleComplete = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }, [])

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const startEdit = useCallback((task) => {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDeadline(task.deadline)
    setEditPriority(task.priority)
  }, [])

  const saveEdit = useCallback(
    (id) => {
      const trimmed = editTitle.trim()
      if (!trimmed) return showError('Task cannot be empty')
      if (!editDeadline) return showError('Please set a deadline')

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, title: trimmed, deadline: editDeadline, priority: editPriority }
            : t,
        ),
      )
      setEditingId(null)
    },
    [editTitle, editDeadline, editPriority, showError],
  )

  const cancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.completed))
  }, [])

  const visibleTasks = useMemo(() => {
    let result = [...tasks]

    if (filter === 'active') result = result.filter((t) => !t.completed)
    else if (filter === 'completed') result = result.filter((t) => t.completed)

    const q = search.trim().toLowerCase()
    if (q) result = result.filter((t) => t.title.toLowerCase().includes(q))

    result.sort((a, b) => {
      if (sort === 'priority') {
        return priorityOrder(b.priority) - priorityOrder(a.priority)
      }
      if (sort === 'created') {
        return b.created_at - a.created_at
      }
      return new Date(a.deadline) - new Date(b.deadline)
    })

    return result
  }, [tasks, filter, search, sort])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.completed).length
    const overdue = tasks.filter(
      (t) => !t.completed && deadlineStatus(t.deadline) === 'overdue',
    ).length
    return { total, completed, overdue, active: total - completed }
  }, [tasks])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-icon">
          <CheckIcon />
        </div>
        <h1>Deadline Checker</h1>
        <p className="subtitle">Stay on top of what's due and when</p>
      </header>

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{stats.active}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat">
          <span className="stat-value">{stats.completed}</span>
          <span className="stat-label">Done</span>
        </div>
        <div className="stat stat-danger">
          <span className="stat-value">{stats.overdue}</span>
          <span className="stat-label">Overdue</span>
        </div>
      </div>

      <form className="add-form" onSubmit={addTask}>
        <input
          className="input-title"
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
        <div className="form-row">
          <input
            className="input-date"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <select
            className="input-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {Object.entries(PRIORITIES).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label} priority
              </option>
            ))}
          </select>
          <button type="submit" className="btn-add">
            <PlusIcon /> Add
          </button>
        </div>
      </form>

      {error && <div className="error-banner">{error}</div>}

      <div className="controls">
        <div className="filter-group">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="control-right">
          <input
            className="search-input"
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="task-list">
        {visibleTasks.length === 0 && (
          <li className="empty-state">
            {tasks.length === 0 ? (
              <>
                <span className="empty-icon">📋</span>
                <p>No tasks yet. Add one above to get started!</p>
              </>
            ) : (
              <p>No tasks match your filters.</p>
            )}
          </li>
        )}

        {visibleTasks.map((task) => {
          const dl = formatDeadline(task.deadline)
          const isEditing = editingId === task.id

          if (isEditing) {
            return (
              <li key={task.id} className="task-item editing">
                <div className="edit-form">
                  <input
                    className="input-title edit-input"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={200}
                    autoFocus
                  />
                  <div className="form-row">
                    <input
                      className="input-date"
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                    />
                    <select
                      className="input-priority"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                    >
                      {Object.entries(PRIORITIES).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button className="btn-save" onClick={() => saveEdit(task.id)}>
                      Save
                    </button>
                    <button className="btn-cancel" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              </li>
            )
          }

          return (
            <li
              key={task.id}
              className={`task-item ${task.completed ? 'completed' : ''} status-${dl.status}`}
            >
              <button
                className="check-btn"
                onClick={() => toggleComplete(task.id)}
                aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
              >
                {task.completed && <CheckIcon />}
              </button>
              <div className="task-body">
                <span className="task-title">{task.title}</span>
                <div className="task-meta">
                  <span className={`deadline-badge status-${dl.status}`}>
                    <ClockIcon /> {dl.text}
                  </span>
                  <span
                    className="priority-badge"
                    style={{
                      background: PRIORITIES[task.priority]?.color + '22',
                      color: PRIORITIES[task.priority]?.color,
                    }}
                  >
                    {PRIORITIES[task.priority]?.label}
                  </span>
                </div>
              </div>
              <div className="task-actions">
                <button className="icon-btn edit" onClick={() => startEdit(task)} aria-label="Edit task">
                  <PencilIcon />
                </button>
                <button
                  className="icon-btn delete"
                  onClick={() => deleteTask(task.id)}
                  aria-label="Delete task"
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {stats.completed > 0 && (
        <div className="footer">
          <button className="btn-clear" onClick={clearCompleted}>
            Clear {stats.completed} completed
          </button>
        </div>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}
