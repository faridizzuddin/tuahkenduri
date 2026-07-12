-- Supabase projects with pg-safeupdate reject UPDATE/DELETE statements that
-- do not include a WHERE clause. These predicates intentionally match every
-- row while preserving that protection for accidental unrestricted queries.

create or replace function public.reset_draw_data(p_confirmation text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_authenticated();
  if p_confirmation <> 'SET SEMULA CABUTAN' then raise exception 'Frasa pengesahan tidak tepat'; end if;
  delete from public.draw_results where id is not null;
  perform setval('public.draw_results_sequence_number_seq', 1, false);
  update public.participants set status = 'eligible' where status in ('won', 'absent');
  update public.gifts set status = 'available' where status = 'claimed';
end;
$$;

create or replace function public.clear_participants(p_confirmation text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_authenticated();
  if p_confirmation <> 'PADAM SEMUA PESERTA' then raise exception 'Frasa pengesahan tidak tepat'; end if;
  delete from public.draw_results where id is not null;
  perform setval('public.draw_results_sequence_number_seq', 1, false);
  delete from public.participants where id is not null;
  update public.gifts set status = 'available' where status = 'claimed';
end;
$$;

create or replace function public.clear_gifts(p_confirmation text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_authenticated();
  if p_confirmation <> 'PADAM SEMUA HADIAH' then raise exception 'Frasa pengesahan tidak tepat'; end if;
  delete from public.draw_results where id is not null;
  perform setval('public.draw_results_sequence_number_seq', 1, false);
  delete from public.gifts where id is not null;
  update public.participants set status = 'eligible' where status = 'won';
end;
$$;
