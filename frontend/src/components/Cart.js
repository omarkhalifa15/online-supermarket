import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FiCreditCard,
  FiDollarSign,
  FiMapPin,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiSmartphone,
  FiTrash2,
  FiX
} from 'react-icons/fi';

const paymentMethods = [
  { id: 'cash', label: 'Cash', detail: 'Pay when the order arrives' },
  { id: 'visa', label: 'Visa', detail: 'Card payment at checkout' },
  { id: 'applepay', label: 'Apple Pay', detail: 'Quick digital wallet payment' }
];

export default function Cart({
  open,
  onClose,
  cart,
  setCart,
  userData,
  API,
  getCategoryEmoji,
  onCheckoutSuccess,
  cartMessage,
  setCartMessage,
  onSwitchToLogin,
  onSwitchToSignup
}) {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [visaDetails, setVisaDetails] = useState({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [applePayDetails, setApplePayDetails] = useState({
    account: ''
  });

  const addressStorageKey = userData?.id ? `freshmart-addresses-${userData.id}` : '';

  useEffect(() => {
    if (!open || !userData?.id) return;

    let savedAddresses = [];
    try {
      savedAddresses = JSON.parse(localStorage.getItem(addressStorageKey) || '[]');
    } catch (err) {
      savedAddresses = [];
    }

    const profileAddress = userData?.address?.trim();
    const uniqueAddresses = Array.from(new Set([
      ...(profileAddress ? [profileAddress] : []),
      ...savedAddresses.filter(Boolean)
    ]));

    setAddresses(uniqueAddresses);
    setSelectedAddress((current) =>
      uniqueAddresses.includes(current) ? current : uniqueAddresses[0] || ''
    );
  }, [addressStorageKey, open, userData]);

  const selectedPayment = useMemo(
    () => paymentMethods.find((method) => method.id === paymentMethod),
    [paymentMethod]
  );

  if (!open) return null;

  const goToAuthPage = (handler) => {
    setCartMessage?.({ text: '', type: '' });
    onClose?.();
    handler?.();
  };

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

  const saveAddress = () => {
    const cleanAddress = newAddress.trim();
    if (!cleanAddress) {
      setCartMessage?.({ text: 'Please write an address before saving.', type: 'error' });
      return;
    }

    const nextAddresses = Array.from(new Set([...addresses, cleanAddress]));
    setAddresses(nextAddresses);
    setSelectedAddress(cleanAddress);
    setNewAddress('');
    setShowAddressForm(false);
    setCartMessage?.({ text: '', type: '' });

    if (addressStorageKey) {
      localStorage.setItem(addressStorageKey, JSON.stringify(nextAddresses));
    }
  };

  const updateVisaDetails = (field, value) => {
    setVisaDetails((prev) => ({ ...prev, [field]: value }));
  };

  const buildPaymentDetails = () => {
    if (paymentMethod === 'cash') return null;

    if (paymentMethod === 'visa') {
      const cleanCardNumber = visaDetails.cardNumber.replace(/\D/g, '');
      const cleanCvv = visaDetails.cvv.replace(/\D/g, '');
      const cleanExpiry = visaDetails.expiry.trim();
      const cleanName = visaDetails.cardholderName.trim();

      if (!cleanName) {
        return { error: 'Please enter the cardholder name.' };
      }

      if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
        return { error: 'Please enter a valid card number.' };
      }

      if (!/^\d{2}\/\d{2}$/.test(cleanExpiry)) {
        return { error: 'Please enter the expiry date as MM/YY.' };
      }

      if (cleanCvv.length < 3 || cleanCvv.length > 4) {
        return { error: 'Please enter a valid CVV.' };
      }

      return {
        value: {
          cardholder_name: cleanName,
          card_last4: cleanCardNumber.slice(-4),
          card_expiry: cleanExpiry
        }
      };
    }

    if (paymentMethod === 'applepay') {
      const account = applePayDetails.account.trim();
      if (!account) {
        return { error: 'Please enter your Apple Pay email or phone.' };
      }

      return { value: { applepay_account: account } };
    }

    return null;
  };

  const checkout = async () => {
    if (!userData?.id) {
      setCartMessage?.({ text: 'auth-required', type: 'auth' });
      return;
    }

    if (!selectedAddress.trim()) {
      setCartMessage?.({ text: 'Please choose or add a delivery address.', type: 'error' });
      return;
    }

    const paymentDetails = buildPaymentDetails();
    if (paymentDetails?.error) {
      setCartMessage?.({ text: paymentDetails.error, type: 'error' });
      return;
    }

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
          items: purchaseItems,
          shipping_address: selectedAddress,
          payment_method: paymentMethod,
          payment_details: paymentDetails?.value || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setCart([]);
      setVisaDetails({ cardholderName: '', cardNumber: '', expiry: '', cvv: '' });
      setApplePayDetails({ account: '' });
      setCartMessage?.({
        text: `Order placed successfully with ${selectedPayment?.label || 'selected payment'}.`,
        type: 'success'
      });
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
          }} aria-label="Close cart">
            <FiX />
          </button>
        </div>

        <div className="panel-body">
          {cartMessage?.text && (
            <div className={cartMessage.type === 'success' ? 'panel-success' : 'panel-error'}>
              {cartMessage.type === 'auth' ? (
                <>
                  Please{' '}
                  <button className="inline-auth-link" type="button" onClick={() => goToAuthPage(onSwitchToLogin)}>
                    sign in
                  </button>
                  {' '}or{' '}
                  <button className="inline-auth-link" type="button" onClick={() => goToAuthPage(onSwitchToSignup)}>
                    sign up
                  </button>
                  {' '}to complete purchase.
                </>
              ) : (
                cartMessage.text
              )}
            </div>
          )}
          {cart.length === 0 ? (
            <div className="empty-state">
              <FiShoppingBag />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-thumb">
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
                    <span>{getCategoryEmoji(item.category)}</span>
                  </div>
                <div className="cart-info">
                  <h4>{item.name}</h4>
                  <p>
                    {item.original_price && item.original_price > item.price && (
                      <small>EGP {(item.original_price * item.qty).toFixed(2)}</small>
                    )}
                    EGP {(item.price * item.qty).toFixed(2)}
                  </p>
                  {item.discount && <span className="cart-discount">-{item.discount}% applied</span>}

                  <div className="qty-row">
                      <button onClick={() => updateQty(item.id, -1)} aria-label={`Decrease ${item.name}`}>
                        <FiMinus />
                      </button>
                      <span>{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        disabled={item.stock !== undefined && item.qty >= item.stock}
                        aria-label={`Increase ${item.name}`}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </div>

                  <button className="delete-btn" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>
                    <FiTrash2 />
                  </button>
                </div>
              ))}

              <section className="checkout-options">
                <div className="checkout-section-title">
                  <FiMapPin />
                  <span>Delivery Address</span>
                </div>

                {addresses.length > 0 && (
                  <div className="address-list">
                    {addresses.map((address) => (
                      <label className={`address-option ${selectedAddress === address ? 'active' : ''}`} key={address}>
                        <input
                          type="radio"
                          name="delivery-address"
                          checked={selectedAddress === address}
                          onChange={() => setSelectedAddress(address)}
                        />
                        <span>{address}</span>
                      </label>
                    ))}
                  </div>
                )}

                {showAddressForm || addresses.length === 0 ? (
                  <div className="address-form">
                    <textarea
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Building, street, area, city..."
                    />
                    <button className="market-secondary-btn" type="button" onClick={saveAddress}>
                      Save Address
                    </button>
                  </div>
                ) : (
                  <button className="market-secondary-btn add-address-btn" type="button" onClick={() => setShowAddressForm(true)}>
                    <FiPlus />
                    Add Another Address
                  </button>
                )}

                <div className="checkout-section-title payment-title">
                  <FiCreditCard />
                  <span>Payment Method</span>
                </div>

                <div className="payment-options">
                  {paymentMethods.map((method) => (
                    <label className={`payment-option ${paymentMethod === method.id ? 'active' : ''}`} key={method.id}>
                      <input
                        type="radio"
                        name="payment-method"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                      />
                      {method.id === 'cash' && <FiDollarSign />}
                      {method.id === 'visa' && <FiCreditCard />}
                      {method.id === 'applepay' && <FiSmartphone />}
                      <span>
                        <strong>{method.label}</strong>
                        <small>{method.detail}</small>
                      </span>
                    </label>
                  ))}
                </div>

                {paymentMethod === 'visa' && (
                  <div className="payment-detail-form">
                    <label>
                      Cardholder Name
                      <input
                        value={visaDetails.cardholderName}
                        onChange={(e) => updateVisaDetails('cardholderName', e.target.value)}
                        placeholder="Name on card"
                      />
                    </label>
                    <label>
                      Card Number
                      <input
                        value={visaDetails.cardNumber}
                        onChange={(e) => updateVisaDetails('cardNumber', e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        inputMode="numeric"
                      />
                    </label>
                    <div className="payment-detail-grid">
                      <label>
                        Expiry
                        <input
                          value={visaDetails.expiry}
                          onChange={(e) => updateVisaDetails('expiry', e.target.value)}
                          placeholder="MM/YY"
                        />
                      </label>
                      <label>
                        CVV
                        <input
                          value={visaDetails.cvv}
                          onChange={(e) => updateVisaDetails('cvv', e.target.value)}
                          placeholder="123"
                          inputMode="numeric"
                          type="password"
                        />
                      </label>
                    </div>
                    <p className="payment-note">Only cardholder, expiry, and last 4 digits are saved.</p>
                  </div>
                )}

                {paymentMethod === 'applepay' && (
                  <div className="payment-detail-form">
                    <label>
                      Apple Pay Email or Phone
                      <input
                        value={applePayDetails.account}
                        onChange={(e) => setApplePayDetails({ account: e.target.value })}
                        placeholder="appleid@example.com"
                      />
                    </label>
                    <p className="payment-note">This is stored with the order as the Apple Pay account identifier.</p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="panel-footer">
            <div className="total-row">
              <span>Total</span>
              <strong>EGP {cartTotal.toFixed(2)}</strong>
            </div>

            <button className="market-primary-btn checkout-btn" onClick={checkout}>
              <FiShoppingBag />
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
