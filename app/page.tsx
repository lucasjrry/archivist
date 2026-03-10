import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import PublicLanding from '@/components/PublicLanding';

export default async function Index() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, send them straight to the closet
  if (user) {
    redirect('/closet');
  }

  // If not logged in, show the landing page
  return <PublicLanding />;
}
