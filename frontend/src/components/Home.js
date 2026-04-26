import React from 'react';

const Home = ({ userData }) => {
  const handleLogout = () => {
    window.location.reload();
  };

  return (
    <div className="home-container">
      <div className="logo">Uni Market</div>
      <h2 className="welcome-user">Welcome back!</h2>
      
      <div className="user-details">
        <h3 style={{marginBottom: '15px', color: '#333'}}>Your Profile</h3>
        <div className="user-detail">
          <span>Name:</span>
          <span>{userData?.name || userData?.email}</span>
        </div>
        {userData?.name && (
          <>
            <div className="user-detail">
              <span>Email:</span>
              <span>{userData.email}</span>
            </div>
            <div className="user-detail">
              <span>Address:</span>
              <span>{userData.address}</span>
            </div>
            <div className="user-detail">
              <span>Phone:</span>
              <span>{userData.phone}</span>
            </div>
            <div className="user-detail">
              <span>Age:</span>
              <span>{userData.age}</span>
            </div>
          </>
        )}
      </div>

      <p style={{color: '#666', marginBottom: '20px'}}>
        Home page coming soon - supermarket features will be here!
      </p>
      
      <button className="btn logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Home;