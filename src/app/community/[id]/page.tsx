import { getCurrentUser } from '@/lib/auth';
import DiscussionDetailClient from './DiscussionDetailClient';

export const metadata = {
  title: 'Discussion',
  description: 'A community discussion thread.',
};

export default async function DiscussionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  return <DiscussionDetailClient id={id} signedIn={!!user} />;
}
