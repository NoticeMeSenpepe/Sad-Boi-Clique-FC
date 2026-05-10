-- =====================================================================
-- Migrate the prototype's 16 store items into Supabase.
-- Idempotent — only runs if the table is empty.
-- 'featured' = true on the items the prototype's homepage carousel
-- currently picks (so the carousel keeps the same look post-migration).
-- =====================================================================
do $body$
begin
  if (select count(*) from public.store_items) = 0 then
    insert into public.store_items
      (name, price, category, tag, panel_color, subtitle, images, sold_out, sort_order, featured)
    values
    -- KITS
    ('HOME SHIRT 25/26', 60, 'KITS', 'NEW DROP', '#E4002B',
     'Adult replica · Aura red, slim fit',
     array['/assets/store/home-shirt-front.jpg','/assets/store/home-shirt-angled.jpg','/assets/store/home-shirt-rear.jpg'],
     false, 10, true),

    ('AWAY SHIRT 25/26', 60, 'KITS', '', '#9b5de5',
     'Adult replica · Midnight purple',
     array['/assets/store/staff-shirt-front.jpg'],
     true, 20, false),

    ('THIRD SHIRT 25/26', 60, 'KITS', '', '#e9c46a',
     'Adult replica · European nights gold',
     array['/assets/store/staff-shirt-front.jpg'],
     true, 30, false),

    ('GK SHIRT 25/26', 55, 'KITS', '', '#2a9d8f',
     'Goalkeeper replica · Lewis #1',
     array['/assets/store/gk-shirt-front.jpg','/assets/store/gk-shirt-angled.jpg','/assets/store/gk-shirt-rear.jpg'],
     false, 40, true),

    ('JUNIOR HOME SHIRT', 45, 'KITS', '', '#E4002B',
     'Ages 7–13 · same kit, smaller imp',
     array['/assets/store/home-shirt-front.jpg','/assets/store/home-shirt-angled.jpg','/assets/store/home-shirt-rear.jpg'],
     false, 50, false),

    -- TRAINING
    ('TRAINING JACKET', 55, 'TRAINING', 'BACK IN STOCK', '#E4002B',
     'Quarter-zip · what the squad warms up in',
     array['/assets/store/jacket-front.jpg','/assets/store/jacket-angled.jpg','/assets/store/jacket-rear.jpg'],
     false, 60, true),

    ('TRAINING HOODIE', 45, 'TRAINING', '', '#2a9d8f',
     'Heavyweight · embroidered crest',
     array['/assets/store/hoodie-front.jpg','/assets/store/hoodie-angled.jpg','/assets/store/hoodie-rear.jpg'],
     false, 70, true),

    ('TRAINING TOP', 40, 'TRAINING', '', '#E4002B',
     'Match-day warmup · technical fabric',
     array['/assets/store/training-front.jpg','/assets/store/training-angled.jpg','/assets/store/training-rear.jpg'],
     false, 80, false),

    ('STAFF POLO', 35, 'TRAINING', '', '#9b5de5',
     'Bench-day fit · breathable mesh back',
     array['/assets/store/staff-shirt-front.jpg','/assets/store/staff-shirt-angled.jpg','/assets/store/staff-shirt-rear.jpg'],
     false, 90, true),

    ('TRAINING SHORTS', 28, 'TRAINING', '', '#9b5de5',
     'Same shorts the squad trains in',
     array['/assets/store/training-shorts.jpg','/assets/store/training-shorts-side.jpg'],
     false, 100, false),

    -- FAN GEAR
    ('PANIKOVA SCARF', 14, 'FAN GEAR', 'LIMITED', '#e9c46a',
     '"WHEN THE PANIC HITS" · 100% acrylic',
     array['/assets/store/panikova-scarf.jpg','/assets/store/panikova-scarf-close.jpg'],
     false, 110, true),

    ('BOBBLE HAT', 22, 'FAN GEAR', '', '#9b5de5',
     'Knit · embroidered imp · pom-pom included',
     array['/assets/store/bobble-hat-front.jpg','/assets/store/bobble-hat-rear.jpg'],
     false, 120, false),

    ('CLUB SOCKS', 12, 'FAN GEAR', '', '#2a9d8f',
     'Crew length · cotton blend · imp on the cuff',
     array['/assets/store/socks.jpg'],
     false, 130, false),

    ('AURA WALLET', 28, 'FAN GEAR', 'NEW', '#e9c46a',
     'Bifold · faux leather · debossed crest',
     array['/assets/store/wallet-front.jpg','/assets/store/wallet-open.jpg'],
     false, 140, false),

    ('AURA STABILITY MUG', 12, 'FAN GEAR', 'BESTSELLER', '#E4002B',
     'Reads at exactly 95°C · ceramic 11oz',
     array['/assets/store/aura-mug.jpg'],
     false, 150, false);
  end if;
end $body$;
