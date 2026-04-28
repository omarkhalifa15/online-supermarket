import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiShoppingCart, FiUser, FiSearch, FiClock } from 'react-icons/fi';

const Home = ({ userData }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/products?search=${search}&category=${category}`);
      setProducts(res.data);
    };
    fetchProducts();
  }, [search, category]);

  const addToCart = (product) => {
    setCart([...cart, product]);
    alert(`${product.name} added to cart!`);
  };

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="left-nav">
          <FiClock className="icon" title="History" />
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search products..." onChange={(e) => setSearch(e.target.value)} />
          <select onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Fruits">Fruits</option>
            <option value="Vegetables">Vegetables</option>
          </select>
        </div>
        <div className="right-nav">
          <FiShoppingCart className="icon" /> <span>({cart.length})</span>
          <FiUser className="icon" />
        </div>
      </nav>

      <div className="product-grid">
        {products.map(p => (
          <div key={p.id} className="product-card">
            <h3>{p.name}</h3>
            <p>${p.price}</p>
            <button className="btn" onClick={() => addToCart(p)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;