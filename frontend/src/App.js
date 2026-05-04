import React, { useEffect, useState } from 'react';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
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
    setCurrentPage('login');
  };

  // Wrap setUserData so Home can update it and we keep localStorage in sync
  const handleSetUserData = (data) => {
    setUserData(data);
    localStorage.setItem('userData', JSON.stringify(data));
  };

  return (
    <div className="App">
      {currentPage === 'login' && (
        <Login
          onLogin={handleLogin}
          onSwitchToSignup={() => setCurrentPage('signup')}
        />
      )}

      {currentPage === 'signup' && (
        <Signup
          onSignup={handleSignup}
          onSwitchToLogin={() => setCurrentPage('login')}
        />
      )}

      {currentPage === 'home' && (
        <Home
          userData={userData}
          setUserData={handleSetUserData}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;