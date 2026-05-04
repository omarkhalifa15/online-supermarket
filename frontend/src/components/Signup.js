import React, { useState } from 'react';
import {
  FiMail,
  FiLock,
  FiUser,
  FiMapPin,
  FiPhone,
  FiCalendar,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import axios from 'axios';

const Signup = ({ onSignup, onSwitchToLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, {
        name: e.target.name.value,
        email: e.target.email.value,
        password: e.target.password.value,
        address: e.target.address.value,
        phone: e.target.phone.value,
        age: parseInt(e.target.age.value)
      });

      onSwitchToLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page centered">

      {/* Header */}
      <div className="login-header">
        <div className="brand-logo">
          <img src="/images/Logo.png" alt="Fresh Mart" className="brand-logo-img" />
          <span>Fresh Mart</span>
        </div>

        <h1>Create Account</h1>
        <p>Join and start shopping smarter</p>
      </div>

      {/* Card */}
      <div className="login-card">

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label className="label">Full Name</label>
            <div className="input-box">
              <FiUser className="field-icon" />
              <input type="text" name="name" placeholder="Your name" required disabled={loading} />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Email Address</label>
            <div className="input-box">
              <FiMail className="field-icon" />
              <input type="email" name="email" placeholder="email@example.com" required disabled={loading} />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <div className="input-box">
              <FiLock className="field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Min. 6 characters"
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

          <div className="form-group">
            <label className="label">Address</label>
            <div className="input-box">
              <FiMapPin className="field-icon" />
              <input type="text" name="address" placeholder="Your full address" required disabled={loading} />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Phone Number</label>
            <div className="input-box">
              <FiPhone className="field-icon" />
              <input type="tel" name="phone" placeholder="Your phone number" required disabled={loading}  inputMode="numeric" pattern="[0-9]*" />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Age</label>
            <div className="input-box">
              <FiCalendar className="field-icon" />
              <input type="number" name="age" placeholder="Your age" min="13" max="120" required disabled={loading} inputMode="numeric" pattern="[0-9]*" />
            </div>
          </div>

          <button type="submit" className="sign-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

        </form>

        <p className="new-user-text">
          Already have an account?{' '}
          <span className="link" onClick={() => !loading && onSwitchToLogin()}>
            Sign In
          </span>
        </p>

      </div>
    </div>
  );
};

export default Signup;