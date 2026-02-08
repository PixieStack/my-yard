-- Insert South African Locations (Townships, Suburbs, CBDs)
-- Run this after complete-setup.sql

-- GAUTENG PROVINCE

-- Johannesburg - CBD & Inner City
INSERT INTO townships (name, city, province, type) VALUES
('Johannesburg CBD', 'Johannesburg', 'Gauteng', 'cbd'),
('Braamfontein', 'Johannesburg', 'Gauteng', 'suburb'),
('Newtown', 'Johannesburg', 'Gauteng', 'suburb'),
('Maboneng', 'Johannesburg', 'Gauteng', 'suburb'),
('Marshalltown', 'Johannesburg', 'Gauteng', 'cbd'),
('Hillbrow', 'Johannesburg', 'Gauteng', 'suburb'),
('Yeoville', 'Johannesburg', 'Gauteng', 'suburb'),
('Berea', 'Johannesburg', 'Gauteng', 'suburb'),
('Doornfontein', 'Johannesburg', 'Gauteng', 'suburb'),
('Ennerdale', 'Johannesburg', 'Gauteng', 'suburb'),
('Finetown', 'Johannesburg', 'Gauteng', 'suburb')
ON CONFLICT (name, city, province) DO NOTHING;

-- Johannesburg - South (Soweto & Surrounding)
INSERT INTO townships (name, city, province, type) VALUES
('Glenvista', 'Johannesburg', 'Gauteng', 'suburb'),
('Mondeor', 'Johannesburg', 'Gauteng', 'suburb'),
('Turffontein', 'Johannesburg', 'Gauteng', 'suburb'),
('Rosettenville', 'Johannesburg', 'Gauteng', 'suburb'),
('Southgate', 'Johannesburg', 'Gauteng', 'suburb'),
('Winchester Hills', 'Johannesburg', 'Gauteng', 'suburb'),
('Ridgeway', 'Johannesburg', 'Gauteng', 'suburb'),
('Robertsham', 'Johannesburg', 'Gauteng', 'suburb'),
('Ormonde', 'Johannesburg', 'Gauteng', 'suburb'),
('Soweto', 'Johannesburg', 'Gauteng', 'township'),
('Diepkloof', 'Johannesburg', 'Gauteng', 'township'),
('Orlando East', 'Johannesburg', 'Gauteng', 'township'),
('Orlando West', 'Johannesburg', 'Gauteng', 'township'),
('Pimville', 'Johannesburg', 'Gauteng', 'township'),
('Dobsonville', 'Johannesburg', 'Gauteng', 'township'),
('Meadowlands', 'Johannesburg', 'Gauteng', 'township'),
('Protea Glen', 'Johannesburg', 'Gauteng', 'township'),
('Chiawelo', 'Johannesburg', 'Gauteng', 'township'),
('Jabulani', 'Johannesburg', 'Gauteng', 'township'),
('Eldorado Park', 'Johannesburg', 'Gauteng', 'township'),
('Orange Farm', 'Johannesburg', 'Gauteng', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- Johannesburg - North
INSERT INTO townships (name, city, province, type) VALUES
('Sandton', 'Johannesburg', 'Gauteng', 'cbd'),
('Rosebank', 'Johannesburg', 'Gauteng', 'cbd'),
('Randburg', 'Johannesburg', 'Gauteng', 'suburb'),
('Fourways', 'Johannesburg', 'Gauteng', 'suburb'),
('Midrand', 'Johannesburg', 'Gauteng', 'suburb'),
('Bryanston', 'Johannesburg', 'Gauteng', 'suburb'),
('Rivonia', 'Johannesburg', 'Gauteng', 'suburb'),
('Sunninghill', 'Johannesburg', 'Gauteng', 'suburb'),
('Melrose Arch', 'Johannesburg', 'Gauteng', 'suburb'),
('Linden', 'Johannesburg', 'Gauteng', 'suburb'),
('Alexandra', 'Johannesburg', 'Gauteng', 'township'),
('Diepsloot', 'Johannesburg', 'Gauteng', 'township'),
('Cosmo City', 'Johannesburg', 'Gauteng', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- Johannesburg - East & West
INSERT INTO townships (name, city, province, type) VALUES
('Bedfordview', 'Johannesburg', 'Gauteng', 'suburb'),
('Kensington', 'Johannesburg', 'Gauteng', 'suburb'),
('Observatory', 'Johannesburg', 'Gauteng', 'suburb'),
('Cyrildene', 'Johannesburg', 'Gauteng', 'suburb'),
('Roodepoort', 'Johannesburg', 'Gauteng', 'suburb'),
('Florida', 'Johannesburg', 'Gauteng', 'suburb'),
('Melville', 'Johannesburg', 'Gauteng', 'suburb'),
('Westdene', 'Johannesburg', 'Gauteng', 'suburb'),
('Auckland Park', 'Johannesburg', 'Gauteng', 'suburb'),
('Brixton', 'Johannesburg', 'Gauteng', 'suburb'),
('Sophiatown', 'Johannesburg', 'Gauteng', 'suburb')
ON CONFLICT (name, city, province) DO NOTHING;

-- Pretoria (Tshwane)
INSERT INTO townships (name, city, province, type) VALUES
('Pretoria CBD', 'Pretoria', 'Gauteng', 'cbd'),
('Arcadia', 'Pretoria', 'Gauteng', 'suburb'),
('Sunnyside', 'Pretoria', 'Gauteng', 'suburb'),
('Hatfield', 'Pretoria', 'Gauteng', 'suburb'),
('Menlo Park', 'Pretoria', 'Gauteng', 'suburb'),
('Brooklyn', 'Pretoria', 'Gauteng', 'suburb'),
('Mamelodi', 'Pretoria', 'Gauteng', 'township'),
('Soshanguve', 'Pretoria', 'Gauteng', 'township'),
('Atteridgeville', 'Pretoria', 'Gauteng', 'township'),
('Ga-Rankuwa', 'Pretoria', 'Gauteng', 'township'),
('Hammanskraal', 'Pretoria', 'Gauteng', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- Ekurhuleni (East Rand)
INSERT INTO townships (name, city, province, type) VALUES
('Germiston', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Kempton Park', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Boksburg', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Benoni', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Brakpan', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Tembisa', 'Ekurhuleni', 'Gauteng', 'township'),
('Katlehong', 'Ekurhuleni', 'Gauteng', 'township'),
('Vosloorus', 'Ekurhuleni', 'Gauteng', 'township'),
('Thokoza', 'Ekurhuleni', 'Gauteng', 'township'),
('Daveyton', 'Ekurhuleni', 'Gauteng', 'township'),
('Tsakane', 'Ekurhuleni', 'Gauteng', 'township'),
('KwaThema', 'Ekurhuleni', 'Gauteng', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- KWAZULU-NATAL PROVINCE

-- Durban (eThekwini)
INSERT INTO townships (name, city, province, type) VALUES
('Durban CBD', 'Durban', 'KwaZulu-Natal', 'cbd'),
('Berea', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Morningside', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Glenwood', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Umhlanga', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Westville', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Pinetown', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Umlazi', 'Durban', 'KwaZulu-Natal', 'township'),
('KwaMashu', 'Durban', 'KwaZulu-Natal', 'township'),
('Inanda', 'Durban', 'KwaZulu-Natal', 'township'),
('Ntuzuma', 'Durban', 'KwaZulu-Natal', 'township'),
('Chatsworth', 'Durban', 'KwaZulu-Natal', 'township'),
('Phoenix', 'Durban', 'KwaZulu-Natal', 'township'),
('Cato Manor', 'Durban', 'KwaZulu-Natal', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- WESTERN CAPE PROVINCE

-- Cape Town
INSERT INTO townships (name, city, province, type) VALUES
('Cape Town CBD', 'Cape Town', 'Western Cape', 'cbd'),
('Sea Point', 'Cape Town', 'Western Cape', 'suburb'),
('Woodstock', 'Cape Town', 'Western Cape', 'suburb'),
('Observatory', 'Cape Town', 'Western Cape', 'suburb'),
('Claremont', 'Cape Town', 'Western Cape', 'suburb'),
('Wynberg', 'Cape Town', 'Western Cape', 'suburb'),
('Bellville', 'Cape Town', 'Western Cape', 'suburb'),
('Parow', 'Cape Town', 'Western Cape', 'suburb'),
('Khayelitsha', 'Cape Town', 'Western Cape', 'township'),
('Gugulethu', 'Cape Town', 'Western Cape', 'township'),
('Langa', 'Cape Town', 'Western Cape', 'township'),
('Nyanga', 'Cape Town', 'Western Cape', 'township'),
('Philippi', 'Cape Town', 'Western Cape', 'township'),
('Delft', 'Cape Town', 'Western Cape', 'township'),
('Mitchells Plain', 'Cape Town', 'Western Cape', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- EASTERN CAPE PROVINCE

-- Port Elizabeth (Gqeberha)
INSERT INTO townships (name, city, province, type) VALUES
('Gqeberha CBD', 'Gqeberha', 'Eastern Cape', 'cbd'),
('Summerstrand', 'Gqeberha', 'Eastern Cape', 'suburb'),
('Walmer', 'Gqeberha', 'Eastern Cape', 'suburb'),
('Motherwell', 'Gqeberha', 'Eastern Cape', 'township'),
('New Brighton', 'Gqeberha', 'Eastern Cape', 'township'),
('KwaZakhele', 'Gqeberha', 'Eastern Cape', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- East London
INSERT INTO townships (name, city, province, type) VALUES
('East London CBD', 'East London', 'Eastern Cape', 'cbd'),
('Mdantsane', 'East London', 'Eastern Cape', 'township'),
('Duncan Village', 'East London', 'Eastern Cape', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- FREE STATE PROVINCE

-- Bloemfontein
INSERT INTO townships (name, city, province, type) VALUES
('Bloemfontein CBD', 'Bloemfontein', 'Free State', 'cbd'),
('Universitas', 'Bloemfontein', 'Free State', 'suburb'),
('Willows', 'Bloemfontein', 'Free State', 'suburb'),
('Mangaung', 'Bloemfontein', 'Free State', 'township'),
('Botshabelo', 'Bloemfontein', 'Free State', 'township'),
('Thaba Nchu', 'Bloemfontein', 'Free State', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- LIMPOPO PROVINCE

-- Polokwane
INSERT INTO townships (name, city, province, type) VALUES
('Polokwane CBD', 'Polokwane', 'Limpopo', 'cbd'),
('Seshego', 'Polokwane', 'Limpopo', 'township'),
('Mankweng', 'Polokwane', 'Limpopo', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- NORTH WEST PROVINCE

-- Rustenburg
INSERT INTO townships (name, city, province, type) VALUES
('Rustenburg CBD', 'Rustenburg', 'North West', 'cbd'),
('Boitekong', 'Rustenburg', 'North West', 'township'),
('Tlhabane', 'Rustenburg', 'North West', 'township'),
('Marikana', 'Rustenburg', 'North West', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- MPUMALANGA PROVINCE

-- Nelspruit (Mbombela)
INSERT INTO townships (name, city, province, type) VALUES
('Mbombela CBD', 'Mbombela', 'Mpumalanga', 'cbd'),
('KaNyamazane', 'Mbombela', 'Mpumalanga', 'township'),
('Matsulu', 'Mbombela', 'Mpumalanga', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- NORTHERN CAPE PROVINCE

-- Kimberley
INSERT INTO townships (name, city, province, type) VALUES
('Kimberley CBD', 'Kimberley', 'Northern Cape', 'cbd'),
('Galeshewe', 'Kimberley', 'Northern Cape', 'township'),
('Roodepan', 'Kimberley', 'Northern Cape', 'township')
ON CONFLICT (name, city, province) DO NOTHING;
