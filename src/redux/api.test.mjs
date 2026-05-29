import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

const authModule = await import('./authSlice.js');
const tasksModule = await import('./tasksSlice.js');

const {
  default: authReducer,
  loginUser,
  logout,
  registerUser,
} = authModule;

const {
  default: tasksReducer,
  addTask,
  deleteTask,
  fetchTasks,
  updateTask,
  updateTaskStatus,
} = tasksModule;

const createTestStore = () => configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
  },
});

const mockAxios = ({ get, post, patch, del }) => {
  const calls = [];
  axios.get = async (url) => {
    calls.push({ method: 'get', url });
    return get(url);
  };
  axios.post = async (url, data) => {
    calls.push({ method: 'post', url, data });
    return post(url, data);
  };
  axios.patch = async (url, data) => {
    calls.push({ method: 'patch', url, data });
    return patch(url, data);
  };
  axios.delete = async (url) => {
    calls.push({ method: 'delete', url });
    return del(url);
  };
  return calls;
};

describe('auth endpoints and state', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('registers a new user after checking that the email is unique', async () => {
    const calls = mockAxios({
      get: async () => ({ data: [] }),
      post: async (_url, data) => ({ data: { ...data, id: 'user-1' } }),
      patch: async () => ({ data: {} }),
      del: async () => ({}),
    });
    const store = createTestStore();

    const result = await store.dispatch(registerUser({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'secret',
    }));

    assert.equal(result.meta.requestStatus, 'fulfilled');
    assert.deepEqual(calls, [
      { method: 'get', url: 'http://localhost:3001/users?email=ada%40example.com' },
      {
        method: 'post',
        url: 'http://localhost:3001/users',
        data: { name: 'Ada', email: 'ada@example.com', password: 'secret', role: 'user' },
      },
    ]);
    assert.equal(store.getState().auth.user.id, 'user-1');
    assert.equal(JSON.parse(storage.get('user')).email, 'ada@example.com');
  });

  it('rejects duplicate registrations without posting a new user', async () => {
    const calls = mockAxios({
      get: async () => ({ data: [{ id: 'existing' }] }),
      post: async () => { throw new Error('post should not be called'); },
      patch: async () => ({ data: {} }),
      del: async () => ({}),
    });
    const store = createTestStore();

    const result = await store.dispatch(registerUser({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'secret',
      role: 'admin',
    }));

    assert.equal(result.meta.requestStatus, 'rejected');
    assert.equal(result.payload, 'Email already exists');
    assert.deepEqual(calls, [
      { method: 'get', url: 'http://localhost:3001/users?email=ada%40example.com' },
    ]);
    assert.equal(store.getState().auth.error, 'Email already exists');
  });

  it('logs in with matching credentials and persists the current user', async () => {
    const user = { id: 'user-1', email: 'ada@example.com', name: 'Ada', role: 'user' };
    const calls = mockAxios({
      get: async () => ({ data: [user] }),
      post: async () => ({ data: {} }),
      patch: async () => ({ data: {} }),
      del: async () => ({}),
    });
    const store = createTestStore();

    const result = await store.dispatch(loginUser({
      email: 'ada@example.com',
      password: 's p&c',
    }));

    assert.equal(result.meta.requestStatus, 'fulfilled');
    assert.deepEqual(calls, [
      { method: 'get', url: 'http://localhost:3001/users?email=ada%40example.com&password=s+p%26c' },
    ]);
    assert.equal(store.getState().auth.user.name, 'Ada');
    assert.equal(JSON.parse(storage.get('user')).id, 'user-1');
  });

  it('rejects invalid login attempts and clears saved users on logout', async () => {
    storage.set('user', JSON.stringify({ id: 'stale' }));
    const store = createTestStore();
    const calls = mockAxios({
      get: async () => ({ data: [] }),
      post: async () => ({ data: {} }),
      patch: async () => ({ data: {} }),
      del: async () => ({}),
    });

    const result = await store.dispatch(loginUser({
      email: 'missing@example.com',
      password: 'wrong',
    }));
    store.dispatch(logout());

    assert.equal(result.meta.requestStatus, 'rejected');
    assert.equal(result.payload, 'Invalid email or password');
    assert.deepEqual(calls, [
      { method: 'get', url: 'http://localhost:3001/users?email=missing%40example.com&password=wrong' },
    ]);
    assert.equal(store.getState().auth.user, null);
    assert.equal(storage.get('user'), undefined);
  });
});

describe('task endpoints and state', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('fetches tasks for the signed-in user', async () => {
    const tasks = [{ id: 'task-1', title: 'Write tests', status: 'pending', userId: 'user-1' }];
    const calls = mockAxios({
      get: async () => ({ data: tasks }),
      post: async () => ({ data: {} }),
      patch: async () => ({ data: {} }),
      del: async () => ({}),
    });
    const store = createTestStore();

    const result = await store.dispatch(fetchTasks('user 1'));

    assert.equal(result.meta.requestStatus, 'fulfilled');
    assert.deepEqual(calls, [
      { method: 'get', url: 'http://localhost:3001/tasks?userId=user+1' },
    ]);
    assert.deepEqual(store.getState().tasks.items, tasks);
    assert.equal(store.getState().tasks.status, 'succeeded');
  });

  it('creates tasks with user, status, priority, deadline, and generated id', async () => {
    const originalNow = Date.now;
    Date.now = () => 12345;
    const calls = mockAxios({
      get: async () => ({ data: [] }),
      post: async (_url, data) => ({ data }),
      patch: async () => ({ data: {} }),
      del: async () => ({}),
    });
    const store = createTestStore();

    try {
      const result = await store.dispatch(addTask({
        userId: 'user-1',
        task: {
          title: 'Ship it',
          description: 'Finish endpoint tests',
          status: 'in-progress',
          priority: 'high',
          deadline: '2026-06-01',
        },
      }));

      assert.equal(result.meta.requestStatus, 'fulfilled');
      assert.deepEqual(calls, [
        {
          method: 'post',
          url: 'http://localhost:3001/tasks',
          data: {
            id: '12345',
            userId: 'user-1',
            title: 'Ship it',
            description: 'Finish endpoint tests',
            status: 'in-progress',
            priority: 'high',
            deadline: '2026-06-01',
          },
        },
      ]);
      assert.equal(store.getState().tasks.items[0].title, 'Ship it');
    } finally {
      Date.now = originalNow;
    }
  });

  it('updates status through PATCH and replaces the task in state', async () => {
    const calls = mockAxios({
      get: async () => ({ data: [{ id: 'task-1', title: 'Ship it', status: 'pending' }] }),
      post: async () => ({ data: {} }),
      patch: async (_url, data) => ({ data: { id: 'task-1', title: 'Ship it', ...data } }),
      del: async () => ({}),
    });
    const store = createTestStore();
    await store.dispatch(fetchTasks('user-1'));

    const result = await store.dispatch(updateTaskStatus({ id: 'task-1', status: 'completed' }));

    assert.equal(result.meta.requestStatus, 'fulfilled');
    assert.equal(calls.at(-1).method, 'patch');
    assert.equal(calls.at(-1).url, 'http://localhost:3001/tasks/task-1');
    assert.deepEqual(calls.at(-1).data, { status: 'completed' });
    assert.equal(store.getState().tasks.items[0].status, 'completed');
  });

  it('updates editable task fields through PATCH', async () => {
    const calls = mockAxios({
      get: async () => ({ data: [{ id: 'task-1', title: 'Old title', status: 'pending' }] }),
      post: async () => ({ data: {} }),
      patch: async (_url, data) => ({ data: { id: 'task-1', status: 'pending', ...data } }),
      del: async () => ({}),
    });
    const store = createTestStore();
    await store.dispatch(fetchTasks('user-1'));

    const result = await store.dispatch(updateTask({
      id: 'task-1',
      title: 'New title',
      description: 'New description',
      priority: 'low',
      deadline: '2026-06-02',
    }));

    assert.equal(result.meta.requestStatus, 'fulfilled');
    assert.deepEqual(calls.at(-1), {
      method: 'patch',
      url: 'http://localhost:3001/tasks/task-1',
      data: {
        title: 'New title',
        description: 'New description',
        priority: 'low',
        deadline: '2026-06-02',
      },
    });
    assert.equal(store.getState().tasks.items[0].title, 'New title');
  });

  it('deletes tasks through DELETE and removes them from state', async () => {
    const calls = mockAxios({
      get: async () => ({ data: [
        { id: 'task-1', title: 'Keep', status: 'pending' },
        { id: 'task-2', title: 'Delete', status: 'pending' },
      ] }),
      post: async () => ({ data: {} }),
      patch: async () => ({ data: {} }),
      del: async () => ({}),
    });
    const store = createTestStore();
    await store.dispatch(fetchTasks('user-1'));

    const result = await store.dispatch(deleteTask('task-2'));

    assert.equal(result.meta.requestStatus, 'fulfilled');
    assert.deepEqual(calls.at(-1), {
      method: 'delete',
      url: 'http://localhost:3001/tasks/task-2',
    });
    assert.deepEqual(store.getState().tasks.items.map(task => task.id), ['task-1']);
  });

  it('stores failed fetches as task errors', async () => {
    mockAxios({
      get: async () => { throw new Error('server offline'); },
      post: async () => ({ data: {} }),
      patch: async () => ({ data: {} }),
      del: async () => ({}),
    });
    const store = createTestStore();

    const result = await store.dispatch(fetchTasks('user-1'));

    assert.equal(result.meta.requestStatus, 'rejected');
    assert.equal(store.getState().tasks.status, 'failed');
    assert.equal(store.getState().tasks.error, 'server offline');
  });
});
