import React from 'react';
import { FiHelpCircle, FiRefreshCw, FiX } from 'react-icons/fi';

const paymentLabels = {
  cash: 'Cash',
  visa: 'Visa',
  applepay: 'Apple Pay'
};

const parsePaymentDetails = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
};

const getHistoryDiscount = (category) => {
  const discountMap = {
    Fruits: 20,
    Vegetables: 15,
    Dairy: 10,
    Beverages: 12,
    Snacks: 18,
    Bakery: 10,
    Meat: 8
  };

  return discountMap[category] || 10;
};

export default function History({ open, onClose, history, onReorder, onNeedHelp, getCategoryEmoji }) {
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
        shipping_address: item.shipping_address,
        payment_method: item.payment_method,
        payment_details: parsePaymentDetails(item.payment_details),
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

                {(order.shipping_address || order.payment_method) && (
                  <div className="history-order-details">
                    {order.shipping_address && <span>{order.shipping_address}</span>}
                    {order.payment_method && <strong>{paymentLabels[order.payment_method] || order.payment_method}</strong>}
                    {order.payment_details?.card_last4 && (
                      <small>
                        Card ending {order.payment_details.card_last4}
                        {order.payment_details.card_expiry ? ` - Exp ${order.payment_details.card_expiry}` : ''}
                      </small>
                    )}
                    {order.payment_details?.applepay_account && (
                      <small>Apple Pay: {order.payment_details.applepay_account}</small>
                    )}
                    {order.payment_details?.payment_reference && (
                      <small>Payment ref: {order.payment_details.payment_reference}</small>
                    )}
                  </div>
                )}

                {order.items.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-thumb">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.classList.add('image-error');
                          }}
                        />
                      )}
                      <span>{getCategoryEmoji?.(item.category) || '?'}</span>
                    </div>
                    <span>
                      {item.product_name}
                      {Number(item.original_price) > Number(item.price) && (
                        <em>
                          {getHistoryDiscount(item.category)}% off - EGP {Number(item.price).toFixed(2)}
                        </em>
                      )}
                    </span>
                    <small>x {item.quantity}</small>
                  </div>
                ))}

                <div className="history-actions">
                  <button
                    className="reorder-btn"
                    onClick={() => onReorder(order.items)}
                  >
                    <FiRefreshCw />
                    Re-order
                  </button>

                  <button
                    className="history-help-btn"
                    onClick={() => onNeedHelp?.(order)}
                  >
                    <FiHelpCircle />
                    Need Help?
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
