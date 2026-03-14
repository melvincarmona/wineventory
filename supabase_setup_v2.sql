-- ============================================================
-- Cave à Vins – Datenbank Setup v2
-- Dieses SQL in Supabase unter: SQL Editor → New Query ausführen
-- ============================================================

-- 1. Weinkeller-Inventar
CREATE TABLE IF NOT EXISTS wines (
  id            bigint        PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name          text          NOT NULL,
  colour        text          NOT NULL DEFAULT 'red',
  year          integer,
  winery        text,
  country       text,
  region        text,
  grape         text,
  amount        integer       NOT NULL DEFAULT 1,
  "bestBetween" text,
  occasion      text          NOT NULL DEFAULT 'green',
  rationale     text,
  taste_notes   text,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

-- 2. Wunschliste
CREATE TABLE IF NOT EXISTS wishlist (
  id            bigint        PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name          text          NOT NULL,
  colour        text          DEFAULT 'red',
  year          integer,
  winery        text,
  country       text,
  region        text,
  grape         text,
  market_price  numeric,
  priority      text          NOT NULL DEFAULT 'medium',
  taste_notes   text,
  notes         text,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

-- Row Level Security aktivieren
ALTER TABLE wines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Zugriff erlauben (private App ohne Login)
CREATE POLICY "Public access wines"    ON wines    FOR ALL USING (true);
CREATE POLICY "Public access wishlist" ON wishlist FOR ALL USING (true);
