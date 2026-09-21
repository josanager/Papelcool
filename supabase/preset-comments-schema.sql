create extension if not exists pgcrypto;

create table if not exists public.preset_comments (
    id uuid primary key default gen_random_uuid(),
    preset_slug text not null,
    parent_id uuid null references public.preset_comments(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    body text not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint preset_comments_body_length check (char_length(trim(body)) between 1 and 500)
);

create index if not exists preset_comments_preset_slug_created_at_idx
    on public.preset_comments (preset_slug, created_at desc);

create index if not exists preset_comments_parent_id_idx
    on public.preset_comments (parent_id);

create table if not exists public.preset_comment_likes (
    comment_id uuid not null references public.preset_comments(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default timezone('utc', now()),
    primary key (comment_id, user_id)
);

create index if not exists preset_comment_likes_user_id_idx
    on public.preset_comment_likes (user_id, created_at desc);

create or replace function public.touch_preset_comment_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists preset_comments_set_updated_at on public.preset_comments;
create trigger preset_comments_set_updated_at
before update on public.preset_comments
for each row
execute function public.touch_preset_comment_updated_at();

alter table public.preset_comments enable row level security;
alter table public.preset_comment_likes enable row level security;

drop policy if exists "preset comments are publicly readable" on public.preset_comments;
create policy "preset comments are publicly readable"
on public.preset_comments
for select
to anon, authenticated
using (true);

drop policy if exists "authenticated users can insert their own preset comments" on public.preset_comments;
create policy "authenticated users can insert their own preset comments"
on public.preset_comments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "comment owners can update their own preset comments" on public.preset_comments;
create policy "comment owners can update their own preset comments"
on public.preset_comments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "comment owners can delete their own preset comments" on public.preset_comments;
create policy "comment owners can delete their own preset comments"
on public.preset_comments
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "preset comment likes are publicly readable" on public.preset_comment_likes;
create policy "preset comment likes are publicly readable"
on public.preset_comment_likes
for select
to anon, authenticated
using (true);

drop policy if exists "authenticated users can like preset comments" on public.preset_comment_likes;
create policy "authenticated users can like preset comments"
on public.preset_comment_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "authenticated users can unlike their own preset comment likes" on public.preset_comment_likes;
create policy "authenticated users can unlike their own preset comment likes"
on public.preset_comment_likes
for delete
to authenticated
using (auth.uid() = user_id);
