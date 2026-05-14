import { Link, useNavigate } from 'react-router-dom';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  usePageMeta({ title: '404 — Không tìm thấy' });
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      {/* Animated number */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-6 select-none"
      >
        <span
          className="text-[120px] font-black leading-none tracking-tighter"
          style={{
            fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg, #059669 0%, #14b8a6 50%, #f97316 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </span>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
        className="space-y-3"
      >
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('pages.notFound.title')}
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t('pages.notFound.subtitle')}
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.2, ease: 'easeOut' }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground icon-glass transition-colors"
        >
          <ArrowLeft size={15} /> {t('pages.notFound.goBack')}
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl btn-glass px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-colors"
        >
          <Home size={15} /> {t('pages.notFound.goHome')}
        </Link>
        <Link
          to="/events"
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground icon-glass transition-colors"
        >
          <Search size={15} /> {t('pages.notFound.browseEvents')}
        </Link>
      </motion.div>
    </div>
  );
}
