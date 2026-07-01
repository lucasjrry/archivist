import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import PrivateDashboard from '@/components/PrivateDashboard';

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Parallel fetch: Profile and Wishlist Items at the same time
  const [profileRes, itemsRes] = await Promise.all([
    supabase.from('profiles').select('username, full_name, bio, avatar_url').eq('id', user.id).single(),
    supabase.from('closet_items').select('*').eq('user_id', user.id).eq('is_wishlist', true).order('created_at', { ascending: false })
  ]);

  const displayName = profileRes.data?.full_name || profileRes.data?.username || "Curator";

  return (
    <PrivateDashboard
      displayName={displayName}
      username={profileRes.data?.username || ""}
      avatarUrl={profileRes.data?.avatar_url}
      bio={profileRes.data?.bio}
      items={itemsRes.data || []}
      mode="wishlist"
    />
  );
}
