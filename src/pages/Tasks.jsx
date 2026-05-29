import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Navigate } from 'react-router-dom';
import { fetchTasks, addTask, deleteTask, updateTaskStatus, updateTask } from '../redux/tasksSlice';
import { useTheme } from '../context/ThemeContext';
import SkeletonCard from '../components/SkeletonCard';

const STATUS_ORDER   = { pending: 0, 'in-progress': 1, completed: 2 };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const PRIORITY_STYLE = {
  high:   { color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', borderRadius: 4, fontSize: 12 },
  medium: { color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 4, fontSize: 12 },
  low:    { color: '#065f46', background: '#d1fae5', padding: '2px 8px', borderRadius: 4, fontSize: 12 },
};

const today = () => new Date(new Date().toDateString());
const isOverdue = (deadline, status) => deadline && new Date(deadline) < today() && status !== 'completed';

const Tasks = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { items: tasks, status, error } = useSelector(state => state.tasks);
  const { theme } = useTheme();

  // Add form state
  const [title, setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [statusVal, setStatusVal]   = useState('pending');
  const [priority, setPriority]   = useState('medium');
  const [deadline, setDeadline]   = useState('');

  // Search / sort — synced to URL query params for bookmarkable views
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'date';

  const setSearch = (val) => setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    if (val) next.set('search', val); else next.delete('search');
    return next;
  }, { replace: true });

  const setSortBy = (val) => setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    next.set('sort', val);
    return next;
  }, { replace: true });

  // Edit modal: holds a copy of the task being edited, or null
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    if (user) dispatch(fetchTasks(user.id));
  }, [dispatch, user]);

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter(task =>
      task.title.toLowerCase().includes(search.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      if (sortBy === 'title')    return a.title.localeCompare(b.title);
      if (sortBy === 'status')   return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (sortBy === 'priority') return PRIORITY_ORDER[a.priority ?? 'medium'] - PRIORITY_ORDER[b.priority ?? 'medium'];
      if (sortBy === 'deadline') {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return String(a.id).localeCompare(String(b.id));
    });
  }, [tasks, search, sortBy]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    dispatch(addTask({ task: { title, description, status: statusVal, priority, deadline }, userId: user.id }));
    setTitle(''); setDescription(''); setStatusVal('pending'); setPriority('medium'); setDeadline('');
  };

  const openEdit = (task) => setEditingTask({ ...task });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    dispatch(updateTask(editingTask));
    setEditingTask(null);
  };

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (status === 'failed') return <div>Error: {error}</div>;

  const cardClass = `task-card ${theme === 'dark' ? 'task-card-dark' : ''}`;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>My Tasks</h2>

      <form onSubmit={handleAdd} style={{ marginBottom: '2rem' }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
        <select value={statusVal} onChange={e => setStatusVal(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        <button type="submit">Add Task</button>
      </form>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks..."
          style={{ flex: 1 }}
        />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date">Sort: Date</option>
          <option value="title">Sort: Title</option>
          <option value="status">Sort: Status</option>
          <option value="priority">Sort: Priority</option>
          <option value="deadline">Sort: Deadline</option>
        </select>
      </div>

      <ul style={{ padding: 0 }}>
        {status === 'loading'
          ? [1, 2, 3].map(i => <SkeletonCard key={i} />)
          : visibleTasks.map(task => (
            <li key={task.id} className={cardClass}>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '0.25rem 0' }}>
                {task.priority && (
                  <span style={PRIORITY_STYLE[task.priority]}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                )}
                {task.deadline && (
                  <span style={{ fontSize: 12, color: isOverdue(task.deadline, task.status) ? 'red' : '#555' }}>
                    Due: {task.deadline}{isOverdue(task.deadline, task.status) ? ' (overdue)' : ''}
                  </span>
                )}
              </div>
              <select value={task.status} onChange={e => dispatch(updateTaskStatus({ id: task.id, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button onClick={() => openEdit(task)} style={{ marginLeft: '0.5rem' }}>Edit</button>
              <button onClick={() => dispatch(deleteTask(task.id))} style={{ marginLeft: '0.5rem', background: 'red', color: 'white' }}>Delete</button>
            </li>
          ))
        }
        {status !== 'loading' && tasks.length > 0 && visibleTasks.length === 0 && (
          <li style={{ listStyle: 'none', color: '#888' }}>No tasks found.</li>
        )}
      </ul>

      {editingTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setEditingTask(null)}
        >
          <div style={{ background: theme === 'dark' ? '#1c1d26' : '#fff', padding: '1.5rem', borderRadius: 8, minWidth: 320 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Edit Task</h3>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                value={editingTask.title}
                onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                placeholder="Title"
                required
              />
              <input
                value={editingTask.description ?? ''}
                onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                placeholder="Description"
              />
              <select value={editingTask.status} onChange={e => setEditingTask({ ...editingTask, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select value={editingTask.priority ?? 'medium'} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <input
                type="date"
                value={editingTask.deadline ?? ''}
                onChange={e => setEditingTask({ ...editingTask, deadline: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingTask(null)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
