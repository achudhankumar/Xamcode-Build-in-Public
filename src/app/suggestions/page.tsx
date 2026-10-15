import { getCurrentUser } from '@/lib/auth';
import SuggestionsPageClient from './SuggestionsPageClient';

export const metadata = {
  title: 'Feature Suggestions',
  description: 'Submit ideas and vote on what matters most for Xamcode.',
};

export default async function SuggestionsPage() {
  const user = await getCurrentUser();
  return <SuggestionsPageClient signedIn={!!user} />;
}
