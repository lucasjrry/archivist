drop extension if exists "pg_net";


  create table "public"."closet_items" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "user_id" uuid not null,
    "brand" text not null,
    "model" text not null,
    "size" text,
    "description" text,
    "purchase_price" integer,
    "image_url" text,
    "category" text not null default 'Tops'::text,
    "color" text,
    "acquisition_date" date
      );


alter table "public"."closet_items" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "username" text,
    "avatar_url" text,
    "bio" text,
    "is_public" boolean default false,
    "updated_at" timestamp with time zone,
    "full_name" text,
    "show_full_name" boolean default false
      );


alter table "public"."profiles" enable row level security;

CREATE UNIQUE INDEX closet_items_pkey ON public.closet_items USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

alter table "public"."closet_items" add constraint "closet_items_pkey" PRIMARY KEY using index "closet_items_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."closet_items" add constraint "closet_items_category_check" CHECK ((category = ANY (ARRAY['Outerwear'::text, 'Tops'::text, 'Bottoms'::text, 'Footwear'::text, 'Accessories'::text, 'Headwear'::text, 'Other'::text]))) not valid;

alter table "public"."closet_items" validate constraint "closet_items_category_check";

alter table "public"."closet_items" add constraint "closet_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."closet_items" validate constraint "closet_items_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$function$
;

grant delete on table "public"."closet_items" to "anon";

grant insert on table "public"."closet_items" to "anon";

grant references on table "public"."closet_items" to "anon";

grant select on table "public"."closet_items" to "anon";

grant trigger on table "public"."closet_items" to "anon";

grant truncate on table "public"."closet_items" to "anon";

grant update on table "public"."closet_items" to "anon";

grant delete on table "public"."closet_items" to "authenticated";

grant insert on table "public"."closet_items" to "authenticated";

grant references on table "public"."closet_items" to "authenticated";

grant select on table "public"."closet_items" to "authenticated";

grant trigger on table "public"."closet_items" to "authenticated";

grant truncate on table "public"."closet_items" to "authenticated";

grant update on table "public"."closet_items" to "authenticated";

grant delete on table "public"."closet_items" to "service_role";

grant insert on table "public"."closet_items" to "service_role";

grant references on table "public"."closet_items" to "service_role";

grant select on table "public"."closet_items" to "service_role";

grant trigger on table "public"."closet_items" to "service_role";

grant truncate on table "public"."closet_items" to "service_role";

grant update on table "public"."closet_items" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";


  create policy "Users can delete own items."
  on "public"."closet_items"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own items."
  on "public"."closet_items"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own items."
  on "public"."closet_items"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "View items (Own + Public Users)."
  on "public"."closet_items"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = closet_items.user_id) AND (profiles.is_public = true))))));



  create policy "Public profiles are viewable by everyone."
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Users can update own profile."
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


