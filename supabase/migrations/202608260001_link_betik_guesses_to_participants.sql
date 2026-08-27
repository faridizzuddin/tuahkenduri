alter table public.betik_guesses add column participant_id uuid;

-- Backfill must also work if the host had already revealed the answer.
drop trigger if exists betik_guesses_only_while_open on public.betik_guesses;

-- Preserve early entries where the optional reference was the towel number.
update public.betik_guesses bg
set participant_id = p.id
from public.participants p
where bg.participant_id is null
  and lower(btrim(bg.entry_reference)) = lower(btrim(p.towel_number));

-- Preserve entries recorded using the suggested "Tuala 028" reference format.
update public.betik_guesses bg
set participant_id = p.id
from public.participants p
where bg.participant_id is null
  and substring(bg.entry_reference from '(?i)tuala[[:space:]]*([0-9]{1,3})') is not null
  and p.towel_number = lpad(
    ltrim(substring(bg.entry_reference from '(?i)tuala[[:space:]]*([0-9]{1,3})'), '0'),
    3,
    '0'
  );

-- A unique matching participant name is safe to use as a final backfill option.
update public.betik_guesses bg
set participant_id = (
  select p.id
  from public.participants p
  where lower(btrim(p.name)) = lower(btrim(bg.participant_name))
  limit 1
)
where bg.participant_id is null
  and (
    select count(*)
    from public.participants p
    where lower(btrim(p.name)) = lower(btrim(bg.participant_name))
  ) = 1;

do $$
begin
  if exists (select 1 from public.betik_guesses where participant_id is null) then
    raise exception 'Some existing Betik guesses could not be matched to registered participants';
  end if;
  if exists (
    select participant_id
    from public.betik_guesses
    group by participant_id
    having count(*) > 1
  ) then
    raise exception 'A registered participant has more than one existing Betik guess';
  end if;
end;
$$;

alter table public.betik_guesses
  alter column participant_id set not null,
  add constraint betik_guesses_participant_id_fkey
    foreign key (participant_id) references public.participants(id) on delete restrict,
  add constraint betik_guesses_one_per_participant unique (participant_id),
  drop column participant_name,
  drop column entry_reference;

create or replace function public.require_betik_game_open()
returns trigger language plpgsql security definer set search_path = '' as $$
declare answer integer; participant_status text;
begin
  perform public.require_authenticated();
  select actual_seed_count into answer from public.betik_game where id = 1 for key share;
  if answer is not null then
    raise exception 'Penyertaan telah ditutup. Buka semula permainan untuk mengubah rekod.';
  end if;

  if tg_op <> 'DELETE' then
    select status into participant_status
    from public.participants
    where id = new.participant_id
    for key share;
    if participant_status is null then raise exception 'Peserta tidak ditemui'; end if;
    if participant_status not in ('eligible', 'won') then
      raise exception 'Hanya peserta berdaftar yang layak atau telah menang boleh menyertai';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger betik_guesses_only_while_open
before insert or update or delete on public.betik_guesses
for each row execute function public.require_betik_game_open();

create or replace function public.reveal_betik_answer(p_actual_seed_count integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_authenticated();
  if p_actual_seed_count is null or p_actual_seed_count < 1 or p_actual_seed_count > 1000000 then
    raise exception 'Jumlah sebenar mestilah antara 1 hingga 1,000,000';
  end if;

  perform 1 from public.betik_game where id = 1 for update;
  if not exists (
    select 1
    from public.betik_guesses bg
    join public.participants p on p.id = bg.participant_id
    where p.status in ('eligible', 'won')
  ) then
    raise exception 'Belum ada penyertaan yang layak untuk dikira';
  end if;

  update public.betik_game
  set actual_seed_count = p_actual_seed_count, revealed_at = now()
  where id = 1 and actual_seed_count is null;
  if not found then raise exception 'Keputusan telah diumumkan'; end if;
end;
$$;
