import { useRef } from 'react';

/**
 * Segmented one-time-code input: `length` single-digit boxes that behave like
 * one field. Supports typing with auto-advance, Backspace to go back, arrow
 * keys, and pasting the whole code into any box (digits spread across boxes).
 * Controlled via `value` (a string) / `onChange`; `onComplete` fires when all
 * boxes are filled.
 *
 * Handlers read the live digits straight from the input DOM nodes rather than
 * from the `value` prop closure, so fast typing (or an automated fill) can't
 * race React's re-render and drop characters.
 */
export default function OtpInput({ value = '', onChange, length = 6, autoFocus = false, onComplete }) {
  const refs = useRef([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? '');

  const focusBox = (i) => {
    const el = refs.current[i];
    if (el) {
      el.focus();
      el.select?.();
    }
  };

  // Current single digit shown in each box, read from the DOM.
  const readDigits = () =>
    refs.current.map((el) => (el?.value || '').replace(/\D/g, '').slice(-1));

  const commit = (arr) => {
    const joined = arr.join('').slice(0, length);
    onChange(joined);
    return joined;
  };

  const handleChange = (i, e) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = readDigits();
    arr[i] = digit; // may be '' if a non-digit was typed
    const joined = commit(arr);
    if (digit && i < length - 1) focusBox(i + 1);
    if (joined.length === length) onComplete?.(joined);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = readDigits();
      if (arr[i]) {
        arr[i] = '';
        commit(arr);
      } else if (i > 0) {
        arr[i - 1] = '';
        commit(arr);
        focusBox(i - 1);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      e.preventDefault();
      focusBox(i + 1);
    }
  };

  // Paste the whole code at once (from email / clipboard) into any box.
  const handlePaste = (e) => {
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    e.preventDefault();
    onChange(digits);
    focusBox(Math.min(digits.length, length - 1));
    if (digits.length === length) onComplete?.(digits);
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {chars.map((ch, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          value={ch}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1} of ${length}`}
          className="h-12 w-full min-w-0 rounded-lg border border-line bg-panel text-center text-[1.25rem] font-semibold text-fg caret-accent outline-none focus:border-accent"
        />
      ))}
    </div>
  );
}
