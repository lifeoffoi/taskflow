# TaskFlow — React + Redux Revision Reference

This project covers every core concept likely to appear on a React/Redux exam.
Use this file as a quick reference when you are under pressure and need to recall a pattern fast.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [How to Run](#how-to-run)
3. [Core React Hooks](#core-react-hooks)
4. [Redux Toolkit](#redux-toolkit)
5. [React Router](#react-router)
6. [Context API](#context-api)
7. [Custom Hooks](#custom-hooks)
8. [Class Components and Error Boundaries](#class-components-and-error-boundaries)
9. [Controlled Forms](#controlled-forms)
10. [Conditional Rendering](#conditional-rendering)
11. [Derived State](#derived-state)
12. [Exam Pattern Cheat Sheet](#exam-pattern-cheat-sheet)

---

## Project Structure

```
src/
  components/
    Navbar.jsx          # Navigation bar, uses useSelector + useContext
    ProtectedRoute.jsx  # Redirects unauthenticated users
    AdminRoute.jsx      # Redirects non-admin users
    ErrorBoundary.jsx   # Class component, catches render errors
    SkeletonCard.jsx    # Loading placeholder UI
  context/
    ThemeContext.jsx     # Global dark/light theme via Context API
  hooks/
    useLocalStorage.js  # Custom hook — useState synced to localStorage
    useTaskStats.js     # Custom hook — derived stats from Redux state
  pages/
    Login.jsx           # Controlled form, dispatches loginUser thunk
    Register.jsx        # Controlled form with role selection
    Dashboard.jsx       # Shows task stats from Redux
    Tasks.jsx           # Full task CRUD, search, sort, edit modal
    AllTasks.jsx        # Admin-only — all users tasks + assign form
  redux/
    store.js            # configureStore
    authSlice.js        # Auth state: login, register, logout
    tasksSlice.js       # Tasks state: fetch, add, delete, update
  App.jsx               # Router setup, all routes defined here
  main.jsx              # Entry point — renders Provider + App
  index.css             # Global styles + CSS variables for theming
db.json                 # json-server mock database (users + tasks)
```

---

## How to Run

You need two terminals running at the same time.

**Terminal 1 — Mock API:**
```bash
npx json-server --watch db.json --port 3001
```

**Terminal 2 — React app:**
```bash
npm run dev
```

App runs at `http://localhost:5173`
API runs at `http://localhost:3001`

---

## Core React Hooks

### useState

Declares a piece of state local to a component. Re-renders the component when it changes.

```jsx
const [title, setTitle] = useState('');
const [showModal, setShowModal] = useState(false);
const [task, setTask] = useState(null);
```

Updating an object — always spread, never mutate directly:
```jsx
// Wrong
state.name = 'new';

// Correct
setTask(prev => ({ ...prev, name: 'new' }));
```

**Where in this project:** every component with a form or toggle.

---

### useEffect

Runs side effects after render. The dependency array controls when it re-runs.

```jsx
// Runs once on mount (empty array)
useEffect(() => {
  fetchData();
}, []);

// Runs whenever user changes
useEffect(() => {
  if (user) dispatch(fetchTasks(user.id));
}, [dispatch, user]);

// Cleanup — runs before the effect fires again and on unmount
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);
```

**Where in this project:** `Dashboard.jsx`, `Tasks.jsx`, `AllTasks.jsx`, `ThemeContext.jsx`.

---

### useMemo

Memoizes an expensive calculation. Only recomputes when its dependencies change.
Use it for derived data — filtering, sorting, transforming arrays.

```jsx
const visibleTasks = useMemo(() => {
  const filtered = tasks.filter(task =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );
  return [...filtered].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });
}, [tasks, search, sortBy]);
```

**Rule:** do NOT put side effects inside useMemo. It is for pure calculations only.

**Where in this project:** `Tasks.jsx` (filter + sort), `useTaskStats.js`.

---

### useContext

Reads a value from the nearest matching Provider above in the tree.

```jsx
// 1. Create the context
const ThemeContext = createContext();

// 2. Provide it high up in the tree
<ThemeContext.Provider value={{ theme, toggleTheme }}>
  {children}
</ThemeContext.Provider>

// 3. Consume it anywhere below
const { theme, toggleTheme } = useContext(ThemeContext);
```

**Where in this project:** `ThemeContext.jsx` creates and provides it. `Navbar.jsx` and `Tasks.jsx` consume it via the `useTheme()` custom hook.

---

### useReducer

An alternative to useState for complex state with multiple sub-values or actions.

```jsx
const initialState = { count: 0, step: 1 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + action.payload };
    case 'reset':     return initialState;
    default:          return state;
  }
}

const [state, dispatch] = useReducer(reducer, initialState);

dispatch({ type: 'increment', payload: state.step });
```

**Pattern:** use `useState` for simple independent values; use `useReducer` when multiple values change together or the next state depends on the previous.

---

## Redux Toolkit

### Store Setup — `src/redux/store.js`

```js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import tasksReducer from './tasksSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
  },
});
```

### Connecting Redux to React — `src/main.jsx`

```jsx
import { Provider } from 'react-redux';
import { store } from './redux/store';

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

---

### createSlice

Defines state shape, reducers (sync actions), and auto-generates action creators.

```js
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    status: 'idle',
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    // async action results handled here
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

**Important:** Redux Toolkit uses Immer internally, so you CAN write mutating code like `state.user = null` inside a reducer. This is safe ONLY inside Redux Toolkit reducers.

---

### createAsyncThunk

Handles async operations (API calls). Auto-dispatches `pending`, `fulfilled`, and `rejected` actions.

```js
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/users?email=${email}&password=${password}`
      );
      if (response.data.length === 0)
        return rejectWithValue('Invalid email or password');
      return response.data[0]; // becomes action.payload in fulfilled
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

Handling the three states in `extraReducers`:

```js
extraReducers: (builder) => {
  builder
    .addCase(loginUser.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    })
    .addCase(loginUser.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    })
    .addCase(loginUser.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload; // the rejectWithValue argument
    });
},
```

---

### useSelector and useDispatch

```jsx
import { useSelector, useDispatch } from 'react-redux';

const Component = () => {
  const dispatch = useDispatch();

  const { user } = useSelector(state => state.auth);
  const { items: tasks, status } = useSelector(state => state.tasks);

  // Dispatch a sync action
  const handleLogout = () => dispatch(logout());

  // Dispatch an async thunk and check the result
  const handleSubmit = async () => {
    const result = await dispatch(loginUser({ email, password }));
    if (result.meta.requestStatus === 'fulfilled') navigate('/');
  };
};
```

---

## React Router

### Setup — `src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Dashboard />} />
    <Route path="/tasks" element={<Tasks />} />
  </Routes>
</BrowserRouter>
```

### Protecting Routes — `src/components/ProtectedRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const user = useSelector(state => state.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};
```

### Navigation hooks

```jsx
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const navigate = useNavigate();
navigate('/');
navigate('/login', { replace: true }); // no back button entry

const [searchParams, setSearchParams] = useSearchParams();
const search = searchParams.get('search') || '';

setSearchParams(prev => {
  const next = new URLSearchParams(prev);
  next.set('search', value);
  return next;
}, { replace: true });

<Link to="/tasks">Tasks</Link>
```

---

## Context API

Full pattern used in this project for theming:

**`src/context/ThemeContext.jsx`**
```jsx
import { createContext, useContext, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

**Key rule:** Context re-renders every consumer when its value changes. Keep contexts focused — one context per concern.

---

## Custom Hooks

A custom hook is a function whose name starts with `use` that calls other hooks inside it. It lets you reuse stateful logic across components.

**`src/hooks/useLocalStorage.js`**
```js
import { useState } from 'react';

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    const valueToStore = typeof value === 'function' ? value(storedValue) : value;
    setStoredValue(valueToStore);
    try {
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch { }
  };

  return [storedValue, setValue];
};

export default useLocalStorage;
```

**`src/hooks/useTaskStats.js`**
```js
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useTaskStats = () => {
  const tasks = useSelector(state => state.tasks.items);

  return useMemo(() => ({
    total:      tasks.length,
    completed:  tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    pending:    tasks.filter(t => t.status === 'pending').length,
  }), [tasks]);
};
```

**Rules of Hooks — never break these:**
- Only call hooks at the top level of a component — never inside loops, conditions, or nested functions
- Only call hooks from React function components or other custom hooks

---

## Class Components and Error Boundaries

Error boundaries must be class components. They catch errors thrown during rendering of child components.

**`src/components/ErrorBoundary.jsx`**
```jsx
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  // Runs during render phase — update state to show fallback UI
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error.message };
  }

  // Runs after render — good place to log the error
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.message}</p>
          <button onClick={this.handleReset}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## Controlled Forms

In a controlled form, React state is the single source of truth for each input.

```jsx
const [email, setEmail] = useState('');

<input
  type="email"
  value={email}
  onChange={e => setEmail(e.target.value)}
  required
/>
```

For many fields, use a single object and a generic updater:
```jsx
const [form, setForm] = useState({ title: '', status: 'pending', priority: 'medium' });

const field = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

<input value={form.title} onChange={field('title')} />
<select value={form.status} onChange={field('status')}>...</select>
```

---

## Conditional Rendering

```jsx
// && — only renders when condition is true
{user && <span>Welcome, {user.name}</span>}

// Ternary — one of two things
{isLoading ? <Spinner /> : <Content />}

// Ternary for longer blocks
{status === 'loading'
  ? [1, 2, 3].map(i => <SkeletonCard key={i} />)
  : tasks.map(task => <li key={task.id}>{task.title}</li>)
}

// Early return — before the main JSX
if (status === 'failed') return <div>Error: {error}</div>;
if (!user) return <Navigate to="/login" replace />;
```

---

## Derived State

Derived state is computed from existing state — you do not store it separately.

```jsx
// Wrong — storing something you can derive
const [filteredTasks, setFilteredTasks] = useState([]);
useEffect(() => {
  setFilteredTasks(tasks.filter(t => t.title.includes(search)));
}, [tasks, search]);

// Correct — derive it during render, wrap in useMemo if expensive
const filteredTasks = useMemo(
  () => tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase())),
  [tasks, search]
);
```

---

## Exam Pattern Cheat Sheet

**Fetch data on mount:**
```jsx
useEffect(() => {
  dispatch(fetchTasks(user.id));
}, [dispatch, user.id]);
```

**Handle form submit and check if thunk succeeded:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  const result = await dispatch(loginUser({ email, password }));
  if (result.meta.requestStatus === 'fulfilled') navigate('/');
};
```

**Redirect unauthenticated users:**
```jsx
const user = useSelector(state => state.auth.user);
if (!user) return <Navigate to="/login" replace />;
return children;
```

**Update one item in a Redux array:**
```js
.addCase(updateTask.fulfilled, (state, action) => {
  const index = state.items.findIndex(t => t.id === action.payload.id);
  if (index !== -1) state.items[index] = action.payload;
})
```

**Share state globally without Redux:**
```jsx
const MyContext = createContext();
export const useMyContext = () => useContext(MyContext);

export const MyProvider = ({ children }) => {
  const [value, setValue] = useState('default');
  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  );
};
```

**useMemo vs useEffect:**
- `useMemo` — computes and returns a value during render. No side effects.
- `useEffect` — runs after render. Used for API calls, DOM changes, subscriptions.

**When does a component re-render:**
- Its own state changes (`useState`, `useReducer`)
- Its parent re-renders and passes new props
- A context it consumes changes (`useContext`)
- A Redux selector it uses returns a new value (`useSelector`)

**replace vs push in navigation:**
- `navigate('/login')` — pushes, user can press back
- `navigate('/login', { replace: true })` — replaces, back button skips this page
- Always use `replace` on redirects (protected routes, post-login) so the user cannot navigate back to a page they should not be on

---

## Key Files to Study

| File | Concepts demonstrated |
|---|---|
| `src/redux/authSlice.js` | createSlice, createAsyncThunk, extraReducers, localStorage persistence |
| `src/redux/tasksSlice.js` | Multiple async thunks (GET, POST, PATCH, DELETE), updating array items in state |
| `src/pages/Tasks.jsx` | useState, useEffect, useMemo, useSelector, useDispatch, useSearchParams, useContext, controlled forms, conditional rendering, derived state |
| `src/context/ThemeContext.jsx` | Full Context API pattern with a custom hook wrapper |
| `src/hooks/useLocalStorage.js` | Custom hook, lazy useState initializer |
| `src/components/ErrorBoundary.jsx` | Class component, getDerivedStateFromError, componentDidCatch |
| `src/components/ProtectedRoute.jsx` | useSelector + Navigate for route protection |
| `src/App.jsx` | BrowserRouter, Routes, Route, nested route protection |

