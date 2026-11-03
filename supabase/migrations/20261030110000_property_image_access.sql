-- Prepared locally; requires deployment to the confirmed Supabase project.
create or replace function public.can_manage_property_images(agency_folder text)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.agency_memberships m
 where m.user_id=(select auth.uid()) and m.active and m.agency_id::text=agency_folder);
$$;
revoke all on function public.can_manage_property_images(text) from public,anon;
grant execute on function public.can_manage_property_images(text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('property-images','property-images',true,5242880,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy property_images_insert on storage.objects for insert to authenticated
 with check(bucket_id='property-images' and public.can_manage_property_images(split_part(name,'/',1)));
create policy property_images_select on storage.objects for select to authenticated
 using(bucket_id='property-images' and public.can_manage_property_images(split_part(name,'/',1)));
create policy property_images_delete on storage.objects for delete to authenticated
 using(bucket_id='property-images' and public.can_manage_property_images(split_part(name,'/',1)));
