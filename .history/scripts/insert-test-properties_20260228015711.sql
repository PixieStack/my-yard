-- Test Data for MyYard Properties
-- This script adds sample properties for browsing and testing

-- Insert test landlord (you'll need to create this user first)
-- For now, we'll use a static UUID

INSERT INTO properties (
  title, 
  description, 
  address, 
  location,
  township,
  township_id,
  property_type, 
  status, 
  bedrooms, 
  bathrooms, 
  size_sqm, 
  price_per_month, 
  deposit_amount,
  verified,
  landlord_id,
  is_active
) VALUES
-- Soweto Properties
(
  'Spacious Room in Soweto',
  'Beautiful, fully furnished room in the heart of Soweto. Modern amenities, secure building, perfect for working professionals.',
  '123 Mandela Street, Soweto',
  'Soweto',
  'Soweto',
  (SELECT id FROM townships WHERE name = 'Soweto' LIMIT 1),
  'room',
  'available',
  1,
  1,
  25,
  2500,
  2500,
  true,
  '00000000-0000-0000-0000-000000000001',
  true
),
(
  'Modern Bachelor Flat',
  'Stunning 1-bedroom bachelor apartment with open plan living area. Newly renovated kitchen and bathroom.',
  '456 Peace Avenue, Soweto',
  'Soweto',
  'Soweto',
  (SELECT id FROM townships WHERE name = 'Soweto' LIMIT 1),
  'bachelor',
  'available',
  1,
  1,
  35,
  4500,
  4500,
  true,
  '00000000-0000-0000-0000-000000000001',
  true
),
(
  'Cozy Cottage in Soweto',
  'Quaint 2-bedroom cottage with garden. Quiet neighborhood, pet-friendly, water and electricity included.',
  '789 Unity Road, Soweto',
  'Soweto',
  'Soweto',
  (SELECT id FROM townships WHERE name = 'Soweto' LIMIT 1),
  'cottage',
  'available',
  2,
  1,
  55,
  5500,
  5500,
  true,
  '00000000-0000-0000-0000-000000000001',
  true
),

-- Sandton Properties
(
  'Luxury Room in Sandton',
  'Premium furnished room with en-suite bathroom. Air conditioning, high-speed WiFi, secure parking included.',
  '321 Business Street, Sandton',
  'Sandton',
  'Sandton',
  (SELECT id FROM townships WHERE name = 'Sandton' LIMIT 1),
  'room',
  'available',
  1,
  1,
  30,
  4000,
  4000,
  true,
  '00000000-0000-0000-0000-000000000002',
  true
),
(
  'Executive Bachelor Apartment',
  'Upscale bachelor in prime Sandton location. Close to shopping malls and business district. Furnished.',
  '654 Corporate Lane, Sandton',
  'Sandton',
  'Sandton',
  (SELECT id FROM townships WHERE name = 'Sandton' LIMIT 1),
  'bachelor',
  'available',
  1,
  1,
  45,
  6500,
  6500,
  true,
  '00000000-0000-0000-0000-000000000002',
  true
),

-- Pretoria Properties
(
  'Neat Room in Pretoria',
  'Comfortable room in student-friendly area. Close to universities and shopping centers. Shared facilities.',
  '111 Education Avenue, Pretoria',
  'Pretoria',
  'Pretoria',
  (SELECT id FROM townships WHERE name = 'Pretoria' LIMIT 1),
  'room',
  'available',
  1,
  1,
  20,
  2000,
  2000,
  false,
  '00000000-0000-0000-0000-000000000003',
  true
),
(
  'Student Bachelor Flat',
  'Perfect for students. Single bedroom, kitchenette, bathroom. Affordable rent, secure premises.',
  '222 Campus Road, Pretoria',
  'Pretoria',
  'Pretoria',
  (SELECT id FROM townships WHERE name = 'Pretoria' LIMIT 1),
  'bachelor',
  'available',
  1,
  1,
  32,
  3200,
  3200,
  false,
  '00000000-0000-0000-0000-000000000003',
  true
),

-- Randburg Properties
(
  'Modern Room in Randburg',
  'Stylish furnished room in contemporary townhouse. Security complex, gym access, parking.',
  '333 Modern Street, Randburg',
  'Randburg',
  'Randburg',
  (SELECT id FROM townships WHERE name = 'Randburg' LIMIT 1),
  'room',
  'available',
  1,
  1,
  28,
  3500,
  3500,
  true,
  '00000000-0000-0000-0000-000000000004',
  true
),
(
  'Bright Bachelor Apartment',
  '1-bedroom with lots of natural light. Modern finishes, balcony with views, secure building.',
  '444 Sunshine Boulevard, Randburg',
  'Randburg',
  'Randburg',
  (SELECT id FROM townships WHERE name = 'Randburg' LIMIT 1),
  'bachelor',
  'available',
  1,
  1,
  40,
  5000,
  5000,
  true,
  '00000000-0000-0000-0000-000000000004',
  true
),
(
  'Family Cottage in Randburg',
  '2-bedroom, 2-bathroom cottage. Fully equipped kitchen, laundry room, garden. Family-friendly.',
  '555 Family Lane, Randburg',
  'Randburg',
  'Randburg',
  (SELECT id FROM townships WHERE name = 'Randburg' LIMIT 1),
  'cottage',
  'available',
  2,
  2,
  65,
  6500,
  6500,
  true,
  '00000000-0000-0000-0000-000000000004',
  true
),

-- Fourways Properties
(
  'Upmarket Room in Fourways',
  'Premium room in exclusive residential area. Furnished, air-conditioned, private entrance.',
  '666 Luxury Close, Fourways',
  'Fourways',
  'Fourways',
  (SELECT id FROM townships WHERE name = 'Fourways' LIMIT 1),
  'room',
  'available',
  1,
  1,
  32,
  4500,
  4500,
  true,
  '00000000-0000-0000-0000-000000000005',
  true
),
(
  'Elegant Bachelor in Fourways',
  'Sophisticated 1-bedroom bachelor. Premium finishes, modern appliances, covered parking.',
  '777 Prestige Road, Fourways',
  'Fourways',
  'Fourways',
  (SELECT id FROM townships WHERE name = 'Fourways' LIMIT 1),
  'bachelor',
  'available',
  1,
  1,
  48,
  7000,
  7000,
  true,
  '00000000-0000-0000-0000-000000000005',
  true
);

-- Add property images for the first few properties
INSERT INTO property_images (property_id, image_url, is_primary, display_order) VALUES
(
  (SELECT id FROM properties WHERE title = 'Spacious Room in Soweto' LIMIT 1),
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop',
  true,
  1
),
(
  (SELECT id FROM properties WHERE title = 'Modern Bachelor Flat' LIMIT 1),
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=400&fit=crop',
  true,
  1
),
(
  (SELECT id FROM properties WHERE title = 'Cozy Cottage in Soweto' LIMIT 1),
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=400&fit=crop',
  true,
  1
),
(
  (SELECT id FROM properties WHERE title = 'Luxury Room in Sandton' LIMIT 1),
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=400&fit=crop',
  true,
  1
),
(
  (SELECT id FROM properties WHERE title = 'Executive Bachelor Apartment' LIMIT 1),
  'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=500&h=400&fit=crop',
  true,
  1
),
(
  (SELECT id FROM properties WHERE title = 'Neat Room in Pretoria' LIMIT 1),
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=500&h=400&fit=crop',
  true,
  1
),
(
  (SELECT id FROM properties WHERE title = 'Student Bachelor Flat' LIMIT 1),
  'https://images.unsplash.com/photo-1503052431253-362f2fc300d3?w=500&h=400&fit=crop',
  true,
  1
),
(
  (SELECT id FROM properties WHERE title = 'Modern Room in Randburg' LIMIT 1),
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=400&fit=crop',
  true,
  1
),
(
  (SELECT id FROM properties WHERE title = 'Bright Bachelor Apartment' LIMIT 1),
  'https://images.unsplash.com/photo-1515562141207-6811bcb33efb?w=500&h=400&fit=crop',
  true,
  1
),
(
  (SELECT id FROM properties WHERE title = 'Family Cottage in Randburg' LIMIT 1),
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=400&fit=crop',
  true,
  1
);
