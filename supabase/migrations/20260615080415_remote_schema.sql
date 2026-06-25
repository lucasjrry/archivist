create extension if not exists "vector" with schema "public";

drop policy "Users can delete own items." on "public"."closet_items";

drop policy "Users can insert own items." on "public"."closet_items";

drop policy "Users can update own items." on "public"."closet_items";


  create table "public"."brands" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "name" text not null,
    "slug" text not null,
    "logo_url" text,
    "bio" text,
    "country" text,
    "founded_year" integer,
    "website_url" text,
    "price_tier" text,
    "is_verified" boolean default false
      );


alter table "public"."brands" enable row level security;


  create table "public"."canonical_items" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "brand_id" uuid not null,
    "name" text not null,
    "style_code" text,
    "season" text,
    "release_year" integer,
    "original_retail_price" integer,
    "category" text not null default 'Tops'::text,
    "status" text not null default 'pending'::text,
    "embedding" public.vector(1536)
      );


alter table "public"."canonical_items" enable row level security;

alter table "public"."closet_items" add column "canonical_item_id" uuid;

alter table "public"."closet_items" add column "is_custom_entry" boolean default false;

CREATE UNIQUE INDEX brands_name_key ON public.brands USING btree (name);

CREATE UNIQUE INDEX brands_pkey ON public.brands USING btree (id);

CREATE UNIQUE INDEX brands_slug_key ON public.brands USING btree (slug);

CREATE INDEX canonical_items_brand_id_idx ON public.canonical_items USING btree (brand_id);

CREATE UNIQUE INDEX canonical_items_pkey ON public.canonical_items USING btree (id);

CREATE INDEX canonical_items_style_code_idx ON public.canonical_items USING btree (style_code);

CREATE INDEX closet_items_canonical_item_id_idx ON public.closet_items USING btree (canonical_item_id);

alter table "public"."brands" add constraint "brands_pkey" PRIMARY KEY using index "brands_pkey";

alter table "public"."canonical_items" add constraint "canonical_items_pkey" PRIMARY KEY using index "canonical_items_pkey";

alter table "public"."brands" add constraint "brands_name_key" UNIQUE using index "brands_name_key";

alter table "public"."brands" add constraint "brands_price_tier_check" CHECK ((price_tier = ANY (ARRAY['$'::text, '$$'::text, '$$$'::text, '$$$$'::text]))) not valid;

alter table "public"."brands" validate constraint "brands_price_tier_check";

alter table "public"."brands" add constraint "brands_slug_key" UNIQUE using index "brands_slug_key";

alter table "public"."canonical_items" add constraint "canonical_items_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE not valid;

alter table "public"."canonical_items" validate constraint "canonical_items_brand_id_fkey";

alter table "public"."canonical_items" add constraint "canonical_items_category_check" CHECK ((category = ANY (ARRAY['Outerwear'::text, 'Tops'::text, 'Bottoms'::text, 'Footwear'::text, 'Accessories'::text, 'Headwear'::text, 'Other'::text]))) not valid;

alter table "public"."canonical_items" validate constraint "canonical_items_category_check";

alter table "public"."closet_items" add constraint "closet_items_canonical_item_id_fkey" FOREIGN KEY (canonical_item_id) REFERENCES public.canonical_items(id) ON DELETE SET NULL not valid;

alter table "public"."closet_items" validate constraint "closet_items_canonical_item_id_fkey";

grant delete on table "public"."brands" to "anon";

grant insert on table "public"."brands" to "anon";

grant references on table "public"."brands" to "anon";

grant select on table "public"."brands" to "anon";

grant trigger on table "public"."brands" to "anon";

grant truncate on table "public"."brands" to "anon";

grant update on table "public"."brands" to "anon";

grant delete on table "public"."brands" to "authenticated";

grant insert on table "public"."brands" to "authenticated";

grant references on table "public"."brands" to "authenticated";

grant select on table "public"."brands" to "authenticated";

grant trigger on table "public"."brands" to "authenticated";

grant truncate on table "public"."brands" to "authenticated";

grant update on table "public"."brands" to "authenticated";

grant delete on table "public"."brands" to "service_role";

grant insert on table "public"."brands" to "service_role";

grant references on table "public"."brands" to "service_role";

grant select on table "public"."brands" to "service_role";

grant trigger on table "public"."brands" to "service_role";

grant truncate on table "public"."brands" to "service_role";

grant update on table "public"."brands" to "service_role";

grant delete on table "public"."canonical_items" to "anon";

grant insert on table "public"."canonical_items" to "anon";

grant references on table "public"."canonical_items" to "anon";

grant select on table "public"."canonical_items" to "anon";

grant trigger on table "public"."canonical_items" to "anon";

grant truncate on table "public"."canonical_items" to "anon";

grant update on table "public"."canonical_items" to "anon";

grant delete on table "public"."canonical_items" to "authenticated";

grant insert on table "public"."canonical_items" to "authenticated";

grant references on table "public"."canonical_items" to "authenticated";

grant select on table "public"."canonical_items" to "authenticated";

grant trigger on table "public"."canonical_items" to "authenticated";

grant truncate on table "public"."canonical_items" to "authenticated";

grant update on table "public"."canonical_items" to "authenticated";

grant delete on table "public"."canonical_items" to "service_role";

grant insert on table "public"."canonical_items" to "service_role";

grant references on table "public"."canonical_items" to "service_role";

grant select on table "public"."canonical_items" to "service_role";

grant trigger on table "public"."canonical_items" to "service_role";

grant truncate on table "public"."canonical_items" to "service_role";

grant update on table "public"."canonical_items" to "service_role";


  create policy "Authenticated users can suggest brands."
  on "public"."brands"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Brands are viewable by everyone."
  on "public"."brands"
  as permissive
  for select
  to public
using (true);



  create policy "System can modify brands."
  on "public"."brands"
  as permissive
  for all
  to service_role
using (true);



  create policy "Authenticated users can suggest canonical items."
  on "public"."canonical_items"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Canonical items are viewable by everyone."
  on "public"."canonical_items"
  as permissive
  for select
  to public
using (true);



  create policy "System can modify canonical items."
  on "public"."canonical_items"
  as permissive
  for all
  to service_role
using (true);



  create policy "Users can delete own items."
  on "public"."closet_items"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert own items."
  on "public"."closet_items"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can update own items."
  on "public"."closet_items"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id));



  create policy "closet_upload_policy"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'closet'::text));



  create policy "closet_view_policy"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'closet'::text));



