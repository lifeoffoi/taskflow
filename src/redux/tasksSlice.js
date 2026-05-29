import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchTasks = createAsyncThunk('tasks/fetch', async (userId) => {
  const res = await axios.get(`http://localhost:3001/tasks?userId=${userId}`);
  return res.data;
});

export const addTask = createAsyncThunk('tasks/add', async ({ task, userId }) => {
  const newTask = { ...task, userId, id: Date.now() };
  const res = await axios.post('http://localhost:3001/tasks', newTask);
  return res.data;
});

export const deleteTask = createAsyncThunk('tasks/delete', async (taskId) => {
  await axios.delete(`http://localhost:3001/tasks/${taskId}`);
  return taskId;
});

export const updateTaskStatus = createAsyncThunk('tasks/update', async ({ id, status }) => {
  const res = await axios.patch(`http://localhost:3001/tasks/${id}`, { status });
  return res.data;
});

export const updateTask = createAsyncThunk('tasks/updateTask', async ({ id, ...changes }) => {
  const res = await axios.patch(`http://localhost:3001/tasks/${id}`, changes);
  return res.data;
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchTasks.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message; })
      .addCase(addTask.fulfilled, (state, action) => { state.items.push(action.payload); })
      .addCase(deleteTask.fulfilled, (state, action) => { state.items = state.items.filter(t => t.id !== action.payload); })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  }
});

export default tasksSlice.reducer;
