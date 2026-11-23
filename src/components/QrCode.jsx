import { useEffect, useState } from 'react';
import { qrToDataUrl, qrToPngBlob } from '../lib/qrcode.js';
import { downloadBlob } from '../lib/exportSvg.js';
import { DownloadIcon, CopyIcon, CheckIcon, SpinnerIcon } from './Icons.jsx';

// Presentational QR for any string. It knows nothing about maps or shares — give
// it a `value` and it renders a scannable code plus download/copy actions. This
// keeps it reusable (an exported image, a profile link, anything) and leaves the
// encoding details to lib/qrcode.js.
export default function QrCode({ value, size = 200, filename = 'qrcode.png', flash }) {
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Regenerate whenever the encoded value or size changes; ignore a stale result
  // if the component unmounts or `value` changes mid-flight.
  useEffect(() => {
    let active = true;
    setDataUrl('');
    setError('');
    qrToDataUrl(value, { size })
      .then((url) => active && setDataUrl(url))
      .catch(() => active && setError('Could not generate QR code'));
    return () => {
      active = false;
    };
  }, [value, size]);

  const notify = (msg) => flash?.(msg);

  const download = async () => {
    try {
      downloadBlob(await qrToPngBlob(value, { size: 1024 }), filename);
      notify('QR downloaded');
    } catch {
      notify('Download failed');
    }
  };

  const copy = async () => {
    try {
      const blob = await qrToPngBlob(value, { size: 1024 });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      notify('QR copied');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      notify('Copy failed');
    }
  };

  if (error) {
    return <p className="m-0 py-3 text-center text-[0.78rem] text-[#f43f5e]">{error}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex items-center justify-center rounded-lg bg-white p-2.5"
        style={{ width: size + 20, height: size + 20 }}
      >
        {dataUrl ? (
          <img src={dataUrl} width={size} height={size} alt="QR code for this link" />
        ) : (
          <SpinnerIcon width="22" height="22" className="text-[#0b1220]" />
        )}
      </div>

      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={download}
          disabled={!dataUrl}
          className="btn flex-1 justify-center disabled:opacity-60"
        >
          <DownloadIcon width="15" height="15" /> Download
        </button>
        <button
          type="button"
          onClick={copy}
          disabled={!dataUrl}
          className="btn flex-1 justify-center disabled:opacity-60"
        >
          {copied ? <CheckIcon width="15" height="15" /> : <CopyIcon width="15" height="15" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
