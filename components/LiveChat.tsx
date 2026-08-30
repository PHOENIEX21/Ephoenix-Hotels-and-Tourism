'use client';

import { useState } from 'react';

export default function LiveChat() {
  const [open, setOpen] = useState(false);

  return <div className="live-chat">
    {open ? <section className="live-chat-panel" aria-label="Live chat with EPhoenix">
      <button type="button" className="live-chat-close" onClick={() => setOpen(false)} aria-label="Close live chat">×</button>
      <div className="live-chat-status"><span /> We are here to help</div>
      <h2>Chat with us live</h2>
      <p>We are at your service. Ask about rooms, availability, events, or your next stay.</p>
      <a className="live-chat-start" href="https://wa.me/2347065023672" target="_blank" rel="noreferrer">Start a conversation <span aria-hidden="true">→</span></a>
    </section> : null}
    <button type="button" className="live-chat-trigger" onClick={() => setOpen(current => !current)} aria-expanded={open} aria-label={open ? 'Close live chat' : 'Open live chat'}>
      <span className="live-chat-bubble" aria-hidden="true">•••</span>
      <span>Chat with us</span>
    </button>
  </div>;
}
