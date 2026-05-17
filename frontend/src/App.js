import React, { useEffect, useState } from 'react';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }
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
    </div>
  );
}

export default App;
