import type { ComponentType } from 'react';
import HomeView, { type ViewProps } from '@/components/views/home';
import HowItWorksView from '@/components/views/how-it-works';
import TiersView from '@/components/views/tiers';
import RewardsView from '@/components/views/rewards';
import FaqView from '@/components/views/faq';
import BrandsView from '@/components/views/brands';
import BusinessView from '@/components/views/business';
import { LoyaltyView, InsightsView, MediaView } from '@/components/views/business-pillar';
import BusinessAboutView from '@/components/views/business-about';
import BusinessContactView from '@/components/views/business-contact';

/** Which view draws each CMS page. 'site' has no page of its own, so it previews on the home page. */
export const VIEWS: Record<string, ComponentType<ViewProps>> = {
  site: HomeView, home: HomeView, 'how-it-works': HowItWorksView, tiers: TiersView, rewards: RewardsView, faq: FaqView, brands: BrandsView,
  business: BusinessView, 'business-loyalty': LoyaltyView, 'business-insights': InsightsView, 'business-media': MediaView, 'business-about': BusinessAboutView, 'business-contact': BusinessContactView,
};
