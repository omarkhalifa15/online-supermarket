import React, { useEffect, useState } from 'react';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [userData, setUserData] = useState(null);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }

    const savedAdmin = localStorage.getItem('adminData');
    const savedAdminToken = localStorage.getItem('adminToken');
    if (savedAdmin && savedAdminToken) {
      setAdminData(JSON.parse(savedAdmin));
    }

    const syncAdminRoute = () => {
      if (window.location.hash !== '#admin') return;

      const adminToken = localStorage.getItem('adminToken');
      setCurrentPage(adminToken ? 'adminPanel' : 'adminLogin');
    };

    syncAdminRoute();
    window.addEventListener('hashchange', syncAdminRoute);

    return () => window.removeEventListener('hashchange', syncAdminRoute);
  }, []);

  const handleLogin = (data) => {
    // data = { id, name, email } returned by the backend login route
    setUserData(data);
    localStorage.setItem('userData', JSON.stringify(data));
    setCurrentPage('home');
  };

  const handleSignup = (data) => {
    setUserData(data);
    localStorage.setItem('userData', JSON.stringify(data));
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setUserData(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    setCurrentPage('home');
  };

  const handleAdminLogin = (data) => {
    setAdminData(data);
    setCurrentPage('adminPanel');
    window.location.hash = 'admin';
  };

  const handleAdminLogout = () => {
    setAdminData(null);
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminToken');
    setCurrentPage('adminLogin');
  };

  const goHome = () => {
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setCurrentPage('home');
  };

  // Wrap setUserData so Home can update it and we keep localStorage in sync
  const handleSetUserData = (data) => {
    setUserData(data);
    if (data) {
      localStorage.setItem('userData', JSON.stringify(data));
    } else {
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
    }
  };

  return (
    <div className="App">
      {currentPage === 'login' && (
        <Login
          onLogin={(data) => {
            handleLogin(data);
            setCurrentPage('home');
          }}
          onSwitchToSignup={() => setCurrentPage('signup')}
          onSwitchToAdmin={() => {
            window.location.hash = 'admin';
            setCurrentPage(localStorage.getItem('adminToken') ? 'adminPanel' : 'adminLogin');
          }}
        />
      )}

      {currentPage === 'signup' && (
        <Signup
          onSignup={(data) => {
            handleSignup(data);
            setCurrentPage('home');
          }}
          onSwitchToLogin={() => setCurrentPage('login')}
        />
      )}

      {currentPage === 'home' && (
        <Home
          userData={userData}
          setUserData={handleSetUserData}
          onLogout={handleLogout}
          onSwitchToLogin={() => setCurrentPage('login')}
          onSwitchToSignup={() => setCurrentPage('signup')}
        />
      )}

      {currentPage === 'adminLogin' && (
        <AdminLogin
          onAdminLogin={handleAdminLogin}
          onBackToStore={goHome}
        />
      )}

      {currentPage === 'adminPanel' && (
        <AdminPanel
          adminData={adminData}
          onLogout={handleAdminLogout}
          onBackToStore={goHome}
        />
      )}
    </div>
  );
}

export default App;
