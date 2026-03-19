insert into storage.buckets (id, name, public) values ('showcase-videos', 'showcase-videos', true);

create policy "Public read access for showcase videos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'showcase-videos');

create policy "Authenticated upload to showcase videos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'showcase-videos');