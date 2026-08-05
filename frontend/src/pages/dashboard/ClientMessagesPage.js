import { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import MessageThread from '../../components/MessageThread';
import api from '../../api';
import './messages-page.css';

const fmtStatus = (s) => (s || '').replace('_', ' ');

export default function ClientMessagesPage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then((r) => {
        const active = r.data.filter((o) =>
          ['confirmed', 'in_progress', 'in_review', 'quoted', 'requested', 'completed'].includes(o.status)
        );
        setOrders(active);
        if (active.length) setSelected(active[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout pageTitle="Messages" pageSubtitle="Chat with our team about your orders">
      <div className="msg-page">
        {/* Sidebar — order list */}
        <aside className="msg-page__sidebar">
          {loading ? (
            <div className="msg-page__empty"><span className="spinner" /></div>
          ) : orders.length === 0 ? (
            <div className="msg-page__empty">No active orders.</div>
          ) : (
            orders.map((o) => (
              <button
                key={o.id}
                className={`msg-order-item${selected?.id === o.id ? ' active' : ''}`}
                onClick={() => setSelected(o)}
              >
                <div className="msg-order-ref">{o.reference}</div>
                <div className="msg-order-service">{o.service_name}</div>
                <span className={`status-badge status-badge--${o.status}`}>{fmtStatus(o.status)}</span>
              </button>
            ))
          )}
        </aside>

        {/* Thread */}
        <div className="msg-page__thread">
          {selected ? (
            <>
              <div className="msg-page__thread-header">
                <strong>{selected.reference}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{selected.service_name}</span>
              </div>
              <MessageThread orderId={selected.id} />
            </>
          ) : (
            <div className="msg-page__empty">Select an order to view messages.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
