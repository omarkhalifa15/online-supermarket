import React from 'react';
import axios from 'axios';

export default function Cart({ open, onClose, cart, setCart, userData, API, getCategoryEmoji, onCheckoutSuccess, cartMessage, setCartMessage }) {
  if (!open) return null;

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const targetQty = i.qty + delta;
        const maxQty = i.stock || Infinity;
        return {
          ...i,
          qty: Math.max(1, Math.min(maxQty, targetQty))
        };
      })
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

      setCart([]);
      setCartMessage?.({ text: 'Order placed successfully', type: 'success' });
      onCheckoutSuccess?.();
    } catch (err) {
      const serverMessage = err.response?.data?.error;
      const message = serverMessage?.toLowerCase().includes('stock')
        ? 'An item appears to be out of stock'
        : 'Checkout failed.';
      setCartMessage?.({ text: message, type: 'error' });
    }
  };

  return (
    <>
      <div className="market-overlay" onClick={onClose} />

      <div className="market-panel">
        <div className="panel-header">
          <h2>Your Cart</h2>
          <button className="icon-btn" onClick={() => {
            setCartMessage?.({ text: '', type: '' });
            onClose();
          }}>
            Close
          </button>
        </div>

        <div className="panel-body">
          {cartMessage?.text && (
            <div className={cartMessage.type === 'success' ? 'panel-success' : 'panel-error'}>
              {cartMessage.text}
            </div>
          )}
          {cart.length === 0 ? (
            <p className="empty-text">Your cart is empty.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-info">
                  <h4>{item.name}</h4>
                  <p>EGP {(item.price * item.qty).toFixed(2)}</p>

                  <div className="qty-row">
                    <button onClick={() => updateQty(item.id, -1)}>-</button>
                    <span>{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      disabled={item.stock !== undefined && item.qty >= item.stock}
                    >+
                    </button>
                  </div>
                </div>

                <button className="delete-btn" onClick={() => removeFromCart(item.id)}>
                  Remove
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