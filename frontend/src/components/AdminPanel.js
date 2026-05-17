import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiArrowLeft, FiClock, FiMail, FiPhone, FiRefreshCw, FiSearch, FiShield } from 'react-icons/fi';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const statuses = ['All', 'Open', 'In Progress', 'Resolved'];

const formatDateTime = (value) => {
  if (!value) return 'No date';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AdminPanel({ adminData, onLogout, onBackToStore }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const adminToken = localStorage.getItem('adminToken');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${API}/admin/tickets`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      setTickets(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load tickets');
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [adminToken, onLogout]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateStatus = async (ticketId, status) => {
    setUpdatingId(ticketId);
    setError('');

    try {
      await axios.put(
        `${API}/admin/tickets/${ticketId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status } : ticket
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update ticket');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
      const matchesSearch = !cleanSearch || [
        ticket.id,
        ticket.name,
        ticket.email,
        ticket.phone,
        ticket.order_id,
        ticket.issue_type,
        ticket.message,
        ticket.status
      ].some((value) => String(value || '').toLowerCase().includes(cleanSearch));

      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, tickets]);

  const ticketStats = useMemo(() => {
    return tickets.reduce((stats, ticket) => {
      stats.total += 1;
      stats[ticket.status] = (stats[ticket.status] || 0) + 1;
      return stats;
    }, { total: 0, Open: 0, 'In Progress': 0, Resolved: 0 });
  }, [tickets]);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-title">
          <span className="admin-badge"><FiShield /> Staff Dashboard</span>
          <h1>Customer Tickets</h1>
          <p>Signed in as {adminData?.email || 'Admin'}</p>
        </div>

        <div className="admin-header-actions">
          <button className="market-secondary-btn" onClick={fetchTickets} disabled={loading}>
            <FiRefreshCw />
            Refresh
          </button>
          <button className="market-secondary-btn" onClick={onBackToStore}>
            <FiArrowLeft />
            Store
          </button>
          <button className="market-danger-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="admin-shell">
        <section className="admin-stats">
          <div>
            <span>Total</span>
            <strong>{ticketStats.total}</strong>
          </div>
          <div>
            <span>Open</span>
            <strong>{ticketStats.Open}</strong>
          </div>
          <div>
            <span>In Progress</span>
            <strong>{ticketStats['In Progress']}</strong>
          </div>
          <div>
            <span>Resolved</span>
            <strong>{ticketStats.Resolved}</strong>
          </div>
        </section>

        <section className="admin-toolbar">
          <div className="admin-search">
            <FiSearch />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets, orders, customers..."
            />
          </div>

          <div className="admin-status-tabs">
            {statuses.map((status) => (
              <button
                key={status}
                className={statusFilter === status ? 'active' : ''}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        {error && <div className="panel-error">{error}</div>}

        {loading ? (
          <div className="loading-text">
            <span />
            Loading tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="admin-empty">No tickets found.</div>
        ) : (
          <section className="ticket-list">
            {filteredTickets.map((ticket) => (
              <article className="ticket-card" key={ticket.id}>
                <div className="ticket-top">
                  <div>
                    <span className={`ticket-status status-${ticket.status.replace(/\s+/g, '-').toLowerCase()}`}>
                      {ticket.status}
                    </span>
                    <h2>#{ticket.id} {ticket.issue_type}</h2>
                  </div>

                  <select
                    value={ticket.status}
                    onChange={(e) => updateStatus(ticket.id, e.target.value)}
                    disabled={updatingId === ticket.id}
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </div>

                <p className="ticket-message">{ticket.message}</p>

                <div className="ticket-meta">
                  <span><FiMail /> {ticket.email}</span>
                  {ticket.phone && <span><FiPhone /> {ticket.phone}</span>}
                  <span><FiClock /> {formatDateTime(ticket.created_at)}</span>
                </div>

                <div className="ticket-footer">
                  <strong>{ticket.name}</strong>
                  <span>{ticket.order_id ? `Order ${ticket.order_id}` : 'No order linked'}</span>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
