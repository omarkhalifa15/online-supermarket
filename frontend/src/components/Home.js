import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FiShoppingCart, FiUser, FiSearch, FiClock, FiPlus, FiCheck } from 'react-icons/fi';
import Cart from './Cart';
import History from './History';
import Profile from './Profile';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getCategoryEmoji = (cat) => {
  const map = {
    Fruits: '🍎',
    Vegetables: '🥦',
    Dairy: '🥛',
    Bakery: '🥐',
    Beverages: '🥤',
    Snacks: '🍿',
    Meat: '🥩'
  };
  return map[cat] || '📦';
};

export default function Home({ userData, setUserData, onLogout }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartMessage, setCartMessage] = useState({ text: '', type: '' });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cartOpen, setCartOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [history, setHistory] = useState([]);
  const [addedIds, setAddedIds] = useState({});
  const [searchFocused, setSearchFocused] = useState(false);

  const searchTimeout = useRef(null);

  const displayName = userData?.name?.trim() || userData?.email?.trim() || 'Guest';
  const avatarLetter = displayName !== 'Guest' ? displayName[0].toUpperCase() : '?';

  useEffect(() => {
    clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [category, search]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/shop/categories`);
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;

      const res = await axios.get(`${API}/shop/products`, { params });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!userData?.id) return;

    try {
      const res = await axios.get(`${API}/shop/history`, {
        params: { user_id: userData.id }
      });

      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const currentQty = existing?.qty || 0;
      const maxStock = product.stock || 0;

      if (maxStock <= 0) return prev;
      if (existing) {
        if (currentQty >= maxStock) return prev;
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [...prev, { ...product, qty: 1, stock: maxStock }];
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setCartMessage({ text: '', type: '' });

    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };
  const reorderItems = (items) => {
    const cartItems = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        id: item.product_id,
        name: item.product_name,
        price: Number(item.price),
        category: item.category,
        image_url: item.image_url,
        qty: item.quantity,
        stock: product?.stock ?? 0
      };
    });

    const hasOutOfStockItem = cartItems.some((item) => item.stock <= 0);

    setCart(cartItems);
    setHistoryOpen(false);
    setCartOpen(true);
    setCartMessage(hasOutOfStockItem
      ? { text: 'An item appears to be out of stock', type: 'error' }
      : { text: '', type: '' }
    );
  };

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <>
      <nav className="market-navbar">
        <span className="market-brand">
          <img src="/images/Logo.png" alt="Fresh Mart" className="brand-logo-img" />
          Fresh Mart
        </span>

        <div className="market-search">
          <div className={`search-box ${searchFocused ? 'focused' : ''}`}>
            <FiSearch size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        <div className="market-actions">
          <button
            className="market-nav-btn"
            onClick={() => {
              setHistoryOpen(true);
              fetchHistory();
            }}
          >
            <FiClock />
            <span>History</span>
          </button>

          <button
            className="market-nav-btn cart-nav-btn"
            onClick={() => setCartOpen(true)}
          >
            <FiShoppingCart />
            <span>Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          <button className="market-nav-btn profile-btn" onClick={() => setProfileOpen(true)}>
            <FiUser />
          </button>
        </div>
      </nav>

      <main className="market-page">
        <section className="market-hero">
          <h1>Fresh groceries, smarter shopping</h1>
          <p>Browse products, add to cart, and manage your orders easily.</p>
        </section>

        <div className="pill-bar">
          {['All', ...categories].map((c) => (
            <button
              key={c}
              className={`pill ${((c === 'All' ? '' : c) === category) ? 'active' : ''}`}
              onClick={() => setCategory(c === 'All' ? '' : c)}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-text">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-text">No items found.</div>
        ) : (
          <div className="product-grid">
            {products.map((p) => {
              const cartQty = cart.find((item) => item.id === p.id)?.qty || 0;
              const addDisabled = p.stock <= 0 || cartQty >= p.stock;
              return (
                <div key={p.id} className="product-card">
                  <div className="product-img-box">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.classList.add('image-error');
                      }}
                    />
                    <span>{getCategoryEmoji(p.category)}</span>
                  </div>

                  <div className="product-body">
                    <span className="product-cat">{p.category}</span>
                    <span className="product-name">{p.name}</span>
                    <span className="product-price">EGP {Number(p.price).toFixed(2)}</span>
                    <div className="product-stock">
                      {p.stock <= 0 ? 'Out of stock' : `In stock: ${p.stock}`}
                    </div>
                  </div>

                  <button
                    className={`add-btn ${addedIds[p.id] ? 'added' : ''}`}
                    onClick={() => addToCart(p)}
                    disabled={addDisabled}
                  >
                    {p.stock <= 0
                      ? 'Out of stock'
                      : cartQty >= p.stock
                        ? 'Max added'
                        : addedIds[p.id]
                          ? <><FiCheck /> Added!</>
                          : <><FiPlus /> Add to Cart</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Cart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        setCart={setCart}
        userData={userData}
        API={API}
        getCategoryEmoji={getCategoryEmoji}
        onCheckoutSuccess={fetchProducts}
        cartMessage={cartMessage}
        setCartMessage={setCartMessage}
      />

      <History
  open={historyOpen}
  onClose={() => setHistoryOpen(false)}
  history={history}
  onReorder={reorderItems}
/>

      <Profile
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        userData={userData}
        setUserData={setUserData}
        onLogout={onLogout}
        API={API}
        avatarLetter={avatarLetter}
        displayName={displayName}
      />
    </>
  );
}