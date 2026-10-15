import { getCurrentUser } from '@/lib/auth';
import CommunityPageClient from './CommunityPageClient';

export const metadata = {
  title: 'Community',
  description: 'Discuss Xamcode product ideas and share feedback.',
};

export default async function CommunityPage() {
  const user = await getCurrentUser();
  return <CommunityPageClient signedIn={!!user} />;
}
