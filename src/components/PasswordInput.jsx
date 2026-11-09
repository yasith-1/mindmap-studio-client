import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons.jsx';

/**
 * A masked password/passcode input with a show/hide toggle at the right edge.
 * Controlled via `value` / `onChange(value)`; forwards any extra input props.
 */
export default function PasswordInput({ value, onChange, className = '', ...rest }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-line bg-panel py-2.5 pl-3 pr-10 text-[0.9rem] text-fg outline-none focus:border-accent ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-muted hover:text-accent"
        title={show ? 'Hide passcode' : 'Show passcode'}
        aria-label={show ? 'Hide passcode' : 'Show passcode'}
        tabIndex={-1}
      >
        {show ? <EyeOffIcon width="16" height="16" /> : <EyeIcon width="16" height="16" />}
      </button>
    </div>
  );
}
