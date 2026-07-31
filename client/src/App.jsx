import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import { api, getStoredUser, clearSession } from './api.js';
import Login from './pages/Login.jsx';
import RiskForm from './pages/RiskForm.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SheetView from './pages/SheetView.jsx';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Shell({ children }) {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">Risk Register</div>
        {user && (
          <nav className="nav">
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink>
            <NavLink to="/new" className={({ isActive }) => (isActive ? 'active' : '')}>New Assessment</NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? 'active' : '')}>Sheet View</NavLink>
            <span className="user-chip">{user.name}</span>
            <button className="btn-ghost" onClick={logout}>Log out</button>
          </nav>
        )}
      </header>
      <main className="content">{children}</main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    api.me().catch(() => setUser(null));
  }, []);

  const logout = () => {
    clearSession();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      <Shell>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/new" element={<RequireAuth><RiskForm /></RequireAuth>} />
          <Route path="/edit/:id" element={<RequireAuth><RiskForm /></RequireAuth>} />
          <Route path="/register" element={<RequireAuth><SheetView /></RequireAuth>} />
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Shell>
    </AuthContext.Provider>
  );
}
