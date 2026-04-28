import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';

function App() {
  // 'login', 'signup', or 'home'
  const [currentPage, setCurrentPage] = useState('login');
  // Stores user object returned from backend (e.g., { id, name, email })
  const [userData, setUserData] = useState(null);

  const handleLogin = (data) => {
    setUserData(data);
    setCurrentPage('home');
  };

  const handleSignup = (data) => {
    setUserData(data);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setUserData(null);
    setCurrentPage('login');
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
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}

export default App;