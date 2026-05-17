import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiChevronDown, FiHelpCircle, FiMessageCircle, FiSend, FiX } from 'react-icons/fi';

const SUPPORT_WHATSAPP_NUMBER = process.env.REACT_APP_SUPPORT_WHATSAPP || '201000000000';

const issueTypes = [
  'General question',
  'Order issue',
  'Account help',
  'Payment question',
  'Product question',
  'Delivery question',
  'Other'
];

const faqs = [
  {
    question: 'How do I complete checkout?',
    answer: 'Add items to your cart, open the cart, and press Checkout. You need to be signed in before placing an order.'
  },
  {
    question: 'What happens if an item is out of stock?',
    answer: 'The cart will block checkout for unavailable quantities. You can reduce the quantity or remove the item.'
  },
  {
    question: 'Can I reorder a previous order?',
    answer: 'Open Order History and press Re-order. The app will rebuild your cart with the items from that order.'
  },
  {
    question: 'How do I update my profile?',
    answer: 'Open your account from the profile icon, verify your password, and edit your account details.'
  }
];

export default function SupportPanel({ open, onClose, API, userData, orderContext }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    issue_type: 'General question',
    order_id: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!open) return;

    const orderId = orderContext?.order_id || '';
    setForm({
      name: userData?.name || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      issue_type: orderId ? 'Order issue' : 'General question',
      order_id: orderId,
      message: orderId ? `Hi Fresh Mart, I need help with order ${orderId}.` : ''
    });
    setFeedback({ text: '', type: '' });
  }, [open, orderContext, userData]);

  const whatsappHref = useMemo(() => {
    const orderText = form.order_id ? ` with order ${form.order_id}` : '';
    const text = encodeURIComponent(`Hi Fresh Mart, I need support${orderText}.`);
    return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${text}`;
  }, [form.order_id]);

  if (!open) return null;

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ text: '', type: '' });

    try {
      const res = await axios.post(`${API}/support/tickets`, {
        user_id: userData?.id || null,
        order_id: form.order_id || null,
        name: form.name,
        email: form.email,
        phone: form.phone,
        issue_type: form.issue_type,
        message: form.message
      });

      setFeedback({
        text: `Ticket #${res.data.ticket.id} opened. We will contact you soon.`,
        type: 'success'
      });
      setForm((prev) => ({ ...prev, message: '' }));
    } catch (err) {
      setFeedback({
        text: err.response?.data?.message || 'Could not send support request.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="market-overlay" onClick={onClose} />

      <div className="market-panel support-panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">Customer Care</span>
            <h2>How can we help?</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close support">
            <FiX />
          </button>
        </div>

        <div className="panel-body support-body">
          <a className="whatsapp-card" href={whatsappHref} target="_blank" rel="noreferrer">
            <FiMessageCircle />
            <span>
              <strong>Chat on WhatsApp</strong>
              <small>Fast help for urgent delivery or order questions.</small>
            </span>
          </a>

          <section className="faq-section">
            <div className="support-section-title">
              <FiHelpCircle />
              <span>Quick answers</span>
            </div>

            {faqs.map((faq) => (
              <details className="faq-item" key={faq.question}>
                <summary>
                  <span>{faq.question}</span>
                  <FiChevronDown />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </section>

          <form className="support-form" onSubmit={submitTicket}>
            <div className="support-section-title">
              <FiSend />
              <span>Open a support ticket</span>
            </div>

            {feedback.text && (
              <div className={feedback.type === 'success' ? 'panel-success' : 'panel-error'}>
                {feedback.text}
              </div>
            )}

            <div className="support-grid">
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="support-grid">
              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                />
              </label>
              <label>
                Order ID
                <input
                  value={form.order_id}
                  onChange={(e) => updateForm('order_id', e.target.value)}
                  placeholder="Optional"
                />
              </label>
            </div>

            <label>
              Issue type
              <select
                value={form.issue_type}
                onChange={(e) => updateForm('issue_type', e.target.value)}
                required
              >
                {issueTypes.map((type) => (
                  <option value={type} key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              Message
              <textarea
                value={form.message}
                onChange={(e) => updateForm('message', e.target.value)}
                placeholder="Tell us what happened..."
                required
              />
            </label>

            <button className="market-primary-btn" type="submit" disabled={loading}>
              <FiSend />
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
