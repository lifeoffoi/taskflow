import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from '../redux/tasksSlice';
import { useTaskStats } from '../hooks/useTaskStats';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const stats = useTaskStats();

  useEffect(() => {
    if (user) dispatch(fetchTasks(user.id));
  }, [dispatch, user]);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Welcome back, {user?.name}!</h2>
      <h3>Task Summary</h3>
      <ul>
        <li>Total tasks: {stats.total}</li>
        <li>Completed: {stats.completed}</li>
        <li>In Progress: {stats.inProgress}</li>
        <li>Pending: {stats.pending}</li>
      </ul>
    </div>
  );
};

export default Dashboard;
