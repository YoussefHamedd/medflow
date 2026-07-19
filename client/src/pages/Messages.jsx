import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import Modal from '../components/Modal.jsx';
import { VideoIcon } from '../icons.jsx';

const stamp = (iso) =>
  new Date(iso + 'Z').toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

export default function Messages() {
  const { user, socket } = useAuth();
  const [params, setParams] = useSearchParams();
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [videoCall, setVideoCall] = useState(false);
  const scrollRef = useRef(null);

  const loadConvos = () => api('/conversations').then(setConvos).catch(() => {});
  useEffect(() => { loadConvos(); }, []);

  useEffect(() => {
    if (convos.length === 0) return;
    const wanted = Number(params.get('with'));
    const found = wanted && convos.find((c) => c.user.id === wanted);
    if (found) setActive(found.user);
    else if (!active) setActive(convos[0].user);
  }, [convos]);

  useEffect(() => {
    if (!active) return;
    api(`/messages/${active.id}`).then(setMessages).catch(() => {});
  }, [active?.id]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      setMessages((prev) => {
        if (!active) return prev;
        const relevant =
          (msg.sender_id === active.id && msg.receiver_id === user.id) ||
          (msg.sender_id === user.id && msg.receiver_id === active.id);
        return relevant ? [...prev, msg] : prev;
      });
      loadConvos();
    };
    socket.on('message', onMsg);
    return () => socket.off('message', onMsg);
  }, [socket, active?.id, user.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = () => {
    if (!text.trim() || !active || !socket) return;
    socket.emit('message', { to: active.id, text });
    setText('');
  };

  return (
    <div>
      {convos.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {convos.map(({ user: other }) => (
            <button
              key={other.id}
              title={`${other.first_name} ${other.last_name}`}
              onClick={() => { setActive(other); setParams({ with: String(other.id) }); }}
              style={{
                background: 'none',
                border: active?.id === other.id ? '2px solid var(--primary-bright)' : '2px solid transparent',
                borderRadius: '50%', padding: 2,
              }}
            >
              <Avatar user={other} size={34} />
            </button>
          ))}
        </div>
      )}

      <div className="chat-layout" style={{ background: 'var(--surface)' }}>
        <div className="chat-main">
          <div className="chat-scroll" ref={scrollRef}>
            {messages.map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} className={`bubble-row ${mine ? 'mine' : 'theirs'}`}>
                  <div className={`bubble ${mine ? 'mine' : 'theirs'}`}>
                    <div className="stamp">{stamp(m.created_at)}</div>
                    {m.text}
                  </div>
                  {!mine && <Avatar user={active} size={28} />}
                </div>
              );
            })}
            {active && messages.length === 0 && (
              <div className="empty-note">Say hi to {active.first_name}!</div>
            )}
            {!active && <div className="empty-note">No conversations yet.</div>}
          </div>
          <div className="chat-input">
            <Avatar user={user} size={30} />
            <div className="box">
              <div className="mini-label">Message</div>
              <input
                placeholder="Enter your message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
            </div>
            <button className={`send-btn${text.trim() ? ' ready' : ''}`} onClick={send}>Send</button>
            <button className="video-btn" title="Video call" onClick={() => setVideoCall(true)}>
              <VideoIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {videoCall && (
        <Modal title={`Video call with ${active?.first_name || ''}`} onClose={() => setVideoCall(false)} width={520}>
          <div style={{
            background: '#0f1f18', borderRadius: 10, height: 260,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#7fd0a5', flexDirection: 'column', gap: 10,
          }}>
            <VideoIcon size={40} />
            <div>Calling {active?.first_name} {active?.last_name}…</div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-danger" onClick={() => setVideoCall(false)}>End call</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
