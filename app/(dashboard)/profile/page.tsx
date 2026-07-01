import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. Secure Server-Side Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // 2. Fetch user's profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url, bio, showcase_item_ids, favorite_brands')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return redirect('/error?message=Could not load profile')
  }

  // 3. Fetch user's closet and wishlist items (all)
  const { data: allItems } = await supabase
    .from('closet_items')
    .select('id, brand, model, image_url, category, purchase_price, created_at, is_wishlist')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-8 min-h-screen bg-white">
      <ProfileClient 
        profile={profile} 
        allItems={allItems || []} 
      />
    </div>
  )
}
