-- MyYard Townships Import Script
-- This script imports all South African townships, suburbs, and affordable areas

-- Create townships table if it doesn't exist
CREATE TABLE IF NOT EXISTS townships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  metro TEXT,
  region TEXT,
  search_text TEXT GENERATED ALWAYS AS (
    LOWER(name || ' ' || city || ' ' || province || ' ' || COALESCE(metro, '') || ' ' || COALESCE(region, ''))
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast searching
CREATE INDEX IF NOT EXISTS idx_townships_search ON townships USING gin(to_tsvector('english', search_text));
CREATE INDEX IF NOT EXISTS idx_townships_name ON townships(name);
CREATE INDEX IF NOT EXISTS idx_townships_city ON townships(city);
CREATE INDEX IF NOT EXISTS idx_townships_province ON townships(province);

-- Enable Row Level Security
ALTER TABLE townships ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Townships are publicly readable" ON townships
  FOR SELECT USING (true);

-- Clear existing data
TRUNCATE TABLE townships;

-- Import GAUTENG townships
INSERT INTO townships (name, city, metro, region, province) VALUES
-- Johannesburg - Soweto & Surrounds
('Diepkloof', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Diepkloof East', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Meadowlands', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Orlando East', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Orlando West', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Dobsonville', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Dobsonville Gardens', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Protea Glen', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Protea North', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Protea South', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Naledi', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Tladi', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Moletsane', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Jabulani', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Zola', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Zondi', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Emdeni', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Chiawelo', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Dhlamini', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Dube', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Mapetla', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Mofolo North', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Mofolo South', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Mofolo Central', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Moroka', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Pimville', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Klipspruit', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Kliptown', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Senoane', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Senaoane', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Phiri', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Jabavu', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('White City', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Central Western Jabavu', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Molapo', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Mmesi Park', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Braamfischerville', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Doornkop', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Thulani', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Devland', 'Johannesburg', 'City of Johannesburg', 'Soweto', 'Gauteng'),
('Eldorado Park', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Nancefield', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Power Park', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Bushkoppies', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),

-- South of Johannesburg
('Lenasia', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Lenasia South', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Lenasia Extension', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Ennerdale', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Lawley', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Orange Farm', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Stretford', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Finetown', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Weilers Farm', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Vlakfontein', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Drieziek', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Lakeside', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Kanana Park', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Grasmere', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Naturena', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),

-- North of Johannesburg
('Alexandra', 'Johannesburg', 'City of Johannesburg', 'North', 'Gauteng'),
('Ivory Park', 'Johannesburg', 'City of Johannesburg', 'North', 'Gauteng'),
('Diepsloot', 'Johannesburg', 'City of Johannesburg', 'North', 'Gauteng'),
('Cosmo City', 'Johannesburg', 'City of Johannesburg', 'North', 'Gauteng'),
('Zandspruit', 'Johannesburg', 'City of Johannesburg', 'North', 'Gauteng'),
('Kya Sand', 'Johannesburg', 'City of Johannesburg', 'North', 'Gauteng'),
('Rabie Ridge', 'Johannesburg', 'City of Johannesburg', 'North', 'Gauteng'),
('Olivenhoutbosch', 'Johannesburg', 'City of Johannesburg', 'North', 'Gauteng'),

-- West/Central Johannesburg
('Riverlea', 'Johannesburg', 'City of Johannesburg', 'West', 'Gauteng'),
('Westbury', 'Johannesburg', 'City of Johannesburg', 'West', 'Gauteng'),
('Newclare', 'Johannesburg', 'City of Johannesburg', 'Central', 'Gauteng'),
('Coronationville', 'Johannesburg', 'City of Johannesburg', 'West', 'Gauteng'),
('Brixton', 'Johannesburg', 'City of Johannesburg', 'West', 'Gauteng'),
('Bertrams', 'Johannesburg', 'City of Johannesburg', 'Central', 'Gauteng'),
('Judith''s Paarl', 'Johannesburg', 'City of Johannesburg', 'Central', 'Gauteng'),
('Troyeville', 'Johannesburg', 'City of Johannesburg', 'Central', 'Gauteng'),
('Jeppestown', 'Johannesburg', 'City of Johannesburg', 'Central', 'Gauteng'),
('Hillbrow', 'Johannesburg', 'City of Johannesburg', 'Central', 'Gauteng'),
('Berea', 'Johannesburg', 'City of Johannesburg', 'Central', 'Gauteng'),
('Yeoville', 'Johannesburg', 'City of Johannesburg', 'Central', 'Gauteng'),
('Bellevue', 'Johannesburg', 'City of Johannesburg', 'Central', 'Gauteng'),
('Rosettenville', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('La Rochelle', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Turffontein', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Booysens', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Regents Park', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('Townsview', 'Johannesburg', 'City of Johannesburg', 'South', 'Gauteng'),
('The Hill', 'Johannesburg', 'City of Johannesburg', 'West', 'Gauteng'),
('Fleurhof', 'Johannesburg', 'City of Johannesburg', 'West', 'Gauteng'),
('Westdene', 'Johannesburg', 'City of Johannesburg', 'West', 'Gauteng'),
('Auckland Park', 'Johannesburg', 'City of Johannesburg', 'West', 'Gauteng'),
('Sophiatown', 'Johannesburg', 'City of Johannesburg', 'West', 'Gauteng');

-- EKURHULENI (East Rand)
INSERT INTO townships (name, city, metro, region, province) VALUES
('Tembisa', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Katlehong', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Thokoza', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Vosloorus', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Daveyton', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Etwatwa', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Duduza', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('KwaThema', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Tsakane', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Wattville', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Palm Ridge', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Eden Park', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Reiger Park', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Ramaphosa', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Geluksdal', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Windmill Park', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Zonkizizwe', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Tokoza', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Phola Park', 'Ekurhuleni', 'Ekurhuleni Metro', 'East Rand', 'Gauteng'),
('Ratanda', 'Heidelberg', 'Sedibeng', 'South', 'Gauteng');

-- TSHWANE / PRETORIA
INSERT INTO townships (name, city, metro, region, province) VALUES
('Mamelodi East', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Mamelodi West', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Atteridgeville', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Saulsville', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Soshanguve', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('GaRankuwa', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Mabopane', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Winterveld', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Hammanskraal', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Temba', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Eersterust', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Nellmapius', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Olievenhoutbosch', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Lotus Gardens', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng'),
('Laudium', 'Pretoria', 'City of Tshwane', 'Tshwane', 'Gauteng');

-- WESTERN CAPE
INSERT INTO townships (name, city, metro, region, province) VALUES
('Khayelitsha', 'Cape Town', 'City of Cape Town', 'Cape Flats', 'Western Cape'),
('Mitchells Plain', 'Cape Town', 'City of Cape Town', 'Cape Flats', 'Western Cape'),
('Gugulethu', 'Cape Town', 'City of Cape Town', 'Cape Flats', 'Western Cape'),
('Nyanga', 'Cape Town', 'City of Cape Town', 'Cape Flats', 'Western Cape'),
('Crossroads', 'Cape Town', 'City of Cape Town', 'Cape Flats', 'Western Cape'),
('Philippi', 'Cape Town', 'City of Cape Town', 'Cape Flats', 'Western Cape'),
('Delft', 'Cape Town', 'City of Cape Town', 'Northern Suburbs', 'Western Cape'),
('Langa', 'Cape Town', 'City of Cape Town', 'Cape Flats', 'Western Cape'),
('Manenberg', 'Cape Town', 'City of Cape Town', 'Cape Flats', 'Western Cape'),
('Hanover Park', 'Cape Town', 'City of Cape Town', 'Cape Flats', 'Western Cape'),
('Atlantis', 'Cape Town', 'City of Cape Town', 'West Coast', 'Western Cape'),
('Kayamandi', 'Stellenbosch', NULL, 'Winelands', 'Western Cape'),
('Mbekweni', 'Paarl', NULL, 'Winelands', 'Western Cape'),
('Zwelethemba', 'Worcester', NULL, 'Breede Valley', 'Western Cape'),
('Thembalethu', 'George', NULL, 'Garden Route', 'Western Cape');

-- KWAZULU-NATAL
INSERT INTO townships (name, city, metro, region, province) VALUES
('Umlazi', 'Durban', 'eThekwini Metro', 'Durban', 'KwaZulu-Natal'),
('KwaMashu', 'Durban', 'eThekwini Metro', 'Durban', 'KwaZulu-Natal'),
('Inanda', 'Durban', 'eThekwini Metro', 'Durban', 'KwaZulu-Natal'),
('Clermont', 'Durban', 'eThekwini Metro', 'Durban', 'KwaZulu-Natal'),
('KwaDabeka', 'Durban', 'eThekwini Metro', 'Durban', 'KwaZulu-Natal'),
('Chatsworth', 'Durban', 'eThekwini Metro', 'Durban', 'KwaZulu-Natal'),
('Phoenix', 'Durban', 'eThekwini Metro', 'Durban', 'KwaZulu-Natal'),
('Edendale', 'Pietermaritzburg', 'Msunduzi', 'PMB', 'KwaZulu-Natal'),
('Imbali', 'Pietermaritzburg', 'Msunduzi', 'PMB', 'KwaZulu-Natal'),
('Madadeni', 'Newcastle', NULL, 'Newcastle', 'KwaZulu-Natal'),
('eSikhaleni', 'Richards Bay', 'uMhlathuze', 'Richards Bay', 'KwaZulu-Natal');

-- Add more provinces as needed...
-- Continue with more township inserts following the same pattern

-- Create a function to search townships
CREATE OR REPLACE FUNCTION search_townships(search_query TEXT, limit_count INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  province TEXT,
  metro TEXT,
  region TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.city,
    t.province,
    t.metro,
    t.region,
    ts_rank(to_tsvector('english', t.search_text), plainto_tsquery('english', search_query)) as relevance
  FROM townships t
  WHERE to_tsvector('english', t.search_text) @@ plainto_tsquery('english', search_query)
     OR t.name ILIKE '%' || search_query || '%'
     OR t.city ILIKE '%' || search_query || '%'
  ORDER BY relevance DESC, t.name ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
