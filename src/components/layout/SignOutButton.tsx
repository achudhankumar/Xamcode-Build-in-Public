'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-md border border-[#27272a] px-3 py-1.5 text-sm text-[#a1a1aa] transition-colors hover:text-[#fafafa]"
    >
      Sign out
    </button>
  );
}
