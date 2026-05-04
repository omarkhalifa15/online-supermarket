import React, { useState } from 'react';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import axios from 'axios';

const Login = ({ onLogin, onSwitchToSignup }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        {
          email: e.target.email.value,
          password: e.target.password.value,
        }
      );

      localStorage.setItem('token', response.data.token);
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="login-page centered">

    <div className="login-header">
      <div className="brand-logo">
        <img src="/images/Logo.png" alt="Fresh Mart" className="brand-logo-img" />
        <span>Fresh Mart</span>
      </div>

      <h1>Welcome Back</h1>
      <p>Sign in to continue shopping</p>
    </div>

    <div className="login-card">
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Email Address</label>
          <div className="input-box">
            <FiMail className="field-icon" />
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Password</label>
          <div className="input-box">
            <FiLock className="field-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
            <button
              type="button"
              className="show-password-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <button type="submit" className="sign-btn" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className="new-user-text">
        New here?{' '}
        <span className="link" onClick={onSwitchToSignup}>
          Create account
        </span>
      </p>
    </div>
  </div>
);
};

export default Login;