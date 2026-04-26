import React, { useState } from 'react';
import { FiMail, FiLock } from 'react-icons/fi';
import axios from 'axios';

const Login = ({ onLogin, onSwitchToSignup }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/login`, {
        email: e.target.email.value,
        password: e.target.password.value
      });

      onLogin(response.data); // Pass user data from API
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="logo">Uni Market</div>
      <div className="subtitle">Welcome back</div>
      
      {error && <div style={{color: '#dc3545', marginBottom: '15px'}}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Email</label>
          <input 
            type="email" 
            name="email" 
            className="input" 
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="label">Password</label>
          <input 
            type="password" 
            name="password" 
            className="input" 
            placeholder="Enter your password"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className="new-user-text">
        New? <span className="link" onClick={onSwitchToSignup}>Register here</span>
      </p>
    </div>
  );
};

export default Login;