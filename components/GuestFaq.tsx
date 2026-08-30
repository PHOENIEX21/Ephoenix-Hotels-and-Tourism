const questions = [
  ['What time is check-in and checkout?', 'Check-in is available anytime. The 24-hour stay model ends with checkout at 12:00 noon the following day.'],
  ['Is breakfast available?', 'Complimentary breakfast is available at selected branches. The team can confirm the current breakfast service when you book.'],
  ['How do I pay?', 'You can create a booking hold and continue securely to Paystack for card, bank transfer, or USSD payment.'],
  ['Can I cancel my booking?', 'Yes. Cancellation terms depend on how close the request is to arrival. See the branch policy before confirming.'],
];

export default function GuestFaq() {
  return <section className="section guest-faq-section" aria-labelledby="guest-faq-title">
    <div className="section-head"><div className="eyebrow">Guest essentials</div><h2 id="guest-faq-title">Useful before you arrive</h2><p className="section-intro">Clear answers for planning a comfortable stay.</p></div>
    <div className="guest-faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
  </section>;
}
