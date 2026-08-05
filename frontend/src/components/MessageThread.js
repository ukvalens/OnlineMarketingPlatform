import { useEffect, useRef, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faPaperclip, faDownload } from '@fortawesome/free-solid-svg-icons';
import api, { getImageUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import './messages.css';

const fmtTime = (d) =>
  new Date(d).toLocaleString('en-RW', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function MessageThread({ orderId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const fileRef = useRef();
  const bottomRef = useRef();

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}/messages`);
      setMessages(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  // Scroll to bottom on new messages
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/orders/${orderId}/messages`, { content: text });
      setText('');
      await load();
    } catch { /* ignore */ }
    setSending(false);
  };

  const sendFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    const fd = new FormData();
    fd.append('attachment', file);
    try {
      await api.post(`/orders/${orderId}/messages`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
    } catch { /* ignore */ }
    setSending(false);
    e.target.value = '';
  };

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(url);

  return (
    <div className="msg-thread">
      <div className="msg-thread__body">
        {loading ? (
          <div className="msg-thread__empty"><span className="spinner" /></div>
        ) : messages.length === 0 ? (
          <div className="msg-thread__empty">No messages yet. Start the conversation.</div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`msg-bubble-wrap${mine ? ' mine' : ''}`}>
                {!mine && <div className="msg-sender">{m.sender_name} · {m.sender_role}</div>}
                <div className={`msg-bubble${mine ? ' msg-bubble--mine' : ''}`}>
                  {m.content && <p>{m.content}</p>}
                  {m.attachment_url && (
                    isImage(m.attachment_url) ? (
                      <img src={getImageUrl(m.attachment_url)} alt="attachment" className="msg-img" />
                    ) : (
                      <a href={getImageUrl(m.attachment_url)} target="_blank" rel="noreferrer" className="msg-file-link">
                        <FontAwesomeIcon icon={faDownload} /> Download attachment
                      </a>
                    )
                  )}
                </div>
                <div className="msg-time">{fmtTime(m.sent_at)}</div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form className="msg-thread__input" onSubmit={send}>
        <input
          type="file"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={sendFile}
          accept="image/*,.pdf,.doc,.docx,.zip"
        />
        <button
          type="button"
          className="msg-attach-btn"
          onClick={() => fileRef.current.click()}
          disabled={sending}
          title="Attach file"
        >
          <FontAwesomeIcon icon={faPaperclip} />
        </button>
        <input
          className="msg-input"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="msg-send-btn" disabled={sending || !text.trim()}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </div>
  );
}
