'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Department } from '@prisma/client';

const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: 'FRONT_OFFICE', label: 'Front Office/Reception' },
  { value: 'HOUSEKEEPING', label: 'Housekeeping' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'POOL_BAR', label: 'Pool Bar' },
  { value: 'ACCOUNTS', label: 'Accounts/Finance' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'MANAGEMENT', label: 'Management' },
  { value: 'OTHER', label: 'Other' },
];

const BRANCHES = ['Main Branch', 'Annex 1', 'Annex 2'] as const;

export default function StaffRegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setFormReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formReady) {
      setError('Please wait a moment before submitting.');
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = {
      fullName: formData.get('fullName'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      branch: formData.get('branch'),
      department: formData.get('department'),
      originalRole: formData.get('originalRole'),
      profilePhotoUrl: formData.get('profilePhotoUrl'),
      whatsappConsent: formData.get('whatsappConsent') === 'on',
      website: formData.get('website'),
      formTimestamp: Date.now(),
    };

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/staff/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="staff-register-page">
        <div className="staff-register-card">
          <h1>Registration received</h1>
          <p>Your details have been submitted for review. Management will contact you once your account is approved.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="staff-register-page">
      <div className="staff-register-card">
        <h1>Staff registration</h1>
        <p>Fill in your details below. Management will review and confirm your role.</p>

        {error ? <p className="dashboard-alert" role="alert">{error}</p> : null}

        <form ref={formRef} className="staff-register-form" onSubmit={submit}>
          <label>
            Full name
            <input name="fullName" placeholder="Your full name" required minLength={2} maxLength={100} autoComplete="name" />
          </label>

          <label>
            Phone number
            <input name="phone" type="tel" placeholder="e.g. 08012345678" required minLength={10} autoComplete="tel" />
          </label>

          <label>
            Email address (optional)
            <input name="email" type="email" placeholder="you@example.com" autoComplete="email" />
          </label>

          <label>
            Branch
            <select name="branch" required defaultValue="">
              <option value="" disabled>Choose your branch</option>
              {BRANCHES.map((branch) => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </label>

          <label>
            Department
            <select name="department" required defaultValue="">
              <option value="" disabled>Choose your department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
          </label>

          <label>
            Your role / job title
            <input name="originalRole" placeholder="e.g. receptionist, cleaner, chef" required minLength={2} maxLength={100} />
            <small>Write your role in your own words. This does not give you system access.</small>
          </label>

          <label>
            Profile photo URL (optional)
            <input name="profilePhotoUrl" type="url" placeholder="https://..." />
          </label>

          <label className="staff-register-checkbox">
            <input name="whatsappConsent" type="checkbox" />
            <span>I agree to receive the EPhoenix staff WhatsApp invitation if approved.</span>
          </label>

          <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }} aria-hidden="true" />

          <button className="button button-gold" type="submit" disabled={loading || !formReady}>
            {loading ? 'Submitting...' : 'Submit registration'}
          </button>
        </form>
      </div>
    </main>
  );
}
