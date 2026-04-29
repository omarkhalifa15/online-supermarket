import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiShoppingCart, FiUser, FiSearch, FiClock, FiX, FiPlus, FiMinus, FiTrash2, FiLogOut, FiEdit2, FiCheck, FiRefreshCw, FiLock } from 'react-icons/fi';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const CATEGORIES = ['All', 'Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Beverages', 'Snacks', 'Meat'];

const getCategoryEmoji = (cat) => {
  const map = { Fruits: '🍎', Vegetables: '🥦', Dairy: '🥛', Bakery: '🥐', Beverages: '🥤', Snacks: '🍿', Meat: '🥩' };
  return map[cat] || '📦';
};

export default function Home({ userData, setUserData, onLogout }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [addedIds, setAddedIds] = useState({});
  const [searchFocused, setSearchFocused] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const searchTimeout = useRef(null);

  const displayName = userData?.name?.trim() || userData?.email?.trim() || 'Guest';
  const avatarLetter = displayName !== 'Guest' ? displayName[0].toUpperCase() : '?';

  const formatDateTime = (dateString) => {
    if (!dateString) return "Recent Order";
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

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
      // Sending email from the current userData state
      await axios.post(`${API}/auth/verify-password`, {
        email: userData.email, 
        password: passwordInput,
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setPasswordPrompt(false);
      setEditForm({ 
        name: userData?.name || '', 
        email: userData?.email || '', 
        phone: userData?.phone || '', 
        address: userData?.address || '' 
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
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/auth/update`, {
        user_id: userData.id,
        ...editForm
      }, { headers: { Authorization: `Bearer ${token}` } });
      const updated = { ...userData, ...res.data.user };
      setUserData(updated);
      localStorage.setItem('userData', JSON.stringify(updated));
      setEditSuccess('Profile updated!');
      setEditMode(false);
    } catch (err) {
      setEditError('Failed to update profile.');
    } finally { setEditLoading(false); }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category && category !== 'All') params.category = category;
      const res = await axios.get(`${API}/shop/products`, { params });
      setProducts(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    if (!userData?.id) return;
    try {
      const res = await axios.get(`${API}/shop/history`, { params: { user_id: userData.id } });
      setHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedIds(prev => ({ ...prev, [product.id]: false })), 1200);
  };

  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const checkout = async () => {
    if (!userData?.id) return alert('Please login.');
    const token = localStorage.getItem('token');
    try {
      const purchaseItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.qty
      }));

      await axios.post(`${API}/shop/purchase/batch`, {
        user_id: userData.id,
        items: purchaseItems,
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('Order placed successfully!');
      setCart([]); 
      setCartOpen(false);
    } catch (err) { 
      alert('Checkout failed.'); 
    }
  };

  const groupedOrders = React.useMemo(() => {
    const map = new Map();
    history.forEach((h, idx) => {
      const key = h.purchased_at || `order-${idx}`;
      if (!map.has(key)) map.set(key, { items: [], total: 0, purchased_at: h.purchased_at });
      const group = map.get(key);
      group.items.push(h);
      group.total += Number(h.price) * Number(h.quantity);
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.purchased_at) - new Date(a.purchased_at));
  }, [history]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --cream: #FAF7F2; --ink: #1A1A1A; --sage: #5C7C5C;
          --gold: #C8992A; --warm: #F5EFE6; --border: #E2D9CE; --red: #D94F3D;
          --shadow: 0 4px 24px rgba(0,0,0,0.08); --shadow-lg: 0 12px 48px rgba(0,0,0,0.14);
          --radius: 16px;
        }
        body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--ink); }

        .navbar { position: sticky; top: 0; z-index: 100; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 24px; padding: 0 48px; height: 76px; background: rgba(250,247,242,0.96); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
        .nav-brand { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: var(--sage); display: flex; align-items: center; gap: 8px; }
        .nav-brand-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); }

        .nav-search { display: flex; gap: 12px; align-items: center; width: 100%; max-width: 680px; margin: 0 auto; }
        .search-wrap { flex: 1; position: relative; }
        .search-wrap svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #999; }
        .search-wrap input { 
          width: 100%; 
          padding: 11px 46px; 
          border: 1.5px solid var(--border); 
          border-radius: 14px; 
          outline: none; 
          font-family: 'DM Sans', sans-serif; 
          transition: 0.25s; 
          color: var(--ink);
          background: #fff;
        }
        .search-wrap input:focus { border-color: var(--sage); box-shadow: 0 0 0 3px rgba(92,124,92,0.12); }

        .nav-actions { display: flex; align-items: center; gap: 4px; }
        .nav-btn { display: flex; align-items: center; gap: 7px; padding: 9px 16px; border: none; background: transparent; cursor: pointer; border-radius: 12px; font-weight: 500; }
        .nav-btn:hover { background: var(--warm); }
        .cart-badge { position: absolute; top: 5px; right: 5px; background: var(--red); color: #fff; font-size: 10px; border-radius: 99px; min-width: 17px; height: 17px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--cream); }
        .nav-divider { width: 1px; height: 28px; background: var(--border); margin: 0 6px; }

        .pill-bar { display: flex; gap: 8px; padding: 18px 48px 0; overflow-x: auto; scrollbar-width: none; }
        .pill { padding: 7px 20px; border-radius: 99px; border: 1.5px solid var(--border); background: #fff; cursor: pointer; white-space: nowrap; transition: 0.18s; }
        .pill.active { background: var(--sage); border-color: var(--sage); color: #fff; }

        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 22px; padding: 24px 48px 60px; }
        .product-card { background: #fff; border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; transition: 0.22s; display: flex; flex-direction: column; }
        .product-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
        .product-img-placeholder { width: 100%; height: 180px; background: var(--warm); display: flex; align-items: center; justify-content: center; font-size: 52px; }
        .product-body { padding: 16px; flex: 1; }
        .product-cat { font-size: 11px; font-weight: 600; color: var(--sage); text-transform: uppercase; }
        .product-name { font-family: 'Playfair Display', serif; display: block; font-size: 16px; margin: 4px 0; }
        .product-price { font-weight: 600; color: var(--gold); }
        .add-btn { width: 100%; padding: 10px; border-radius: 10px; border: 2px solid var(--sage); background: transparent; color: var(--sage); cursor: pointer; font-weight: 600; margin: 16px; width: calc(100% - 32px); }
        .add-btn:hover, .add-btn.added { background: var(--sage); color: #fff; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; }
        .panel { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; background: var(--cream); z-index: 201; display: flex; flex-direction: column; box-shadow: var(--shadow-lg); transition: 0.3s; }
        .panel.left { right: auto; left: 0; }
        .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 24px; border-bottom: 1px solid var(--border); }
        .panel-body { flex: 1; overflow-y: auto; padding: 20px; }

        .cart-item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); }
        .qty-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
        .qty-btn { width: 26px; height: 26px; border: 1.5px solid var(--border); background: #fff; cursor: pointer; border-radius: 6px; }
        
        .history-order { background: #fff; border-radius: 14px; border: 1px solid var(--border); margin-bottom: 14px; overflow: hidden; }
        .repurchase-btn { width: calc(100% - 32px); margin: 12px 16px; padding: 10px; border: 1.5px solid var(--sage); background: transparent; color: var(--sage); border-radius: 10px; cursor: pointer; font-weight: 600; }
        .repurchase-btn:hover { background: var(--sage); color: #fff; }

        .pw-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 32px; border-radius: 20px; z-index: 500; width: 360px; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; gap: 16px; }
        .edit-input { padding: 12px; border: 1.5px solid var(--border); border-radius: 10px; outline: none; }
        .save-btn { background: var(--sage); color: #fff; padding: 12px; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <span className="nav-brand"><span className="nav-brand-dot" />FreshMart</span>
        <div className="nav-search">
          <div className={`search-wrap ${searchFocused ? 'focused' : ''}`}>
            <FiSearch size={16} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>
        <div className="nav-actions">
          <button className="nav-btn" onClick={() => { setHistoryOpen(true); fetchHistory(); }}><FiClock /><span>History</span></button>
          <div className="nav-divider" />
          <button className="nav-btn" onClick={() => setCartOpen(true)} style={{position:'relative'}}>
            <FiShoppingCart /><span>Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <div className="nav-divider" />
          <button className="nav-btn" onClick={() => setProfileOpen(true)}><FiUser /><span>{avatarLetter}</span></button>
        </div>
      </nav>

      {/* CATEGORIES */}
      <div className="pill-bar">
        {CATEGORIES.map(c => (
          <button key={c} className={`pill ${((c === 'All' ? '' : c) === category) ? 'active' : ''}`} onClick={() => setCategory(c === 'All' ? '' : c)}>{c}</button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      <div className="product-grid">
        {products.map(p => (
          <div key={p.id} className="product-card">
            <div className="product-img-placeholder">{getCategoryEmoji(p.category)}</div>
            <div className="product-body">
              <span className="product-cat">{p.category}</span>
              <span className="product-name">{p.name}</span>
              <span className="product-price">${Number(p.price).toFixed(2)}</span>
            </div>
            <button className={`add-btn ${addedIds[p.id] ? 'added' : ''}`} onClick={() => addToCart(p)}>
              {addedIds[p.id] ? <FiCheck /> : <FiPlus />} {addedIds[p.id] ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        ))}
      </div>

      {/* CART PANEL */}
      {cartOpen && (
        <>
          <div className="overlay" onClick={() => setCartOpen(false)} />
          <div className="panel">
            <div className="panel-header">
              <span style={{fontFamily:'Playfair Display', fontSize:22}}>Your Cart</span>
              <button className="nav-btn" onClick={() => setCartOpen(false)}><FiX /></button>
            </div>
            <div className="panel-body">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div style={{fontSize:24}}>{getCategoryEmoji(item.category)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:500}}>{item.name}</div>
                    <div style={{color:'var(--gold)'}}>${(item.price * item.qty).toFixed(2)}</div>
                    <div className="qty-row">
                      <button className="qty-btn" onClick={() => updateQty(item.id, -1)}><FiMinus /></button>
                      <span>{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, 1)}><FiPlus /></button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{border:'none', background:'none', color:'#ccc'}}><FiTrash2 /></button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{padding:20, borderTop:'1px solid var(--border)'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:15}}>
                  <span>Total</span>
                  <span style={{fontSize:20, fontWeight:700}}>${cartTotal.toFixed(2)}</span>
                </div>
                <button className="save-btn" style={{width:'100%'}} onClick={checkout}>Checkout</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* HISTORY PANEL */}
      {historyOpen && (
        <>
          <div className="overlay" onClick={() => setHistoryOpen(false)} />
          <div className="panel left">
            <div className="panel-header">
              <span style={{fontFamily:'Playfair Display', fontSize:22}}>Order History</span>
              <button className="nav-btn" onClick={() => setHistoryOpen(false)}><FiX /></button>
            </div>
            <div className="panel-body">
              {groupedOrders.map((order, i) => (
                <div key={i} className="history-order">
                  <div style={{padding:12, background:'var(--warm)', display:'flex', justifyContent:'space-between', fontSize:12}}>
                    <span style={{fontWeight:600, color: 'var(--sage)'}}>{formatDateTime(order.purchased_at)}</span>
                    <span style={{fontWeight:700, color: 'var(--gold)'}}>${order.total.toFixed(2)}</span>
                  </div>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{padding:'8px 12px', fontSize:14, borderBottom:'1px solid #eee', display: 'flex', justifyContent: 'space-between'}}>
                      <span>{item.product_name}</span>
                      <span style={{color: '#999'}}>x {item.quantity}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* PROFILE PANEL */}
      {profileOpen && (
        <>
          <div className="overlay" onClick={() => setProfileOpen(false)} />
          <div className="panel">
            <div className="panel-header">
              <span>Account</span>
              <button onClick={() => setProfileOpen(false)}><FiX /></button>
            </div>
            <div className="panel-body" style={{textAlign:'center'}}>
              <div style={{width:80, height:80, borderRadius:50, background:'var(--sage)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 10px'}}>
                {avatarLetter}
              </div>
              <h3>{displayName}</h3>
              <p style={{color:'#999', fontSize:13}}>{userData?.email}</p>
              
              <div style={{marginTop:30, display:'flex', flexDirection:'column', gap:10}}>
                {!editMode ? (
                  <>
                    <button className="repurchase-btn" style={{width:'100%', margin:0}} onClick={openPasswordPrompt}>
                      <FiEdit2 /> Edit Profile
                    </button>
                    <button className="repurchase-btn" style={{width:'100%', margin:0, color:'var(--red)', borderColor:'var(--red)'}} onClick={onLogout}>
                      <FiLogOut /> Logout
                    </button>
                  </>
                ) : (
                  <div style={{display:'flex', flexDirection:'column', gap:10, textAlign:'left'}}>
                    <input className="edit-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name" />
                    <input className="edit-input" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="Email" />
                    <input className="edit-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Phone" />
                    <textarea className="edit-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} placeholder="Address" />
                    <button className="save-btn" onClick={saveEdit} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
                    <button className="repurchase-btn" style={{width:'100%', margin:0}} onClick={() => setEditMode(false)}>Cancel</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* PASSWORD PROMPT */}
      {passwordPrompt && (
        <>
          <div className="overlay" style={{zIndex:450}} />
          <div className="pw-modal">
            <div style={{textAlign:'center'}}>
              <FiLock size={30} color="var(--sage)" />
              <h3 style={{marginTop:10}}>Verify Password</h3>
              <p style={{fontSize:12, color:'#999'}}>Enter password to edit profile</p>
            </div>
            <input 
              type="password" 
              className="edit-input" 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)} 
              placeholder="••••••••" 
            />
            {passwordError && <p style={{color:'var(--red)', fontSize:12, textAlign:'center'}}>{passwordError}</p>}
            <button className="save-btn" onClick={verifyPassword} disabled={passwordLoading}>
              {passwordLoading ? 'Verifying...' : 'Verify'}
            </button>
            <button className="repurchase-btn" style={{width:'100%', margin:0}} onClick={() => setPasswordPrompt(false)}>Cancel</button>
          </div>
        </>
      )}
    </>
  );
}