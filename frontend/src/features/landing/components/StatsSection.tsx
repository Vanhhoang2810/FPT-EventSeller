import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString('vi-VN')}{suffix}</span>;
}

const STATS = [
  { value: 500,   suffix: '+', labelKey: 'statsEvents' },
  { value: 100000, suffix: '+', labelKey: 'statsTickets' },
  { value: 50000, suffix: '+', labelKey: 'statsUsers' },
  { value: 99,   suffix: '.9%', labelKey: 'statsUptime' },
];

const LABELS_VI: Record<string, string> = {
  statsEvents: 'Sự kiện tổ chức',
  statsTickets: 'Vé đã bán',
  statsUsers: 'Người dùng tin tưởng',
  statsUptime: 'Uptime đảm bảo',
};

const LABELS_EN: Record<string, string> = {
  statsEvents: 'Events hosted',
  statsTickets: 'Tickets sold',
  statsUsers: 'Users trust us',
  statsUptime: 'Uptime guaranteed',
};

export function StatsSection() {
  const { i18n } = useTranslation();
  const isVi = i18n.language?.startsWith('vi');
  const labels = isVi ? LABELS_VI : LABELS_EN;

  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center"
            >
              <div
                className="mb-1 text-3xl font-black tabular-nums md:text-4xl"
                style={{
                  fontFamily: 'var(--font-heading)',
                  background: i % 2 === 0
                    ? 'linear-gradient(135deg, #10B981, #34D399)'
                    : 'linear-gradient(135deg, #F97316, #FBBF24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {labels[stat.labelKey]}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
