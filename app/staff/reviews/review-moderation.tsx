'use client';
import { useState } from 'react';

export default function ReviewModeration({ reviews: initial }: { reviews: { id: string; guestName: string; rating: number; body: string; hotel: string; roomType: string }[] }) {
  const [reviews, setReviews] = useState(initial);
  async function approve(id: string) { const response = await fetch('/api/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, published: true }) }); if (response.ok) setReviews(reviews.filter(review => review.id !== id)); }
  return <main style={{ maxWidth: 800, margin: '4rem auto', padding: '0 1rem' }}><h1>Review moderation</h1>{reviews.map(review => <article key={review.id} style={{ border: '1px solid #ddd', padding: 16, marginTop: 12 }}><strong>{review.guestName} · {review.rating}/5</strong><p>{review.hotel} · {review.roomType}</p><p>{review.body}</p><button type="button" onClick={() => approve(review.id)}>Approve and publish</button></article>)}{!reviews.length ? <p>No pending reviews.</p> : null}<p><a href="/staff">Back to dashboard</a></p></main>;
}
