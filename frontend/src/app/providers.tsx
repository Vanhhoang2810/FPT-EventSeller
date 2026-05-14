import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from 'next-themes';
import { store } from './store';
import { Toaster } from '@/shared/components/ui/sonner';
import { SessionProvider } from './SessionProvider';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const content = (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="ticketrush-theme">
      <Provider store={store}>
        <SessionProvider>
          {children}
          <Toaster position="top-right" closeButton />
        </SessionProvider>
      </Provider>
    </ThemeProvider>
  );

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id') {
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>;
  }

  return content;
}
