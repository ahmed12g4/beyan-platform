-- Migration: Add brand colors to platform_settings
-- Allows the admin to customize the platform's primary and accent colors
-- Run this in Supabase SQL editor

alter table platform_settings
  add column if not exists brand_primary_color text default '#204544',
  add column if not exists brand_accent_color  text default '#FEDD59';

-- Set defaults for existing row
update platform_settings
  set brand_primary_color = '#204544',
      brand_accent_color  = '#FEDD59'
  where id = 1
    and (brand_primary_color is null or brand_accent_color is null);
