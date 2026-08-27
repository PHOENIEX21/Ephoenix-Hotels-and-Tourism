import CancellationLookup from '../dashboard/cancellation-lookup';

export default function CancelBookingPage() {
  return <main style={{ maxWidth: 700, margin: '4rem auto', padding: '0 1rem' }}><h1>Cancel a booking</h1><p>Enter the booking reference and guest email used at checkout.</p><CancellationLookup /></main>;
}