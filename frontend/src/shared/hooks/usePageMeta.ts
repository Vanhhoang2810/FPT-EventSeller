import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
}

const BASE_TITLE = 'Ticket Rush';

/**
 * Set document title và meta description cho từng route.
 * Dọn dẹp khi component unmount (restore title mặc định).
 */
export function usePageMeta({ title, description, ogTitle, ogDescription }: PageMeta) {
  useEffect(() => {
    const fullTitle = title === BASE_TITLE ? BASE_TITLE : `${title} | ${BASE_TITLE}`;
    document.title = fullTitle;

    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? 'property' : 'name';
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (description) {
      setMeta('description', description);
      setMeta('og:description', ogDescription ?? description, true);
    }
    if (ogTitle) setMeta('og:title', ogTitle, true);

    return () => {
      document.title = BASE_TITLE;
    };
  }, [title, description, ogTitle, ogDescription]);
}
