import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiShoppingCart, FiUser, FiSearch, FiClock, FiX, FiPlus, FiMinus, FiTrash2, FiLogOut, FiPackage, FiEdit2, FiCheck } from 'react-icons/fi';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CATEGORIES = ['All', 'Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Beverages', 'Snacks', 'Meat'];

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

  // Profile editing
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const searchTimeout = useRef(null);

  const displayName = userData?.name?.trim() || userData?.email?.trim() || 'Guest';
  const displayEmail = userData?.email?.trim() || '';
  const displayPhone = userData?.phone?.trim() || '';
  const displayAddress = userData?.address?.trim() || '';
  const avatarLetter = displayName !== 'Guest' ? displayName[0].toUpperCase() : '?';

  const openEdit = () => {
    setEditForm({ name: userData?.name || '', email: userData?.email || '', phone: userData?.phone || '', address: userData?.address || '' });
    setEditError(''); setEditSuccess(''); setEditMode(true);
  };
  const cancelEdit = () => { setEditMode(false); setEditError(''); setEditSuccess(''); };

  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) { setEditError('Name and email are required.'); return; }
    setEditLoading(true); setEditError(''); setEditSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/auth/update`, {
        user_id: userData.id,
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      const updated = { ...userData, ...res.data.user };
      setUserData(updated);
      localStorage.setItem('userData', JSON.stringify(updated));
      setEditSuccess('Profile updated!');
      setEditMode(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile.');
    } finally { setEditLoading(false); }
  };

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(fetchProducts, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search, category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category && category !== 'All') params.category = category;
      const res = await axios.get(`${API}/shop/products`, { params });
      setProducts(res.data);
    } catch (err) { console.error('Failed to fetch products', err); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    if (!userData?.id) return;
    try {
      const res = await axios.get(`${API}/shop/history`, { params: { user_id: userData.id } });
      setHistory(res.data);
    } catch (err) { console.error('Failed to fetch history', err); }
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
    if (!userData?.id) { alert('You must be logged in to checkout.'); return; }
    const token = localStorage.getItem('token');
    try {
      for (const item of cart) {
        await axios.post(`${API}/shop/purchase`, {
          user_id: userData.id,       // ← THE FIX
          product_id: item.id,
          quantity: item.qty,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      alert('Order placed successfully! 🎉');
      setCart([]); setCartOpen(false);
    } catch (err) {
      console.error('Checkout error:', err.response?.data || err.message);
      alert('Checkout failed. Please try again.');
    }
  };

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
        .navbar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; gap: 16px; padding: 0 32px; height: 72px; background: rgba(250,247,242,0.92); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); }
        .nav-brand { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: var(--sage); white-space: nowrap; }
        .nav-search { flex: 1; display: flex; gap: 10px; max-width: 600px; }
        .search-wrap { flex: 1; position: relative; }
        .search-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #999; pointer-events: none; }
        .search-wrap input { width: 100%; padding: 10px 14px 10px 42px; border: 1.5px solid var(--border); border-radius: 12px; background: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color .2s; }
        .search-wrap input:focus { border-color: var(--sage); }
        .cat-select { padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 12px; background: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; cursor: pointer; min-width: 130px; color: var(--ink); }
        .nav-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }
        .nav-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 10px; background: transparent; cursor: pointer; font-size: 14px; font-family: 'DM Sans', sans-serif; color: var(--ink); transition: background .2s; position: relative; }
        .nav-btn:hover { background: var(--warm); }
        .cart-badge { position: absolute; top: 4px; right: 4px; background: var(--red); color: #fff; font-size: 10px; font-weight: 600; border-radius: 99px; min-width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }
        .pill-bar { display: flex; gap: 8px; padding: 18px 32px 0; overflow-x: auto; scrollbar-width: none; }
        .pill-bar::-webkit-scrollbar { display: none; }
        .pill { padding: 7px 18px; border-radius: 99px; border: 1.5px solid var(--border); background: #fff; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all .18s; font-family: 'DM Sans', sans-serif; }
        .pill:hover { border-color: var(--sage); color: var(--sage); }
        .pill.active { background: var(--sage); border-color: var(--sage); color: #fff; }
        .section-header { padding: 22px 32px 12px; display: flex; align-items: baseline; gap: 12px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: var(--ink); }
        .section-count { font-size: 13px; color: #999; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; padding: 0 32px 48px; }
        .product-card { background: #fff; border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; transition: transform .2s, box-shadow .2s; display: flex; flex-direction: column; }
        .product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .product-img { width: 100%; height: 180px; object-fit: cover; background: var(--warm); }
        .product-img-placeholder { width: 100%; height: 180px; background: var(--warm); display: flex; align-items: center; justify-content: center; font-size: 52px; }
        .product-body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .product-cat { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--sage); }
        .product-name { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 500; color: var(--ink); margin-top: 2px; }
        .product-price { font-size: 18px; font-weight: 600; color: var(--gold); margin-top: 6px; }
        .product-footer { padding: 0 16px 16px; }
        .add-btn { width: 100%; padding: 10px; border-radius: 10px; border: 2px solid var(--sage); background: transparent; color: var(--sage); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .18s; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .add-btn:hover, .add-btn.added { background: var(--sage); color: #fff; }
        .skeleton { background: linear-gradient(90deg, var(--warm) 25%, #ede8e0 50%, var(--warm) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
        @keyframes shimmer { to { background-position: -200% 0; } }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 200; animation: fadeIn .2s; }
        @keyframes fadeIn { from { opacity: 0; } }
        .panel { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; background: var(--cream); z-index: 201; display: flex; flex-direction: column; box-shadow: var(--shadow-lg); animation: slideIn .25s ease; }
        .panel.left { right: auto; left: 0; animation: slideInLeft .25s ease; }
        @keyframes slideIn { from { transform: translateX(100%); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } }
        .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 24px; border-bottom: 1px solid var(--border); }
        .panel-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; }
        .close-btn { width: 32px; height: 32px; border-radius: 99px; border: none; background: var(--warm); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ink); }
        .close-btn:hover { background: var(--border); }
        .panel-body { flex: 1; overflow-y: auto; padding: 20px; }
        .cart-item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); }
        .cart-item-img { width: 60px; height: 60px; border-radius: 10px; background: var(--warm); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
        .cart-item-info { flex: 1; }
        .cart-item-name { font-weight: 500; font-size: 14px; }
        .cart-item-price { font-size: 13px; color: var(--gold); font-weight: 600; margin-top: 2px; }
        .cart-qty-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
        .qty-btn { width: 26px; height: 26px; border-radius: 6px; border: 1.5px solid var(--border); background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; }
        .qty-btn:hover { border-color: var(--sage); color: var(--sage); }
        .qty-num { font-size: 14px; font-weight: 600; min-width: 20px; text-align: center; }
        .cart-remove { background: none; border: none; cursor: pointer; color: #ccc; transition: color .15s; display: flex; align-items: center; }
        .cart-remove:hover { color: var(--red); }
        .cart-footer { padding: 20px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px; }
        .cart-total { display: flex; justify-content: space-between; align-items: center; }
        .cart-total-label { font-size: 15px; font-weight: 500; }
        .cart-total-val { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--gold); }
        .checkout-btn { width: 100%; padding: 14px; border-radius: 12px; border: none; background: var(--sage); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; transition: background .18s; }
        .checkout-btn:hover { background: #4a6a4a; }
        .history-item { padding: 14px 0; border-bottom: 1px solid var(--border); }
        .history-name { font-weight: 500; font-size: 14px; }
        .history-meta { font-size: 12px; color: #999; margin-top: 3px; }
        .profile-avatar { width: 72px; height: 72px; border-radius: 99px; background: var(--sage); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 28px; margin: 0 auto 16px; }
        .profile-name { font-family: 'Playfair Display', serif; font-size: 20px; text-align: center; margin-bottom: 4px; }
        .profile-email { font-size: 13px; color: #999; text-align: center; }
        .profile-detail { font-size: 13px; color: #777; text-align: center; margin-top: 4px; }
        .profile-divider { height: 1px; background: var(--border); margin: 20px 0; }
        .edit-btn { width: 100%; padding: 11px; border-radius: 12px; border: 1.5px solid var(--sage); background: transparent; color: var(--sage); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all .18s; margin-bottom: 10px; }
        .edit-btn:hover { background: var(--sage); color: #fff; }
        .logout-btn { width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid var(--red); background: transparent; color: var(--red); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all .18s; }
        .logout-btn:hover { background: var(--red); color: #fff; }
        .edit-form { display: flex; flex-direction: column; gap: 12px; }
        .edit-field { display: flex; flex-direction: column; gap: 5px; }
        .edit-label { font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.8px; }
        .edit-input { padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color .2s; background: #fff; }
        .edit-input:focus { border-color: var(--sage); }
        .edit-actions { display: flex; gap: 10px; margin-top: 4px; }
        .save-btn { flex: 1; padding: 11px; border-radius: 12px; border: none; background: var(--sage); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .save-btn:hover { background: #4a6a4a; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cancel-btn { flex: 1; padding: 11px; border-radius: 12px; border: 1.5px solid var(--border); background: transparent; color: var(--ink); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; }
        .cancel-btn:hover { background: var(--warm); }
        .edit-error { font-size: 13px; color: var(--red); text-align: center; }
        .edit-success { font-size: 13px; color: var(--sage); text-align: center; margin-top: 8px; }
        .empty-state { text-align: center; padding: 48px 20px; color: #bbb; }
        .empty-state svg { font-size: 40px; margin: 0 auto 12px; display: block; }
        .empty-state p { font-size: 14px; }
        @media (max-width: 640px) {
          .navbar { padding: 0 16px; } .nav-brand { display: none; }
          .product-grid { padding: 0 16px 48px; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
          .panel { width: 100%; } .pill-bar { padding: 16px 16px 0; } .section-header { padding: 16px 16px 10px; }
        }
      `}</style>

      <nav className="navbar">
        <span className="nav-brand">🌿 FreshMart</span>
        <div className="nav-search">
          <div className="search-wrap">
            <FiSearch size={16} />
            <input type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="cat-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="nav-actions">
          <button className="nav-btn" onClick={() => { setHistoryOpen(true); fetchHistory(); }}><FiClock size={18} /></button>
          <button className="nav-btn" onClick={() => setCartOpen(true)}>
            <FiShoppingCart size={18} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <button className="nav-btn" onClick={() => { setProfileOpen(true); setEditMode(false); setEditSuccess(''); }}><FiUser size={18} /></button>
        </div>
      </nav>

      <div className="pill-bar">
        {CATEGORIES.map(c => (
          <button key={c} className={`pill${(c === 'All' ? '' : c) === category ? ' active' : ''}`} onClick={() => setCategory(c === 'All' ? '' : c)}>{c}</button>
        ))}
      </div>

      <div className="section-header">
        <span className="section-title">{category || 'All Products'}</span>
        {!loading && <span className="section-count">{products.length} items</span>}
      </div>

      <div className="product-grid">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="product-card">
                <div className="skeleton" style={{ height: 180 }} />
                <div className="product-body" style={{ gap: 8 }}>
                  <div className="skeleton" style={{ height: 12, width: '40%' }} />
                  <div className="skeleton" style={{ height: 16, width: '80%' }} />
                  <div className="skeleton" style={{ height: 22, width: '35%', marginTop: 4 }} />
                </div>
                <div className="product-footer"><div className="skeleton" style={{ height: 38, borderRadius: 10 }} /></div>
              </div>
            ))
          : products.length === 0
          ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#bbb' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p>No products found{search ? ` for "${search}"` : ''}</p>
            </div>
          : products.map(p => (
              <div key={p.id} className="product-card">
                {p.image_url ? <img className="product-img" src={p.image_url} alt={p.name} /> : <div className="product-img-placeholder">{getCategoryEmoji(p.category)}</div>}
                <div className="product-body">
                  <span className="product-cat">{p.category}</span>
                  <span className="product-name">{p.name}</span>
                  <span className="product-price">${Number(p.price).toFixed(2)}</span>
                </div>
                <div className="product-footer">
                  <button className={`add-btn${addedIds[p.id] ? ' added' : ''}`} onClick={() => addToCart(p)}>
                    <FiPlus size={15} />{addedIds[p.id] ? 'Added!' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))
        }
      </div>

      {/* CART */}
      {cartOpen && (
        <>
          <div className="overlay" onClick={() => setCartOpen(false)} />
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Your Cart</span>
              <button className="close-btn" onClick={() => setCartOpen(false)}><FiX /></button>
            </div>
            <div className="panel-body">
              {cart.length === 0
                ? <div className="empty-state"><FiShoppingCart /><p>Your cart is empty</p></div>
                : cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-img">{getCategoryEmoji(item.category)}</div>
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-price">${(item.price * item.qty).toFixed(2)}</div>
                        <div className="cart-qty-row">
                          <button className="qty-btn" onClick={() => updateQty(item.id, -1)}><FiMinus size={12} /></button>
                          <span className="qty-num">{item.qty}</span>
                          <button className="qty-btn" onClick={() => updateQty(item.id, 1)}><FiPlus size={12} /></button>
                        </div>
                      </div>
                      <button className="cart-remove" onClick={() => removeFromCart(item.id)}><FiTrash2 size={15} /></button>
                    </div>
                  ))
              }
            </div>
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span className="cart-total-label">Total</span>
                  <span className="cart-total-val">${cartTotal.toFixed(2)}</span>
                </div>
                <button className="checkout-btn" onClick={checkout}>Checkout →</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* HISTORY */}
      {historyOpen && (
        <>
          <div className="overlay" onClick={() => setHistoryOpen(false)} />
          <div className="panel left">
            <div className="panel-header">
              <span className="panel-title">Order History</span>
              <button className="close-btn" onClick={() => setHistoryOpen(false)}><FiX /></button>
            </div>
            <div className="panel-body">
              {history.length === 0
                ? <div className="empty-state"><FiPackage /><p>No past orders yet</p></div>
                : history.map((h, i) => (
                    <div key={i} className="history-item">
                      <div className="history-name">{h.product_name}</div>
                      <div className="history-meta">
                        Qty: {h.quantity} · ${Number(h.price).toFixed(2)} each
                        {h.purchased_at && <> · {new Date(h.purchased_at).toLocaleDateString()}</>}
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </>
      )}

      {/* PROFILE */}
      {profileOpen && (
        <>
          <div className="overlay" onClick={() => { setProfileOpen(false); cancelEdit(); }} />
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Profile</span>
              <button className="close-btn" onClick={() => { setProfileOpen(false); cancelEdit(); }}><FiX /></button>
            </div>
            <div className="panel-body">
              {!editMode ? (
                <>
                  <div className="profile-avatar">{avatarLetter}</div>
                  <div className="profile-name">{displayName}</div>
                  <div className="profile-email">{displayEmail}</div>
                  {displayPhone && <div className="profile-detail">📞 {displayPhone}</div>}
                  {displayAddress && <div className="profile-detail">📍 {displayAddress}</div>}
                  {editSuccess && <p className="edit-success">{editSuccess}</p>}
                  <div className="profile-divider" />
                  <button className="edit-btn" onClick={openEdit}><FiEdit2 size={15} /> Edit Profile</button>
                  <button className="logout-btn" onClick={onLogout}><FiLogOut size={15} /> Sign Out</button>
                </>
              ) : (
                <>
                  <div className="profile-avatar">{avatarLetter}</div>
                  <div style={{ marginTop: 16 }} className="edit-form">
                    <div className="edit-field">
                      <label className="edit-label">Full Name</label>
                      <input className="edit-input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
                    </div>
                    <div className="edit-field">
                      <label className="edit-label">Email</label>
                      <input className="edit-input" type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
                    </div>
                    <div className="edit-field">
                      <label className="edit-label">Phone</label>
                      <input className="edit-input" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+20 xxx xxx xxxx" />
                    </div>
                    <div className="edit-field">
                      <label className="edit-label">Address</label>
                      <input className="edit-input" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} placeholder="Your delivery address" />
                    </div>
                    {editError && <p className="edit-error">{editError}</p>}
                    <div className="edit-actions">
                      <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                      <button className="save-btn" onClick={saveEdit} disabled={editLoading}>
                        <FiCheck size={14} /> {editLoading ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function getCategoryEmoji(cat) {
  const map = { Fruits: '🍎', Vegetables: '🥦', Dairy: '🥛', Bakery: '🥐', Beverages: '🧃', Snacks: '🍿', Meat: '🥩' };
  return map[cat] || '📦';
}