-- Migration: Add showcase columns to profiles table

ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "showcase_item_ids" uuid[] DEFAULT '{}'::uuid[];
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "favorite_brands" text[] DEFAULT '{}'::text[];
