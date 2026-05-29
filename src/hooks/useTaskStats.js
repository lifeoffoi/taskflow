import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useTaskStats = () => {
  const tasks = useSelector(state => state.tasks.items);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    return { total, completed, inProgress, pending };
  }, [tasks]);

  return stats;
};