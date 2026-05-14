import { Turnstile } from '@marsidev/react-turnstile';

interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

// Test key: '1x00000000000000000000AA' (always passes, invisible)
// Invisible key: '1x00000000000000000000BB' (always passes, fully invisible)
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000BB';

export function CaptchaWidget({ onVerify, onExpire, onError }: CaptchaWidgetProps) {
  return (
    // invisible — widget chạy ngầm, không hiện UI
    <div className="hidden" aria-hidden="true">
      <Turnstile
        siteKey={SITE_KEY}
        onSuccess={onVerify}
        onExpire={onExpire}
        onError={onError}
        options={{ theme: 'auto', size: 'invisible' }}
      />
    </div>
  );
}
