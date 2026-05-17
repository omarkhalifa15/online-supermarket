import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  FiArrowRight,
  FiCheck,
  FiClock,
  FiGift,
  FiGrid,
  FiHelpCircle,
  FiPlus,
  FiSearch,
  FiShoppingBag,
  FiShoppingCart,
  FiUser
} from 'react-icons/fi';
import Cart from './Cart';
import History from './History';
import Profile from './Profile';
import SupportPanel from './SupportPanel';

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

const heroProducts = [
  { src: '/images/products/strawberry.jpg', label: 'Strawberries' },
  { src: '/images/products/banana.jpg', label: 'Bananas' },
  { src: '/images/products/Carrot.jpg', label: 'Carrots' },
  { src: '/images/products/Red Bull Energy Drink, 250ml.jpeg', label: 'Energy drinks' }
];

const getProductDiscount = (product) => {
  const discountMap = {
    Fruits: 20,
    Vegetables: 15,
    Dairy: 10,
    Beverages: 12,
    Snacks: 18,
    Bakery: 10,
    Meat: 8
  };

  return discountMap[product?.category] || 10;
};

const getDiscountedPrice = (product) => {
  const price = Number(product.price);
  const discount = getProductDiscount(product);
  return price - (price * discount / 100);
};

export default function Home({ userData, setUserData, onLogout, onSwitchToLogin, onSwitchToSignup }) {
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
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportOrderContext, setSupportOrderContext] = useState(null);

  const [history, setHistory] = useState([]);
  const [addedIds, setAddedIds] = useState({});
  const [searchFocused, setSearchFocused] = useState(false);
  const [guestSignInPromptOpen, setGuestSignInPromptOpen] = useState(false);

  const searchTimeout = useRef(null);

  const displayName = userData?.name?.trim() || userData?.email?.trim() || 'Guest';
  const avatarLetter = displayName !== 'Guest' ? displayName[0].toUpperCase() : '?';
  const visibleProductCount = products.length;
  const aisleCount = categories.length || new Set(products.map((p) => p.category)).size;

  useEffect(() => {
    if (userData?.id) return;

    setProfileOpen(false);
    setHistoryOpen(false);
    setHistory([]);
  }, [userData?.id]);

  const handleLogout = () => {
    setProfileOpen(false);
    setHistoryOpen(false);
    setGuestSignInPromptOpen(false);
    setSupportOpen(false);
    setSupportOrderContext(null);
    setHistory([]);
    onLogout();
  };

  const openSupport = (order = null) => {
    setSupportOrderContext(order);
    setHistoryOpen(false);
    setGuestSignInPromptOpen(false);
    setSupportOpen(true);
  };

  const fetchProducts = useCallback(async () => {
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
  }, [category, search]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [category, search, fetchProducts]);

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
    const discountedPrice = getDiscountedPrice(product);
    const discount = getProductDiscount(product);
    const productForCart = {
      ...product,
      original_price: Number(product.price),
      price: discountedPrice,
      discount
    };

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

      return [...prev, { ...productForCart, qty: 1, stock: maxStock }];
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
      const originalPrice = Number(product?.price ?? item.original_price ?? item.price);
      const discount = getProductDiscount({ category: item.category });
      const discountedPrice = product
        ? getDiscountedPrice(product)
        : originalPrice;

      return {
        id: item.product_id,
        name: item.product_name,
        original_price: product ? originalPrice : undefined,
        price: discountedPrice,
        discount: product ? discount : undefined,
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
          <span>Fresh Mart</span>
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
          {userData?.id && (
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
          )}

          <button
            className="market-nav-btn"
            onClick={() => openSupport()}
          >
            <FiHelpCircle />
            <span>Help</span>
          </button>

          <button
            className="market-nav-btn profile-btn"
            onClick={() => {
              if (userData?.id) {
                setProfileOpen(true);
              } else {
                setGuestSignInPromptOpen(true);
              }
            }}
          >
            <FiUser />
          </button>

          <button
            className="market-nav-btn cart-nav-btn"
            onClick={() => setCartOpen(true)}
          >
            <FiShoppingCart />
            <span>Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      <main className="market-page">
        <section className="market-hero">
          <div className="hero-copy">
            <span className="hero-kicker">
              <FiShoppingBag />
              {userData?.id ? `Welcome, ${displayName}` : 'Guest market access'}
            </span>
            <h1>Fresh Mart</h1>
            <p>Colorful daily groceries, crisp essentials, and quick cart building in one lively market board.</p>

            <div className="hero-discounts">
              <button className="discount-card" onClick={() => setCategory('Fruits')}>
                <FiGift />
                <span>
                  <strong>20% OFF</strong>
                  <small>Fresh fruits today</small>
                </span>
                <FiArrowRight />
              </button>
              <button className="discount-card" onClick={() => setCategory('Vegetables')}>
                <FiGift />
                <span>
                  <strong>15% OFF</strong>
                  <small>Vegetable picks</small>
                </span>
                <FiArrowRight />
              </button>
              <button className="discount-card" onClick={() => setCategory('Snacks')}>
                <FiGift />
                <span>
                  <strong>18% OFF</strong>
                  <small>Snack deals</small>
                </span>
                <FiArrowRight />
              </button>
            </div>

            <div className="hero-metrics">
              <div>
                <strong>{visibleProductCount}</strong>
                <span>Products</span>
              </div>
              <div>
                <strong>{aisleCount}</strong>
                <span>Aisles</span>
              </div>
              <div>
                <strong>{cartCount}</strong>
                <span>In Cart</span>
              </div>
            </div>
          </div>

          <div className="hero-showcase" aria-hidden="true">
            <div className="hero-ribbon">
              <FiGrid />
              Market Picks
            </div>
            {heroProducts.map((item, index) => (
              <div className={`hero-product hero-product-${index + 1}`} key={item.src}>
                <img src={item.src} alt="" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="market-content">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Shop by aisle</span>
              <h2>Market Board</h2>
            </div>
            <span className="section-count">{visibleProductCount} items</span>
          </div>

          <div className="pill-bar">
            {['All', ...categories].map((c) => (
              <button
                key={c}
                className={`pill ${((c === 'All' ? '' : c) === category) ? 'active' : ''}`}
                onClick={() => setCategory(c === 'All' ? '' : c)}
              >
                <span className="pill-icon">{c === 'All' ? <FiGrid /> : getCategoryEmoji(c)}</span>
                <span>{c}</span>
              </button>
            ))}
          </div>

          {guestSignInPromptOpen && !userData?.id && (
            <>
              <div className="market-overlay" onClick={() => setGuestSignInPromptOpen(false)} />
              <div className="market-panel compact-panel">
                <div className="panel-header">
                  <h2>Guest Profile</h2>
                  <button className="icon-btn" onClick={() => setGuestSignInPromptOpen(false)}>
                    Close
                  </button>
                </div>
                <div className="panel-body guest-panel-body">
                  <p>Sign in for profile details, checkout, and order history.</p>
                  <button className="market-primary-btn" onClick={() => {
                    onSwitchToLogin();
                    setGuestSignInPromptOpen(false);
                  }}>
                    Sign In
                  </button>
                  <button className="market-secondary-btn" onClick={() => {
                    onSwitchToSignup();
                    setGuestSignInPromptOpen(false);
                  }}>
                    Create Account
                  </button>
                  <button className="market-quiet-btn" onClick={() => setGuestSignInPromptOpen(false)}>
                    Keep Browsing
                  </button>
                </div>
              </div>
            </>
          )}

          {loading ? (
            <div className="loading-text">
              <span />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="empty-text">No items found.</div>
          ) : (
            <div className="product-grid">
              {products.map((p, index) => {
                const cartQty = cart.find((item) => item.id === p.id)?.qty || 0;
                const addDisabled = p.stock <= 0 || cartQty >= p.stock;
                const stockLevel = Math.max(0, Math.min(100, ((p.stock || 0) / 30) * 100));
                const discount = getProductDiscount(p);
                const discountedPrice = getDiscountedPrice(p);

                return (
                  <div
                    key={p.id}
                    className={`product-card ${addedIds[p.id] ? 'is-added' : ''} ${p.stock <= 0 ? 'is-out' : ''}`}
                    style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
                  >
                    <div className="product-media">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.classList.add('image-error');
                        }}
                      />
                      <span className="product-fallback">{getCategoryEmoji(p.category)}</span>
                      <span className="product-ribbon">{p.stock <= 0 ? 'Sold Out' : 'Fresh'}</span>
                      <span className="discount-ribbon">-{discount}%</span>
                    </div>

                    <div className="product-body">
                      <div className="product-meta">
                        <span className="product-cat">{p.category}</span>
                        <span className="product-stock">
                          {p.stock <= 0 ? 'Out of stock' : `${p.stock} left`}
                        </span>
                      </div>
                      <span className="product-name">{p.name}</span>

                      <div className="stock-meter" aria-hidden="true">
                        <span style={{ width: `${stockLevel}%` }} />
                      </div>

                      <div className="product-bottom">
                        <span className="product-price">
                          <small>EGP {Number(p.price).toFixed(2)}</small>
                          EGP {discountedPrice.toFixed(2)}
                        </span>
                        <button
                          className={`add-btn ${addedIds[p.id] ? 'added' : ''}`}
                          onClick={() => addToCart(p)}
                          disabled={addDisabled}
                        >
                          {p.stock <= 0
                            ? 'Sold Out'
                            : cartQty >= p.stock
                              ? 'Max'
                              : addedIds[p.id]
                                ? <><FiCheck /> Added</>
                                : <><FiPlus /> Add</>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
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
        onSwitchToLogin={onSwitchToLogin}
        onSwitchToSignup={onSwitchToSignup}
      />

      <History
  open={historyOpen}
  onClose={() => setHistoryOpen(false)}
  history={history}
  onReorder={reorderItems}
  onNeedHelp={openSupport}
  getCategoryEmoji={getCategoryEmoji}
/>

      <Profile
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        userData={userData}
        setUserData={setUserData}
        onLogout={handleLogout}
        API={API}
        avatarLetter={avatarLetter}
        displayName={displayName}
      />

      <SupportPanel
        open={supportOpen}
        onClose={() => {
          setSupportOpen(false);
          setSupportOrderContext(null);
        }}
        API={API}
        userData={userData}
        orderContext={supportOrderContext}
      />
    </>
  );
}
