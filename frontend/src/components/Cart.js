import React from 'react';
import axios from 'axios';
import { FiX, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';

export default function Cart({ open, onClose, cart, setCart, userData, API, getCategoryEmoji }) {
  if (!open) return null;

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
      )
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const checkout = async () => {
    if (!userData?.id) return alert('Please login.');

    const token = localStorage.getItem('token');

    try {
      const purchaseItems = cart.map((item) => ({
        product_id: item.id,
        quantity: item.qty
      }));

      await axios.post(
        `${API}/shop/purchase/batch`,
        {
          user_id: userData.id,
          items: purchaseItems
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Order placed successfully!');
      setCart([]);
      onClose();
    } catch (err) {
      alert('Checkout failed.');
    }
  };

  return (
    <>
      <div className="market-overlay" onClick={onClose} />

      <div className="market-panel">
        <div className="panel-header">
          <h2>Your Cart</h2>
          <button className="icon-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="panel-body">
          {cart.length === 0 ? (
            <p className="empty-text">Your cart is empty.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-emoji">{getCategoryEmoji(item.category)}</div>

                <div className="cart-info">
                  <h4>{item.name}</h4>
                  <p>EGP {(item.price * item.qty).toFixed(2)}</p>

                  <div className="qty-row">
                    <button onClick={() => updateQty(item.id, -1)}>
                      <FiMinus />
                    </button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)}>
                      <FiPlus />
                    </button>
                  </div>
                </div>

                <button className="delete-btn" onClick={() => removeFromCart(item.id)}>
                  <FiTrash2 />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="panel-footer">
            <div className="total-row">
              <span>Total</span>
              <strong>EGP {cartTotal.toFixed(2)}</strong>
            </div>

            <button className="market-primary-btn" onClick={checkout}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}