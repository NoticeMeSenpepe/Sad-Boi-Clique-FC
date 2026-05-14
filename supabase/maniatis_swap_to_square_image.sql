-- =====================================================================
-- Swap the Maniatis news + transfer image to the dedicated square crop.
-- =====================================================================
-- Run once in Supabase Dashboard → SQL Editor.
--
-- The original migration pointed both the news article and the transfer
-- record at /uploads/maniatis.png — the tall portrait player card. For
-- the homepage headline image and news hero we want the dedicated
-- square crop (/uploads/maniatis-square.png) so the photo composes
-- correctly. The portrait stays as the player's profile/spotlight
-- graphic on the squad page.
-- =====================================================================

update public.news_articles
   set image_url = '/uploads/maniatis-square.png',
       updated_at = now()
 where headline = 'HERE WE GO — MANIATIS JOINS THE CLIQUE FROM A SHED IN LINCOLNSHIRE'
   and image_url = '/uploads/maniatis.png';

update public.transfers
   set image_url = '/uploads/maniatis-square.png',
       updated_at = now()
 where player = 'Dimitris Maniatis'
   and image_url = '/uploads/maniatis.png';
