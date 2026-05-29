import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import AdminRoute from './components/AdminRoute';
import AllTasks from './pages/AllTasks';

function App() {
  return (
    <ThemeProvider>
    <ErrorBoundary>
      <BrowserRouter>
        <Navbar />
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AllTasks />
              </AdminRoute>
            } />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;