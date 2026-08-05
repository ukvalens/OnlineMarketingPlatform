import { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import MessageThread from '../../components/MessageThread';
import api from '../../api';
import './messages-page.css';

const fmtStatus = (s) => (s || '').replace('_', ' ');

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/messages')
      .then((r) => {
        setThreads(r.data);
        if (r.data.length) setSelected(r.data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout pageTitle="Messages" pageSubtitle="Client–staff messaging threads per order">
      <div className="msg-page">
        {/* Sidebar */}
        <aside className="msg-page__sidebar">
          {loading ? (
            <div className="msg-page__empty"><span className="spinner" /></div>
          ) : threads.length === 0 ? (
            <div className="msg-page__empty">No message threads yet.</div>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                className={`msg-order-item${selected?.id === t.id ? ' active' : ''}`}
                onClick={() => setSelected(t)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="msg-order-ref">{t.reference}</div>
                  {parseInt(t.unread) > 0 && (
                    <span className="msg-unread-badge">{t.unread}</span>
                  )}
                </div>
                <div className="msg-order-service">{t.client_name}</div>
                <span className={`status-badge status-badge--${t.status}`}>{fmtStatus(t.status)}</span>
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
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Client: {selected.client_name}
                  {selected.staff_name && ` · Assigned: ${selected.staff_name}`}
                </span>
              </div>
              <MessageThread orderId={selected.id} />
            </>
          ) : (
            <div className="msg-page__empty">Select a thread to view messages.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
