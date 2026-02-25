create table profiles(
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text unique,
  avatar_url text,
  bio text,
  is_public boolean default false,
  updated_at timestamp with time zone,
  full_name text,
  show_full_name boolean default false
);

create table closet_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references profiles(id) on delete cascade not null,
  brand text not null,
  model text not null,
  size text,
  description text,
  purchase_price integer,
  image_url text
);


--permissionpolicies
alter table profiles enable row level security;
alter table closet_items enable row level security;

create policy "Public profiles are viewable by everyone." 
  on profiles for select using ( true );

create policy "Users can update own profile." 
  on profiles for update using ( auth.uid() = id );


create policy "View items (Own + Public Users)." 
  on closet_items for select 
  using ( 
    auth.uid() = user_id -- It's mine
    OR 
    exists ( -- OR it belongs to someone who is Public
      select 1 from profiles 
      where profiles.id = closet_items.user_id 
      and profiles.is_public = true 
    )
  );

create policy "Users can insert own items." on closet_items for insert with check (auth.uid() = user_id);
create policy "Users can update own items." on closet_items for update using (auth.uid() = user_id);
create policy "Users can delete own items." on closet_items for delete using (auth.uid() = user_id);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

