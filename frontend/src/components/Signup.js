import React, { useState } from 'react';
import { FiMail, FiLock, FiUser, FiMapPin, FiPhone, FiCalendar } from 'react-icons/fi';
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
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, { // UPDATED: added /auth
        name: e.target.name.value,
        email: e.target.email.value,
        password: e.target.password.value,
        address: e.target.address.value,
        phone: e.target.phone.value,
        age: parseInt(e.target.age.value)
      });

      onSignup(response.data); 
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="logo">Uni Market</div>
      <div className="subtitle">Create your account</div>
      
      {error && <div style={{color: '#dc3545', marginBottom: '15px'}}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Full Name</label>
          <input type="text" name="name" className="input" placeholder="Your name" required disabled={loading} />
        </div>

        <div className="form-group">
          <label className="label">Email Address</label>
          <input type="email" name="email" className="input" placeholder="email@example.com" required disabled={loading} />
        </div>

        <div className="form-group">
          <label className="label">Password</label>
          <div style={{position: 'relative'}}>
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              className="input" 
              placeholder="Min. 6 characters" 
              required 
              disabled={loading}
            />
            <span 
              style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer'}}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="label">Address</label>
          <input type="text" name="address" className="input" placeholder="Your full address" required disabled={loading} />
        </div>

        <div className="form-group">
          <label className="label">Phone Number</label>
          <input type="tel" name="phone" className="input" placeholder="Your phone number" required disabled={loading} />
        </div>

        <div className="form-group">
          <label className="label">Age</label>
          <input type="number" name="age" className="input" placeholder="Your age" min="13" max="120" required disabled={loading} />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="new-user-text">
        Already have an account? <span className="link" onClick={() => !loading && onSwitchToLogin()}>Sign In</span>
      </p>
    </div>
  );
};

export default Signup;