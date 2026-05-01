import React from 'react';
import { FiX, FiRefreshCw } from 'react-icons/fi';

export default function History({ open, onClose, history, onReorder }) {
  if (!open) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Recent Order';

    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const grouped = new Map();

  history.forEach((item) => {
    const key = item.order_id || item.purchased_at;

    if (!grouped.has(key)) {
      grouped.set(key, {
        order_id: key,
        purchased_at: item.purchased_at,
        items: [],
        total: 0
      });
    }

    const order = grouped.get(key);
    order.items.push(item);
    order.total += Number(item.price) * Number(item.quantity);
  });

  const orders = Array.from(grouped.values()).sort(
    (a, b) => new Date(b.purchased_at) - new Date(a.purchased_at)
  );

  return (
    <>
      <div className="market-overlay" onClick={onClose} />

      <div className="market-panel left">
        <div className="panel-header">
          <h2>Order History</h2>
          <button className="icon-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="panel-body">
          {orders.length === 0 ? (
            <p className="empty-text">No orders yet.</p>
          ) : (
            orders.map((order) => (
              <div key={order.order_id} className="history-order">
                <div className="history-header">
                  <span>{formatDateTime(order.purchased_at)}</span>
                  <strong>EGP {order.total.toFixed(2)}</strong>
                </div>

                {order.items.map((item) => (
                  <div key={item.id} className="history-item">
                    <span>{item.product_name}</span>
                    <small>x {item.quantity}</small>
                  </div>
                ))}

                <button
                  className="reorder-btn"
                  onClick={() => onReorder(order.items)}
                >
                  <FiRefreshCw />
                  Re-order
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}