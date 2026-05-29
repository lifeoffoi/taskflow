import { useEffect, useState } from 'react';
import axios from 'axios';

const EMPTY_FORM = { title: '', description: '', status: 'pending', priority: 'medium', deadline: '', userId: '' };

const AllTasks = () => {
  const [tasks, setTasks]     = useState([]);
  const [users, setUsers]     = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:3001/tasks'),
      axios.get('http://localhost:3001/users'),
    ])
      .then(([tasksRes, usersRes]) => {
        setTasks(tasksRes.data);
        setUsers(usersRes.data);
        const map = {};
        usersRes.data.forEach(u => { map[u.id] = u; });
        setUserMap(map);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const field = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.userId) return;
    setSubmitting(true);
    try {
      const newTask = { ...form, id: String(Date.now()) };
      const res = await axios.post('http://localhost:3001/tasks', newTask);
      setTasks(prev => [...prev, res.data]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '1rem' }}>Loading...</div>;
  if (error)   return <div style={{ padding: '1rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Manage Tasks</h2>

      <form onSubmit={handleAdd} style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 480 }}>
        <h3 style={{ margin: 0 }}>Assign Task to User</h3>

        <select value={form.userId} onChange={field('userId')} required>
          <option value="" disabled>Select user...</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </select>

        <input value={form.title} onChange={field('title')} placeholder="Title" required />
        <input value={form.description} onChange={field('description')} placeholder="Description" />

        <select value={form.status} onChange={field('status')}>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select value={form.priority} onChange={field('priority')}>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <input type="date" value={form.deadline} onChange={field('deadline')} />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Assigning...' : 'Assign Task'}
        </button>
      </form>

      <p style={{ color: '#888', marginBottom: '1rem' }}>{tasks.length} total tasks across all users</p>
      <ul style={{ padding: 0 }}>
        {tasks.map(task => {
          const owner = userMap[task.userId];
          const ownerLabel = owner ? (owner.name || owner.email) : task.userId;
          return (
            <li key={task.id} style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.75rem', listStyle: 'none' }}>
              <strong>{task.title}</strong>
              {task.description && <p style={{ margin: '4px 0' }}>{task.description}</p>}
              <small>
                Status: {task.status}
                {task.priority && ` | Priority: ${task.priority}`}
                {task.deadline && ` | Due: ${task.deadline}`}
                {` | User: ${ownerLabel}`}
              </small>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AllTasks;
