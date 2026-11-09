import { useEffect, useRef, useState } from 'react';
import { SpinnerIcon } from './Icons.jsx';
import OtpInput from './OtpInput.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Passwordless sign-in dialog. Two steps:
 *   1. enter email  → requestOtp sends a 6-digit code
 *   2. enter code   → verifyOtp signs the user in
 * No passwords, no registration — the account is created on first verify.
 */
// mm:ss formatter for the countdown.
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function AuthDialog({ open, onClose, requestOtp, verifyOtp, flash }) {
  const ref = useRef(null);
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Seconds until the current code expires; "Resend" unlocks when it hits 0.
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Reset to a clean state whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setStep('email');
      setCode('');
      setBusy(false);
      setError('');
      setSecondsLeft(0);
    }
  }, [open]);

  // Tick the countdown down to 0 while on the code step.
  useEffect(() => {
    if (step !== 'code') return undefined;
    const t = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  const sendCode = async (e) => {
    e?.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await requestOtp(email.trim().toLowerCase());
      const mins = res?.ttlMinutes ?? 5;
      setSecondsLeft(mins * 60); // start / restart the countdown
      setCode('');
      setStep('code');
      flash('Code sent — check your email');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e, codeArg) => {
    e?.preventDefault();
    const submitted = (typeof codeArg === 'string' ? codeArg : code).trim();
    if (submitted.length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await verifyOtp(email.trim().toLowerCase(), submitted);
      flash('Signed in — cloud save is on');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-32px)] max-w-[min(420px,92vw)] overflow-visible rounded-[14px] border border-line bg-surface p-0 text-fg shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop:bg-black/40"
    >
      <div className="px-6 py-[22px]">
        <h2 className="mb-1 mt-0 text-[1.15rem] tracking-[-0.01em]">
          {step === 'email' ? 'Sign in to save your maps' : 'Enter your code'}
        </h2>
        <p className="mb-4 mt-0 text-[0.86rem] leading-[1.5] text-muted">
          {step === 'email'
            ? 'No password. We email you a 6-digit code — that’s the whole sign-in.'
            : `We sent a code to ${email}.`}
        </p>

        {step === 'email' ? (
          <form onSubmit={sendCode} className="flex flex-col gap-3">
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-[0.9rem] text-fg outline-none focus:border-accent"
            />
            {error && <p className="m-0 text-[0.8rem] text-[#f43f5e]">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary w-full justify-center disabled:opacity-60"
            >
              {busy ? <SpinnerIcon width="15" height="15" /> : null}
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="flex flex-col gap-3">
            <OtpInput
              value={code}
              onChange={setCode}
              length={6}
              autoFocus
              onComplete={(full) => verify(null, full)}
            />

            {/* Live expiry countdown */}
            <p className="m-0 text-center text-[0.8rem] text-muted">
              {secondsLeft > 0 ? (
                <>
                  Code expires in{' '}
                  <span className="font-semibold tabular-nums text-fg">{fmt(secondsLeft)}</span>
                </>
              ) : (
                <span className="text-[#f43f5e]">Code expired — request a new one.</span>
              )}
            </p>

            {error && <p className="m-0 text-[0.8rem] text-[#f43f5e]">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary w-full justify-center disabled:opacity-60"
            >
              {busy ? <SpinnerIcon width="15" height="15" /> : null}
              {busy ? 'Verifying…' : 'Verify & sign in'}
            </button>
            <div className="flex items-center justify-between text-[0.78rem] text-muted">
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 text-muted hover:text-accent"
                onClick={() => setStep('email')}
              >
                ← Change email
              </button>
              <button
                type="button"
                disabled={secondsLeft > 0 || busy}
                className="cursor-pointer border-0 bg-transparent p-0 text-accent hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                onClick={sendCode}
                title={secondsLeft > 0 ? `Available when the code expires` : 'Send a new code'}
              >
                {secondsLeft > 0 ? `Resend in ${fmt(secondsLeft)}` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        <button
          type="button"
          className="mt-4 w-full cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] text-muted hover:text-accent"
          onClick={onClose}
        >
          Continue without signing in
        </button>
      </div>
    </dialog>
  );
}
