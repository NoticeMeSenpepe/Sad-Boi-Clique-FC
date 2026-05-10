-- =====================================================================
-- Migrate the prototype's 3 transfers into Supabase.
-- Idempotent — only inserts if the table is currently empty.
-- =====================================================================
do $body$
begin
  if (select count(*) from public.transfers) = 0 then
    insert into public.transfers
      (player, club, fee, status_label, panel_color, detail, image_url, happened_at)
    values
    ('UNKNOWN SIGNING', 'CLASSIFIED FC', 'UNDISCLOSED', 'HERE WE GO ✓', '#2a9d8f',
     $$Multiple sources confirm agreement in principle. Medicals booked. Nanna Tate personally approved the move. HERE WE GO.$$,
     null, now() - interval '2 hours'),

    ('GYMSKIN', 'SAD BOI CLIQUE FC', 'LOYALTY', 'CONTRACT EXTENDED', '#9b5de5',
     $$Contract extension signed. New terms include guaranteed coffee at 95 degrees before every match. Non-negotiable clause.$$,
     '/uploads/pasted-1777416552965-0.png', now() - interval '3 days'),

    ('PANIKOVA', 'SAD BOI CLIQUE FC', 'N/A', 'DEVELOPING STORY', '#E4002B',
     $$Several unnamed clubs have enquired. Panikova reportedly saw signs in a potted cactus. Investigation ongoing.$$,
     '/uploads/pasted-1777415983890-0.png', now() - interval '5 days');
  end if;
end $body$;
