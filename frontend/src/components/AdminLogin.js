import React, { useState } from 'react';
import axios from 'axios';
import { FiEye, FiEyeOff, FiLock, FiShield } from 'react-icons/fi';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function AdminLogin({ onAdminLogin, onBackToStore }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API}/admin/login`, {
        email: e.target.email.value,
        password: e.target.password.value
      });

      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminData', JSON.stringify(res.data.admin));
      onAdminLogin(res.data.admin);
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page centered admin-login-page">
      <div className="login-header">
        <div className="brand-logo">
          <img src="/images/Logo.png" alt="Fresh Mart" className="brand-logo-img" />
          <span>Fresh Mart</span>
        </div>

        <h1>Admin Support</h1>
        <p>Sign in to manage customer tickets</p>
      </div>

      <div className="login-card admin-login-card">
        <div className="admin-lockup">
          <FiShield />
          <span>Staff Access</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Admin Email</label>
            <div className="input-box">
              <FiShield className="field-icon" />
              <input
                type="email"
                name="email"
                placeholder="admin@freshmart.com"
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
                placeholder="Enter admin password"
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
            {loading ? 'Signing In...' : 'Open Admin Panel'}
          </button>
        </form>

        <p className="new-user-text">
          <span className="link" onClick={onBackToStore}>Back to store</span>
        </p>
      </div>
    </div>
  );
}
