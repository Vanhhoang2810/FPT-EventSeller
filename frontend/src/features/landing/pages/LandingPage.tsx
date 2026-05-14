import { usePageMeta } from '../../../shared/hooks/usePageMeta';
import { useGetFeaturedEventsQuery } from '../../events/services/eventsApi';
import { ImmersiveHero } from '../components/ImmersiveHero';
import { Marquee } from '../components/Marquee';
import { StatsSection } from '../components/StatsSection';
import { TrendingEvents } from '../components/TrendingEvents';
import { UpcomingSales } from '../components/UpcomingSales';
import { HowItWorks } from '../components/HowItWorks';
import { useTranslation } from 'react-i18next';

const MARQUEE_ITEMS_VI = [
  '🎵 Âm nhạc', '⚡ Ticket Rush', '🏆 Thể thao',
  '🎭 Sân khấu', '😄 Hài kịch', '🎪 Festival',
  '🎤 Hội thảo', '🎫 Đặt vé nhanh', '🔐 Thanh toán bảo mật',
];

const MARQUEE_ITEMS_EN = [
  '🎵 Music', '⚡ Ticket Rush', '🏆 Sports',
  '🎭 Theater', '😄 Comedy', '🎪 Festival',
  '🎤 Conference', '🎫 Book instantly', '🔐 Secure payment',
];

export function LandingPage() {
  usePageMeta({ title: 'Ticket Rush' });
  const { i18n } = useTranslation();
  const { data: featured } = useGetFeaturedEventsQuery();
  const onSaleEvents = featured?.data?.onSale ?? [];
  const featuredEvent = onSaleEvents[0];
  const isVi = i18n.language?.startsWith('vi');
  const marqueeItems = isVi ? MARQUEE_ITEMS_VI : MARQUEE_ITEMS_EN;

  return (
    <div>
      {/* 1. HERO — cinematic full viewport */}
      <ImmersiveHero featuredEvent={featuredEvent} />

      {/* 2. MARQUEE — infinite scroll ticker, creates energy + brand personality */}
      <div className="border-y border-border/50 bg-background py-3.5 overflow-hidden">
        <Marquee items={marqueeItems} speed={35} />
      </div>

      {/* 3. STATS — oversized animated numbers (social proof) */}
      <StatsSection />

      {/* 4. TRENDING — portrait cards with stagger animation */}
      <TrendingEvents />

      {/* 5. UPCOMING SALES — countdown cards horizontal scroll */}
      <UpcomingSales />

      {/* 6. HOW IT WORKS — 3-step bento card */}
      <HowItWorks />
    </div>
  );
}
