import { getCurrentUser } from '@/lib/auth';
import RolesAdmin from './RolesAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminRolesPage() {
  const user = await getCurrentUser();
  return <RolesAdmin myUserId={user?.id ?? ''} />;
}
