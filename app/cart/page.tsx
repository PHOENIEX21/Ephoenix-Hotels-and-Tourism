'use client';

import { useEffect, useState } from 'react';

type CartItem = { roomTypeId: string; checkIn: string; nights: number; guests: number; quantity: number; name?: string; hotel?: string; priceKobo?: number };
const money = (n: number) => `₦${Math.round(n / 100).toLocaleString('en-NG')}`;

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { setItems(JSON.parse(localStorage.getItem('ephoenix-cart') || '[]')); }, []);
  function update(next: CartItem[]) { setItems(next); localStorage.setItem('ephoenix-cart', JSON.stringify(next)); }
  function checkoutDate(checkIn: string, nights: number) {
    const date = new Date(`${checkIn}T12:00:00`);
    date.setDate(date.getDate() + nights);
    return date.toISOString().slice(0, 10);
  }
  async function checkout() {
    setLoading(true); setMessage('Checking availability and creating holds...');
    try {
      const response = await fetch('/api/orders/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, guestName, guestEmail, guestPhone }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error || 'Some rooms are no longer available.'); return; }
      const payment = await fetch('/api/payments/paystack/initiate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: data.order.id, email: guestEmail }) });
      const paymentData = await payment.json();
      if (!payment.ok) { setMessage(paymentData.error || 'Unable to start payment.'); return; }
      localStorage.removeItem('ephoenix-cart'); setItems([]); window.location.href = paymentData.authorization_url;
    } catch { setMessage('Unable to reach checkout. Please try again.'); }
    finally { setLoading(false); }
  }
  const grouped = items.reduce<Record<string, Array<{ item: CartItem; index: number }>>>((groups, item, index) => {
    const branch = item.hotel || 'Selected branch';
    (groups[branch] ||= []).push({ item, index });
    return groups;
  }, {});
  return <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}><h1>Your booking cart</h1>{items.length ? Object.entries(grouped).map(([branch, entries]) => <section key={branch} aria-labelledby={`cart-${branch}`}><h2 id={`cart-${branch}`}>{branch}</h2>{entries.map(({ item, index }) => <article key={`${item.roomTypeId}-${item.checkIn}-${index}`} style={{ borderBottom: '1px solid #ddd', padding: 12 }}><strong>{item.name || 'Room'}</strong><p>{item.guests} guest(s) · {money((item.priceKobo || 0) * item.nights * item.quantity)}</p><label>Check-in <input type="date" required value={item.checkIn} min={new Date().toISOString().slice(0, 10)} onChange={event => { const next = [...items]; next[index] = { ...item, checkIn: event.target.value }; update(next); }} /></label>{' '}<label>Nights <input type="number" min="1" max="30" value={item.nights} onChange={event => { const next = [...items]; next[index] = { ...item, nights: Number(event.target.value) }; update(next); }} /></label><p>Checkout: {checkoutDate(item.checkIn, item.nights)}</p><label>Rooms <input type="number" min="1" max="20" value={item.quantity} onChange={event => { const next = [...items]; next[index] = { ...item, quantity: Number(event.target.value) }; update(next); }} /></label>{' '}<button type="button" onClick={() => update(items.filter((_, i) => i !== index))}>Remove</button></article>)}</section>) : <p>Your cart is empty. Add rooms from availability search.</p>}{items.length ? <form onSubmit={event => { event.preventDefault(); void checkout(); }} style={{ display: 'grid', gap: 10, marginTop: 20 }}><input required placeholder="Full name" value={guestName} onChange={e => setGuestName(e.target.value)} /><input required type="email" placeholder="Email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} /><input required placeholder="Phone" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} /><button type="submit">Checkout and pay once</button></form> : null}{message ? <p role="status">{message}</p> : null}</main>;
  return <main className="cart-page"><div className="cart-heading"><div className="eyebrow">Your stay, gathered</div><h1>Your booking cart</h1><p className="muted">Review your rooms, confirm your details, and continue securely to payment.</p></div>{items.length ? <div className="cart-content">{Object.entries(grouped).map(([branch, entries]) => <section className="cart-branch" key={branch} aria-labelledby={`cart-${branch}`}><h2 id={`cart-${branch}`}>{branch}</h2>{entries.map(({ item, index }) => <article className="cart-item" key={`${item.roomTypeId}-${item.checkIn}-${index}`}><div className="cart-item-heading"><strong>{item.name || 'Room'}</strong><span>{money((item.priceKobo || 0) * item.nights * item.quantity)}</span></div><p>{item.guests} guest(s)</p><div className="cart-fields"><label>Check-in<input type="date" required value={item.checkIn} min={new Date().toISOString().slice(0, 10)} onChange={event => { const next = [...items]; next[index] = { ...item, checkIn: event.target.value }; update(next); }} /></label><label>Nights<input type="number" min="1" max="30" value={item.nights} onChange={event => { const next = [...items]; next[index] = { ...item, nights: Number(event.target.value) }; update(next); }} /></label><label>Rooms<input type="number" min="1" max="20" value={item.quantity} onChange={event => { const next = [...items]; next[index] = { ...item, quantity: Number(event.target.value) }; update(next); }} /></label></div><p className="muted">Checkout: {checkoutDate(item.checkIn, item.nights)}</p><button className="button button-outline" type="button" onClick={() => update(items.filter((_, i) => i !== index))}>Remove</button></article>)}</section>)}</div> : <p className="card card-body">Your cart is empty. Add rooms from availability search.</p>}{items.length ? <form className="cart-checkout card" onSubmit={event => { event.preventDefault(); void checkout(); }}><h2>Guest details</h2><input required placeholder="Full name" value={guestName} onChange={e => setGuestName(e.target.value)} /><input required type="email" placeholder="Email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} /><input required placeholder="Phone" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} /><button className="button button-gold" type="submit" disabled={loading}>{loading ? 'Preparing payment...' : 'Checkout and pay once'}</button></form> : null}{message ? <p className="cart-message" role="status">{message}</p> : null}</main>;
}
