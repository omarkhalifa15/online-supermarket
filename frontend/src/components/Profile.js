import React, { useState } from 'react';
import axios from 'axios';
import { FiX, FiEdit2, FiLogOut, FiLock } from 'react-icons/fi';

export default function Profile({
  open,
  onClose,
  userData,
  setUserData,
  onLogout,
  API,
  avatarLetter,
  displayName
}) {
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  if (!open) return null;

  const openPasswordPrompt = () => {
    setPasswordInput('');
    setPasswordError('');
    setPasswordPrompt(true);
  };

  const verifyPassword = async () => {
    if (!passwordInput.trim()) {
      setPasswordError('Please enter password.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `${API}/auth/verify-password`,
        {
          email: userData.email,
          password: passwordInput
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPasswordPrompt(false);

      setEditForm({
        name: userData?.name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        address: userData?.address || '',
        newPassword: '',
        confirmPassword: ''
      });

      setEditMode(true);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Incorrect password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const saveEdit = async () => {
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    const wantsPasswordChange = editForm.newPassword || editForm.confirmPassword;

    if (wantsPasswordChange) {
      if (editForm.newPassword.length < 6) {
        setEditError('New password must be at least 6 characters.');
        setEditLoading(false);
        return;
      }

      if (editForm.newPassword !== editForm.confirmPassword) {
        setEditError('New password and confirm password do not match.');
        setEditLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        user_id: userData.id,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address
      };

      if (wantsPasswordChange) {
        payload.password = editForm.newPassword;
      }

      const res = await axios.put(
        `${API}/auth/update`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const updated = { ...userData, ...res.data.user };

      setUserData(updated);
      localStorage.setItem('userData', JSON.stringify(updated));

      setEditSuccess(wantsPasswordChange ? 'Profile and password updated!' : 'Profile updated!');
      setEditMode(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
      <div className="market-overlay" onClick={onClose} />

      <div className="market-panel">
        <div className="panel-header">
          <h2>Account</h2>
          <button className="icon-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="panel-body profile-body">
          <div className="profile-avatar">{avatarLetter}</div>

          <h3>{displayName}</h3>
          <p>{userData?.email}</p>

          {editError && <div className="panel-error">{editError}</div>}
          {editSuccess && <div className="panel-success">{editSuccess}</div>}

          {!editMode ? (
            <div className="profile-actions">
              <button className="market-secondary-btn" onClick={openPasswordPrompt}>
                <FiEdit2 />
                Edit Profile
              </button>

              <button className="market-danger-btn" onClick={onLogout}>
                <FiLogOut />
                Logout
              </button>
            </div>
          ) : (
            <div className="edit-form">

  <div className="form-field">
    <label>Full Name</label>
    <input
      value={editForm.name}
      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
    />
  </div>

  <div className="form-field">
    <label>Email Address</label>
    <input
      value={editForm.email}
      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
    />
  </div>

  <div className="form-field">
    <label>Phone Number</label>
    <input
      value={editForm.phone}
      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
    />
  </div>

  <div className="form-field">
    <label>Address</label>
    <textarea
      value={editForm.address}
      onChange={e => setEditForm({ ...editForm, address: e.target.value })}
    />
  </div>

  <div className="profile-password-group">
    <div className="profile-password-heading">
      <FiLock />
      <span>Change Password</span>
    </div>

    <div className="form-field">
      <label>New Password</label>
      <input
        type="password"
        value={editForm.newPassword}
        onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
        placeholder="Leave blank to keep current password"
      />
    </div>

    <div className="form-field">
      <label>Confirm New Password</label>
      <input
        type="password"
        value={editForm.confirmPassword}
        onChange={e => setEditForm({ ...editForm, confirmPassword: e.target.value })}
        placeholder="Repeat new password"
      />
    </div>
  </div>

  <button className="market-primary-btn" onClick={saveEdit} disabled={editLoading}>
    {editLoading ? 'Saving...' : 'Save Changes'}
  </button>

  <button className="market-secondary-btn" onClick={() => setEditMode(false)}>
    Cancel
  </button>

</div>
          )}
        </div>
      </div>

      {passwordPrompt && (
        <>
          <div className="market-overlay top-overlay" />

          <div className="password-modal">
            <FiLock size={34} />

            <h3>Verify Password</h3>
            <p>Enter your password to edit your profile.</p>

            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
            />

            {passwordError && <span className="panel-error">{passwordError}</span>}

            <button className="market-primary-btn" onClick={verifyPassword} disabled={passwordLoading}>
              {passwordLoading ? 'Verifying...' : 'Verify'}
            </button>

            <button className="market-secondary-btn" onClick={() => setPasswordPrompt(false)}>
              Cancel
            </button>
          </div>
        </>
      )}
    </>
  );
}
