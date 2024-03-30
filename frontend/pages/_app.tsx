import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const { pathname } = router;

    if (pathname !== '/usage') {
      router.replace('/');
    }
  }, [router]);

  return (
    <main className="scroll-smooth antialiased [font-feature-settings:'ss01']">
      <Component {...pageProps} />
    </main>
  );
}

export default MyApp;