import { useRef, useState, useEffect } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import { BotIcon } from '../icons.jsx';

export default function AiDoctor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI health assistant. How can I help you today? (I'm not a real doctor — for anything serious, please book an appointment.)" },
  ]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  const send = async () => {
    if (!text.trim() || busy) return;
    const next = [...messages, { role: 'user', content: text.trim() }];
    setMessages(next);
    setText('');
    setBusy(true);
    try {
      const { reply } = await api('/ai/chat', {
        method: 'POST',
        body: { messages: next.filter((m, i) => i > 0 || m.role === 'user').map(({ role, content }) => ({ role, content })) },
      });
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ai-chat">
      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m, i) => {
          const mine = m.role === 'user';
          return (
            <div key={i} className={`bubble-row ${mine ? 'mine' : 'theirs'}`}>
              {!mine && (
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                }}>
                  <BotIcon size={17} />
                </div>
              )}
              <div className={`bubble ${mine ? 'mine' : 'theirs'}`}>{m.content}</div>
              {mine && <Avatar user={user} size={28} />}
            </div>
          );
        })}
        {busy && (
          <div className="bubble-row theirs" style={{ justifyContent: 'flex-start' }}>
            <div className="bubble theirs">…</div>
          </div>
        )}
      </div>
      <div className="chat-input">
        <div className="box">
          <div className="mini-label">Message</div>
          <input
            placeholder="Ask the AI doctor..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
        </div>
        <button className={`send-btn${text.trim() ? ' ready' : ''}`} onClick={send} disabled={busy}>Send</button>
      </div>
    </div>
  );
}
