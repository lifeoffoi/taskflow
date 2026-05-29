# TaskFlow

TaskFlow is a task management app built with React, Vite, Redux Toolkit, React Router, Context API, custom hooks, Axios, and a `json-server` mock API. It is also a React exam reference project: each feature is tied to a common React pattern you may need to rebuild or explain quickly.

The app lets users register, log in, view a dashboard, manage their own tasks, search and sort tasks through URL query params, switch between light and dark themes, and use an admin-only page to view and assign tasks across users.

## Create This App From Scratch

If you need to recreate the project during practice or an exam, start with Vite:

```bash
npm create vite@latest taskflow -- --template react
cd taskflow
npm install
```

Install the app tools used in this project:

```bash
npm install @reduxjs/toolkit react-redux react-router-dom axios
npm install --save-dev json-server
```

What each tool is for:

| Tool | Why this app uses it |
|---|---|
| `vite` | Runs the React dev server and builds the app. |
| `@reduxjs/toolkit` | Creates Redux slices, async thunks, reducers, and the store. |
| `react-redux` | Connects React components to Redux with `Provider`, `useSelector`, and `useDispatch`. |
| `react-router-dom` | Handles pages, redirects, protected routes, links, navigation, and URL search params. |
| `axios` | Makes API requests to the mock backend. |
| `json-server` | Runs `db.json` as a local REST API. |

Optional: add an API script to `package.json`:

```json
"api": "json-server --watch db.json --port 3001"
```

Then your scripts can look like this:

```json
"scripts": {
  "dev": "vite",
  "start": "vite",
  "api": "json-server --watch db.json --port 3001",
  "build": "vite build",
  "preview": "vite preview"
}
```

## How to Run

Start the mock API:

```bash
npx json-server --watch db.json --port 3001
```

Start the React app in another terminal:

```bash
npm run dev
```

The API runs on `http://localhost:3001`. The Vite app usually runs on `http://localhost:5173`.

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `janicejuniour@gmail.com` | `password123` |
| User | `janicewambuingugi@gmail.com` | `Pass123` |
| User | `spencerngugi@gmail.com` | `Password123` |

## What the App Does

| Feature | What happens | Main files |
|---|---|---|
| Authentication | Users can register, log in, stay logged in through `localStorage`, and log out. | `src/redux/authSlice.js`, `src/pages/Login.jsx`, `src/pages/Register.jsx`, `src/components/Navbar.jsx` |
| Protected pages | Logged-out users are redirected to `/login`. Non-admin users are redirected away from `/admin`. | `src/components/ProtectedRoute.jsx`, `src/components/AdminRoute.jsx`, `src/App.jsx` |
| Dashboard | Logged-in users see task counts for total, completed, in-progress, and pending tasks. | `src/pages/Dashboard.jsx`, `src/hooks/useTaskStats.js`, `src/redux/tasksSlice.js` |
| User task management | Users can create, edit, delete, and update status for their own tasks. | `src/pages/Tasks.jsx`, `src/redux/tasksSlice.js` |
| Search and sort | The tasks page stores search and sort values in the URL query string. | `src/pages/Tasks.jsx` |
| Admin task management | Admins can view all tasks, load all users, and assign a task to a selected user. | `src/pages/AllTasks.jsx`, `src/components/AdminRoute.jsx` |
| Theme switching | The app switches between light and dark mode and saves the choice in `localStorage`. | `src/context/ThemeContext.jsx`, `src/hooks/useLocalStorage.js`, `src/components/Navbar.jsx` |
| Error boundary | Rendering errors inside the app show a fallback UI instead of crashing the whole page. | `src/components/ErrorBoundary.jsx`, `src/App.jsx` |
| Loading UI | Skeleton cards show while tasks are loading. | `src/components/SkeletonCard.jsx`, `src/pages/Tasks.jsx` |

## Core React Concepts Covered

### Components and Props

Components split the UI into reusable pieces. Props pass data into a component.

Used in:

| File | How it is used |
|---|---|
| `src/components/ProtectedRoute.jsx` | Receives `children` and either renders them or redirects. |
| `src/components/AdminRoute.jsx` | Receives `children` and protects admin-only pages. |
| `src/components/SkeletonCard.jsx` | Reusable loading placeholder. |
| `src/components/ErrorBoundary.jsx` | Wraps children and displays fallback UI after render errors. |

Key pattern:

```jsx
const ProtectedRoute = ({ children }) => {
  const user = useSelector(state => state.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};
```

### State with `useState`

`useState` stores local component state: form fields, modals, loading flags, and temporary UI values.

Used in:

| File | State |
|---|---|
| `src/pages/Login.jsx` | `email` and `password`. |
| `src/pages/Register.jsx` | `name`, `email`, `password`, and `role`. |
| `src/pages/Tasks.jsx` | Add-task form fields and `editingTask` modal state. |
| `src/pages/AllTasks.jsx` | Local admin data, form state, loading, error, and submitting state. |
| `src/hooks/useLocalStorage.js` | Stored value synced with `localStorage`. |

Key pattern:

```jsx
const [title, setTitle] = useState('');

<input
  value={title}
  onChange={e => setTitle(e.target.value)}
/>
```

### Controlled Forms

A controlled form means React state is the source of truth for each input.

Used in:

| File | How it is used |
|---|---|
| `src/pages/Login.jsx` | Dispatches `loginUser` on submit. |
| `src/pages/Register.jsx` | Dispatches `registerUser` on submit. |
| `src/pages/Tasks.jsx` | Adds tasks and edits existing tasks. |
| `src/pages/AllTasks.jsx` | Admin assigns a new task to a selected user. |

Generic field updater pattern from `AllTasks.jsx`:

```jsx
const field = (key) => (e) =>
  setForm(f => ({ ...f, [key]: e.target.value }));

<input value={form.title} onChange={field('title')} />
```

### Side Effects with `useEffect`

`useEffect` runs code after render. In this app, it is used for fetching data and syncing theme state to the DOM.

Used in:

| File | Effect |
|---|---|
| `src/pages/Dashboard.jsx` | Fetches the logged-in user's tasks. |
| `src/pages/Tasks.jsx` | Fetches the logged-in user's tasks. |
| `src/pages/AllTasks.jsx` | Fetches all tasks and all users for the admin page. |
| `src/context/ThemeContext.jsx` | Writes the current theme to `document.documentElement`. |

Fetch pattern:

```jsx
useEffect(() => {
  if (user) dispatch(fetchTasks(user.id));
}, [dispatch, user]);
```

DOM sync pattern:

```jsx
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
}, [theme]);
```

### Derived Data and `useMemo`

Derived data is calculated from existing state instead of stored separately. `useMemo` is useful when that calculation filters, sorts, or counts arrays.

Used in:

| File | Derived value |
|---|---|
| `src/pages/Tasks.jsx` | `visibleTasks` is derived from `tasks`, `search`, and `sortBy`. |
| `src/hooks/useTaskStats.js` | Dashboard stats are derived from Redux task items. |

Filter and sort pattern:

```jsx
const visibleTasks = useMemo(() => {
  const filtered = tasks.filter(task =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  return [...filtered].sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}, [tasks, search]);
```

Important rule: `useMemo` is for pure calculations. Do not fetch data, set state, or change the DOM inside `useMemo`.

### Context API

Context shares non-Redux global state. TaskFlow uses it for the light/dark theme.

Used in:

| File | How it is used |
|---|---|
| `src/context/ThemeContext.jsx` | Creates `ThemeContext`, provides `theme` and `toggleTheme`, exports `useTheme`. |
| `src/components/Navbar.jsx` | Reads `theme` and `toggleTheme` for the theme button. |
| `src/pages/Tasks.jsx` | Reads `theme` to style task cards and the edit modal. |
| `src/hooks/useLocalStorage.js` | Stores the theme choice in `localStorage`. |

Key pattern:

```jsx
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

<ThemeContext.Provider value={{ theme, toggleTheme }}>
  {children}
</ThemeContext.Provider>
```

### Custom Hooks

A custom hook is a function whose name starts with `use` and can call other hooks inside it.

Used in:

| Hook | Purpose |
|---|---|
| `src/hooks/useLocalStorage.js` | Reuses state that persists to `localStorage`. |
| `src/hooks/useTaskStats.js` | Reuses task-stat calculations for the dashboard. |
| `src/context/ThemeContext.jsx` | Exports `useTheme` as a custom context hook. |

Lazy initializer pattern from `useLocalStorage.js`:

```js
const [storedValue, setStoredValue] = useState(() => {
  const item = localStorage.getItem(key);
  return item !== null ? JSON.parse(item) : initialValue;
});
```

### Redux Toolkit

Redux stores app-wide auth and task data.

Used in:

| File | How it is used |
|---|---|
| `src/redux/store.js` | Combines `auth` and `tasks` reducers with `configureStore`. |
| `src/redux/authSlice.js` | Handles login, register, logout, auth status, and auth errors. |
| `src/redux/tasksSlice.js` | Handles fetching, adding, deleting, editing, and status updates for tasks. |
| `src/main.jsx` | Wraps the app in Redux `Provider`. |
| `src/pages/Login.jsx` | Dispatches `loginUser` and reads auth status/error. |
| `src/pages/Register.jsx` | Dispatches `registerUser` and reads auth status/error. |
| `src/pages/Dashboard.jsx` | Dispatches `fetchTasks` and reads auth user. |
| `src/pages/Tasks.jsx` | Reads tasks and dispatches task CRUD thunks. |
| `src/components/Navbar.jsx` | Reads auth user and dispatches `logout`. |

Store setup:

```js
export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
  },
});
```

Main auth thunks:

| Thunk | API action |
|---|---|
| `loginUser` | `GET /users?email=...&password=...` |
| `registerUser` | Checks existing email, then `POST /users`. |

Main task thunks:

| Thunk | API action |
|---|---|
| `fetchTasks` | `GET /tasks?userId=:userId` |
| `addTask` | `POST /tasks` |
| `deleteTask` | `DELETE /tasks/:id` |
| `updateTaskStatus` | `PATCH /tasks/:id` with only `status`. |
| `updateTask` | `PATCH /tasks/:id` with edited task fields. |

Async thunk pattern:

```js
export const fetchTasks = createAsyncThunk('tasks/fetch', async (userId) => {
  const res = await axios.get(`http://localhost:3001/tasks?userId=${userId}`);
  return res.data;
});
```

Extra reducers pattern:

```js
builder
  .addCase(fetchTasks.pending, (state) => {
    state.status = 'loading';
  })
  .addCase(fetchTasks.fulfilled, (state, action) => {
    state.status = 'succeeded';
    state.items = action.payload;
  })
  .addCase(fetchTasks.rejected, (state, action) => {
    state.status = 'failed';
    state.error = action.error.message;
  });
```

### `useSelector` and `useDispatch`

React components connect to Redux with `useSelector` and `useDispatch`.

Used in:

| File | How it is used |
|---|---|
| `src/pages/Login.jsx` | Selects auth status/error and dispatches `loginUser`. |
| `src/pages/Register.jsx` | Selects auth status/error and dispatches `registerUser`. |
| `src/pages/Dashboard.jsx` | Selects auth user and dispatches `fetchTasks`. |
| `src/pages/Tasks.jsx` | Selects auth/tasks state and dispatches task actions. |
| `src/components/Navbar.jsx` | Selects auth user and dispatches `logout`. |
| `src/components/ProtectedRoute.jsx` | Selects auth user for redirects. |
| `src/components/AdminRoute.jsx` | Selects auth user and role for admin protection. |

Key pattern:

```jsx
const dispatch = useDispatch();
const { user } = useSelector(state => state.auth);
const { items: tasks, status } = useSelector(state => state.tasks);

dispatch(fetchTasks(user.id));
```

### React Router

React Router controls which page is shown for each URL and handles redirects.

Used in:

| File | How it is used |
|---|---|
| `src/App.jsx` | Defines routes for login, register, dashboard, tasks, and admin page. |
| `src/components/ProtectedRoute.jsx` | Redirects logged-out users to `/login`. |
| `src/components/AdminRoute.jsx` | Redirects non-admin users away from `/admin`. |
| `src/components/Navbar.jsx` | Uses `Link` and `useNavigate`. |
| `src/pages/Login.jsx` | Uses `useNavigate` after successful login. |
| `src/pages/Register.jsx` | Uses `useNavigate` after successful registration and `Link` to login. |
| `src/pages/Tasks.jsx` | Uses `useSearchParams` for search and sort query params, and `Navigate` for admin redirect. |

Protected route pattern:

```jsx
const ProtectedRoute = ({ children }) => {
  const user = useSelector(state => state.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};
```

Route setup pattern:

```jsx
<Route path="/tasks" element={
  <ProtectedRoute>
    <Tasks />
  </ProtectedRoute>
} />
```

URL search params pattern from `Tasks.jsx`:

```jsx
const [searchParams, setSearchParams] = useSearchParams();
const search = searchParams.get('search') || '';

const setSearch = (value) => setSearchParams(prev => {
  const next = new URLSearchParams(prev);
  if (value) next.set('search', value);
  else next.delete('search');
  return next;
}, { replace: true });
```

### Conditional Rendering

Conditional rendering shows different UI based on state.

Used in:

| File | Example |
|---|---|
| `src/components/Navbar.jsx` | Shows different links for logged-in, logged-out, admin, and regular users. |
| `src/components/ProtectedRoute.jsx` | Redirects or renders children. |
| `src/components/AdminRoute.jsx` | Redirects based on role. |
| `src/pages/Login.jsx` | Shows auth errors and loading button text. |
| `src/pages/Register.jsx` | Shows auth errors and loading button text. |
| `src/pages/Tasks.jsx` | Shows skeleton loading cards, empty search results, edit modal, and admin redirect. |
| `src/pages/AllTasks.jsx` | Shows loading, error, or admin task list. |
| `src/components/ErrorBoundary.jsx` | Shows fallback UI after a render error. |

Examples:

```jsx
{error && <div style={{ color: 'red' }}>{error}</div>}

{status === 'loading'
  ? [1, 2, 3].map(i => <SkeletonCard key={i} />)
  : visibleTasks.map(task => <li key={task.id}>{task.title}</li>)
}

{editingTask && <div className="modal">...</div>}
```

### Class Components and Error Boundaries

Error boundaries must be class components. They catch rendering errors in child components and show fallback UI.

Used in:

| File | How it is used |
|---|---|
| `src/components/ErrorBoundary.jsx` | Defines `getDerivedStateFromError`, `componentDidCatch`, and a fallback render. |
| `src/App.jsx` | Wraps the app and routes in `ErrorBoundary`. |

Key methods:

```jsx
static getDerivedStateFromError(error) {
  return { hasError: true, message: error.message };
}

componentDidCatch(error, info) {
  console.error('ErrorBoundary caught:', error, info.componentStack);
}
```

## API and Data Model

The mock database is `db.json`.

Main collections:

| Collection | Purpose |
|---|---|
| `users` | Login/register data plus a `role` field. |
| `tasks` | User-owned tasks with title, description, status, priority, deadline, and `userId`. |

Example task:

```json
{
  "title": "React Exam",
  "description": "Prepare for React Exam",
  "status": "in-progress",
  "priority": "high",
  "deadline": "2026-05-29",
  "userId": "KtAKnSkOnU8"
}
```

## Exam Quick Reference

| Need to remember | Look at |
|---|---|
| Vite app entry point | `src/main.jsx` |
| Redux `Provider` | `src/main.jsx` |
| Redux store setup | `src/redux/store.js` |
| Auth slice with `createAsyncThunk` | `src/redux/authSlice.js` |
| Task CRUD slice | `src/redux/tasksSlice.js` |
| Protected route | `src/components/ProtectedRoute.jsx` |
| Admin-only route | `src/components/AdminRoute.jsx` |
| Route definitions | `src/App.jsx` |
| Login controlled form | `src/pages/Login.jsx` |
| Register controlled form | `src/pages/Register.jsx` |
| Task CRUD, search, sort, modal | `src/pages/Tasks.jsx` |
| Admin Promise.all fetch | `src/pages/AllTasks.jsx` |
| Theme context | `src/context/ThemeContext.jsx` |
| Custom localStorage hook | `src/hooks/useLocalStorage.js` |
| Custom stats hook with `useMemo` | `src/hooks/useTaskStats.js` |
| Error boundary class component | `src/components/ErrorBoundary.jsx` |

## Useful Commands

```bash
npm run dev
npx json-server --watch db.json --port 3001
npm run build
npm run preview
```

## Study Notes

- Use Redux for auth and tasks because many pages need the same user/task data.
- Use Context for theme because it is a focused global UI preference.
- Use `useState` for local forms, modal state, loading flags, and temporary inputs.
- Use `useEffect` for API fetching and DOM synchronization.
- Use `useMemo` for derived data such as filtered/sorted tasks and task stats.
- Use `useSearchParams` when UI state should be reflected in the URL.
- Use `Navigate` with `replace` for redirects so users do not go back to pages they should not access.
- Use an error boundary when you need a fallback UI for rendering errors.
- Keep derived data derived. For example, dashboard stats come from the task list and do not need their own Redux state.
