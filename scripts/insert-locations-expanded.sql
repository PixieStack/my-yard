-- Insert Additional South African Locations (400+ Townships)
-- This extends insert-locations.sql with more comprehensive coverage
-- Run AFTER insert-locations.sql

-- GAUTENG - Additional Johannesburg areas
INSERT INTO townships (name, city, province, type) VALUES
('Parktown', 'Johannesburg', 'Gauteng', 'suburb'),
('Houghton', 'Johannesburg', 'Gauteng', 'suburb'),
('Rosebank', 'Johannesburg', 'Gauteng', 'suburb'),
('Parkhurst', 'Johannesburg', 'Gauteng', 'suburb'),
('Northcliff', 'Johannesburg', 'Gauteng', 'suburb'),
('Craighall', 'Johannesburg', 'Gauteng', 'suburb'),
('Greenside', 'Johannesburg', 'Gauteng', 'suburb'),
('Emmarentia', 'Johannesburg', 'Gauteng', 'suburb'),
('Victory Park', 'Johannesburg', 'Gauteng', 'suburb'),
('Randpark Ridge', 'Johannesburg', 'Gauteng', 'suburb'),
('Ferndale', 'Johannesburg', 'Gauteng', 'suburb'),
('Honeydew', 'Johannesburg', 'Gauteng', 'suburb'),
('Northriding', 'Johannesburg', 'Gauteng', 'suburb'),
('Fairland', 'Johannesburg', 'Gauteng', 'suburb'),
('Weltevreden Park', 'Johannesburg', 'Gauteng', 'suburb'),
('Little Falls', 'Johannesburg', 'Gauteng', 'suburb'),
('Strubens Valley', 'Johannesburg', 'Gauteng', 'suburb'),
('Constantia Kloof', 'Johannesburg', 'Gauteng', 'suburb'),
('Georginia', 'Johannesburg', 'Gauteng', 'township'),
('Lenasia', 'Johannesburg', 'Gauteng', 'suburb'),
('Devland', 'Johannesburg', 'Gauteng', 'township'),
('Naledi', 'Johannesburg', 'Gauteng', 'township'),
('Zola', 'Johannesburg', 'Gauteng', 'township'),
('Phiri', 'Johannesburg', 'Gauteng', 'township'),
('Rockville', 'Johannesburg', 'Gauteng', 'township'),
('Klipspruit', 'Johannesburg', 'Gauteng', 'township'),
('Mofolo', 'Johannesburg', 'Gauteng', 'township'),
('Tladi', 'Johannesburg', 'Gauteng', 'township'),
('Mapetla', 'Johannesburg', 'Gauteng', 'township'),
('Dhlamini', 'Johannesburg', 'Gauteng', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- GAUTENG - More Johannesburg East
INSERT INTO townships (name, city, province, type) VALUES
('Germiston', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Edenvale', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Modderfontein', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Greenstone Hill', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Bedfordview', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Eastleigh', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Alberton', 'Ekurhuleni', 'Gauteng', 'suburb'),
('New Redruth', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Meyersdal', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Rynfield', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Northmead', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Dawn Park', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Nigel', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Springs', 'Ekurhuleni', 'Gauteng', 'suburb'),
('Duduza', 'Ekurhuleni', 'Gauteng', 'township'),
('Wattville', 'Ekurhuleni', 'Gauteng', 'township'),
('Reiger Park', 'Ekurhuleni', 'Gauteng', 'township'),
('Impumelelo', 'Ekurhuleni', 'Gauteng', 'township'),
('Tokoza', 'Ekurhuleni', 'Gauteng', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- GAUTENG - More Pretoria/Tshwane
INSERT INTO townships (name, city, province, type) VALUES
('Centurion', 'Pretoria', 'Gauteng', 'suburb'),
('Lyttelton', 'Pretoria', 'Gauteng', 'suburb'),
('Irene', 'Pretoria', 'Gauteng', 'suburb'),
('Waterkloof', 'Pretoria', 'Gauteng', 'suburb'),
('Faerie Glen', 'Pretoria', 'Gauteng', 'suburb'),
('Lynnwood', 'Pretoria', 'Gauteng', 'suburb'),
('Mooikloof', 'Pretoria', 'Gauteng', 'suburb'),
('Sinoville', 'Pretoria', 'Gauteng', 'suburb'),
('Montana', 'Pretoria', 'Gauteng', 'suburb'),
('Gezina', 'Pretoria', 'Gauteng', 'suburb'),
('Silverton', 'Pretoria', 'Gauteng', 'suburb'),
('Denneboom', 'Pretoria', 'Gauteng', 'suburb'),
('Eersterust', 'Pretoria', 'Gauteng', 'township'),
('Mahube Valley', 'Pretoria', 'Gauteng', 'township'),
('Nellmapius', 'Pretoria', 'Gauteng', 'township'),
('Winterveld', 'Pretoria', 'Gauteng', 'township'),
('Temba', 'Pretoria', 'Gauteng', 'township'),
('Mabopane', 'Pretoria', 'Gauteng', 'township'),
('Garankuwa', 'Pretoria', 'Gauteng', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- GAUTENG - West Rand
INSERT INTO townships (name, city, province, type) VALUES
('Krugersdorp', 'West Rand', 'Gauteng', 'suburb'),
('Mogale City', 'West Rand', 'Gauteng', 'suburb'),
('Randfontein', 'West Rand', 'Gauteng', 'suburb'),
('Westonaria', 'West Rand', 'Gauteng', 'suburb'),
('Carletonville', 'West Rand', 'Gauteng', 'suburb'),
('Kagiso', 'West Rand', 'Gauteng', 'township'),
('Munsieville', 'West Rand', 'Gauteng', 'township'),
('Wedela', 'West Rand', 'Gauteng', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- KWAZULU-NATAL - Additional Durban
INSERT INTO townships (name, city, province, type) VALUES
('Durban North', 'Durban', 'KwaZulu-Natal', 'suburb'),
('La Lucia', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Ballito', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Salt Rock', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Tongaat', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Verulam', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Stanger', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Amanzimtoti', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Kingsburgh', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Bluff', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Wentworth', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Merebank', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Prospecton', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Isipingo', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Umbilo', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Overport', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Sydenham', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Reservoir Hills', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Newlands East', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Clare Estate', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Shallcross', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Montclair', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Yellowwood Park', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Lamontville', 'Durban', 'KwaZulu-Natal', 'township'),
('Jacobs', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Clairwood', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Malabar', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Mobeni', 'Durban', 'KwaZulu-Natal', 'suburb'),
('Kwamashu', 'Durban', 'KwaZulu-Natal', 'township'),
('Lindelani', 'Durban', 'KwaZulu-Natal', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- KWAZULU-NATAL - Other cities
INSERT INTO townships (name, city, province, type) VALUES
('Pietermaritzburg CBD', 'Pietermaritzburg', 'KwaZulu-Natal', 'cbd'),
('Scottsville', 'Pietermaritzburg', 'KwaZulu-Natal', 'suburb'),
('Hayfields', 'Pietermaritzburg', 'KwaZulu-Natal', 'suburb'),
('Northdale', 'Pietermaritzburg', 'KwaZulu-Natal', 'suburb'),
('Edendale', 'Pietermaritzburg', 'KwaZulu-Natal', 'township'),
('Imbali', 'Pietermaritzburg', 'KwaZulu-Natal', 'township'),
('Ashdown', 'Pietermaritzburg', 'KwaZulu-Natal', 'township'),
('Plessislaer', 'Pietermaritzburg', 'KwaZulu-Natal', 'township'),
('Richards Bay CBD', 'Richards Bay', 'KwaZulu-Natal', 'cbd'),
('Meerensee', 'Richards Bay', 'KwaZulu-Natal', 'suburb'),
('Arboretum', 'Richards Bay', 'KwaZulu-Natal', 'suburb'),
('Empangeni', 'Richards Bay', 'KwaZulu-Natal', 'suburb'),
('Ngwelezane', 'Richards Bay', 'KwaZulu-Natal', 'township'),
('Newcastle CBD', 'Newcastle', 'KwaZulu-Natal', 'cbd'),
('Osizweni', 'Newcastle', 'KwaZulu-Natal', 'township'),
('Majuba', 'Newcastle', 'KwaZulu-Natal', 'township'),
('Ladysmith CBD', 'Ladysmith', 'KwaZulu-Natal', 'cbd'),
('Steadville', 'Ladysmith', 'KwaZulu-Natal', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- WESTERN CAPE - Additional Cape Town
INSERT INTO townships (name, city, province, type) VALUES
('Athlone', 'Cape Town', 'Western Cape', 'suburb'),
('Mitchells Plain', 'Cape Town', 'Western Cape', 'township'),
('Grassy Park', 'Cape Town', 'Western Cape', 'suburb'),
('Ottery', 'Cape Town', 'Western Cape', 'suburb'),
('Retreat', 'Cape Town', 'Western Cape', 'suburb'),
('Steenberg', 'Cape Town', 'Western Cape', 'suburb'),
('Tokai', 'Cape Town', 'Western Cape', 'suburb'),
('Muizenberg', 'Cape Town', 'Western Cape', 'suburb'),
('Fish Hoek', 'Cape Town', 'Western Cape', 'suburb'),
('Simon''s Town', 'Cape Town', 'Western Cape', 'suburb'),
('Hout Bay', 'Cape Town', 'Western Cape', 'suburb'),
('Constantia', 'Cape Town', 'Western Cape', 'suburb'),
('Kenilworth', 'Cape Town', 'Western Cape', 'suburb'),
('Rondebosch', 'Cape Town', 'Western Cape', 'suburb'),
('Newlands', 'Cape Town', 'Western Cape', 'suburb'),
('Bishopscourt', 'Cape Town', 'Western Cape', 'suburb'),
('Pinelands', 'Cape Town', 'Western Cape', 'suburb'),
('Maitland', 'Cape Town', 'Western Cape', 'suburb'),
('Salt River', 'Cape Town', 'Western Cape', 'suburb'),
('De Waterkant', 'Cape Town', 'Western Cape', 'suburb'),
('Bo-Kaap', 'Cape Town', 'Western Cape', 'suburb'),
('Gardens', 'Cape Town', 'Western Cape', 'suburb'),
('Tamboerskloof', 'Cape Town', 'Western Cape', 'suburb'),
('Vredehoek', 'Cape Town', 'Western Cape', 'suburb'),
('Observatory', 'Cape Town', 'Western Cape', 'suburb'),
('Goodwood', 'Cape Town', 'Western Cape', 'suburb'),
('Kuils River', 'Cape Town', 'Western Cape', 'suburb'),
('Strand', 'Cape Town', 'Western Cape', 'suburb'),
('Somerset West', 'Cape Town', 'Western Cape', 'suburb'),
('Stellenbosch', 'Cape Town', 'Western Cape', 'suburb'),
('Paarl', 'Cape Town', 'Western Cape', 'suburb'),
('Wellington', 'Cape Town', 'Western Cape', 'suburb'),
('Franschhoek', 'Cape Town', 'Western Cape', 'suburb'),
('Blue Downs', 'Cape Town', 'Western Cape', 'suburb'),
('Mfuleni', 'Cape Town', 'Western Cape', 'township'),
('Hanover Park', 'Cape Town', 'Western Cape', 'township'),
('Manenberg', 'Cape Town', 'Western Cape', 'township'),
('Heideveld', 'Cape Town', 'Western Cape', 'township'),
('Bonteheuwel', 'Cape Town', 'Western Cape', 'township'),
('Bishop Lavis', 'Cape Town', 'Western Cape', 'township'),
('Elsies River', 'Cape Town', 'Western Cape', 'township'),
('Matroosfontein', 'Cape Town', 'Western Cape', 'township'),
('Ravensmead', 'Cape Town', 'Western Cape', 'township'),
('Uitsig', 'Cape Town', 'Western Cape', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- WESTERN CAPE - George and other cities
INSERT INTO townships (name, city, province, type) VALUES
('George CBD', 'George', 'Western Cape', 'cbd'),
('Pacaltsdorp', 'George', 'Western Cape', 'suburb'),
('Thembalethu', 'George', 'Western Cape', 'township'),
('Blanco', 'George', 'Western Cape', 'suburb'),
('Knysna CBD', 'Knysna', 'Western Cape', 'cbd'),
('Masakhane', 'Knysna', 'Western Cape', 'township'),
('Mossel Bay CBD', 'Mossel Bay', 'Western Cape', 'cbd'),
('Hartenbos', 'Mossel Bay', 'Western Cape', 'suburb'),
('Oudtshoorn CBD', 'Oudtshoorn', 'Western Cape', 'cbd'),
('Bridgton', 'Oudtshoorn', 'Western Cape', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- EASTERN CAPE - Additional Gqeberha
INSERT INTO townships (name, city, province, type) VALUES
('Kariega', 'Gqeberha', 'Eastern Cape', 'suburb'),
('Uitenhage CBD', 'Gqeberha', 'Eastern Cape', 'suburb'),
('Kwanobuhle', 'Gqeberha', 'Eastern Cape', 'township'),
('Despatch', 'Gqeberha', 'Eastern Cape', 'suburb'),
('Swartkops', 'Gqeberha', 'Eastern Cape', 'suburb'),
('Helenvale', 'Gqeberha', 'Eastern Cape', 'township'),
('Bethelsdorp', 'Gqeberha', 'Eastern Cape', 'township'),
('Zwide', 'Gqeberha', 'Eastern Cape', 'township'),
('Soweto-on-Sea', 'Gqeberha', 'Eastern Cape', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- EASTERN CAPE - Additional East London / Buffalo City
INSERT INTO townships (name, city, province, type) VALUES
('Beacon Bay', 'East London', 'Eastern Cape', 'suburb'),
('Gonubie', 'East London', 'Eastern Cape', 'suburb'),
('Cambridge', 'East London', 'Eastern Cape', 'suburb'),
('Berea', 'East London', 'Eastern Cape', 'suburb'),
('Southernwood', 'East London', 'Eastern Cape', 'suburb'),
('Vincent', 'East London', 'Eastern Cape', 'suburb'),
('Quigney', 'East London', 'Eastern Cape', 'suburb'),
('King William''s Town', 'East London', 'Eastern Cape', 'suburb'),
('Zwelitsha', 'East London', 'Eastern Cape', 'township'),
('Ginsberg', 'East London', 'Eastern Cape', 'township'),
('Bisho', 'East London', 'Eastern Cape', 'suburb'),
('Dimbaza', 'East London', 'Eastern Cape', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- EASTERN CAPE - Mthatha and other towns
INSERT INTO townships (name, city, province, type) VALUES
('Mthatha CBD', 'Mthatha', 'Eastern Cape', 'cbd'),
('Ngangelizwe', 'Mthatha', 'Eastern Cape', 'township'),
('Viedgesville', 'Mthatha', 'Eastern Cape', 'township'),
('Bhisho CBD', 'Bhisho', 'Eastern Cape', 'cbd'),
('Komani', 'Komani', 'Eastern Cape', 'suburb')
ON CONFLICT (name, city, province) DO NOTHING;

-- FREE STATE - Additional areas
INSERT INTO townships (name, city, province, type) VALUES
('Langenhoven Park', 'Bloemfontein', 'Free State', 'suburb'),
('Westdene', 'Bloemfontein', 'Free State', 'suburb'),
('Ehrlichpark', 'Bloemfontein', 'Free State', 'suburb'),
('Danville', 'Bloemfontein', 'Free State', 'suburb'),
('Fauna', 'Bloemfontein', 'Free State', 'suburb'),
('Fichardt Park', 'Bloemfontein', 'Free State', 'suburb'),
('Fleurdal', 'Bloemfontein', 'Free State', 'suburb'),
('Roodewal', 'Bloemfontein', 'Free State', 'suburb'),
('Heidedal', 'Bloemfontein', 'Free State', 'township'),
('Phahameng', 'Bloemfontein', 'Free State', 'township'),
('Rocklands', 'Bloemfontein', 'Free State', 'township'),
('Batho', 'Bloemfontein', 'Free State', 'township'),
('Welkom CBD', 'Welkom', 'Free State', 'cbd'),
('Thabong', 'Welkom', 'Free State', 'township'),
('Bronville', 'Welkom', 'Free State', 'suburb'),
('Virginia', 'Welkom', 'Free State', 'suburb'),
('Odendaalsrus', 'Welkom', 'Free State', 'suburb'),
('Sasolburg CBD', 'Sasolburg', 'Free State', 'cbd'),
('Zamdela', 'Sasolburg', 'Free State', 'township'),
('Parys CBD', 'Parys', 'Free State', 'cbd'),
('Tumahole', 'Parys', 'Free State', 'township'),
('Kroonstad CBD', 'Kroonstad', 'Free State', 'cbd'),
('Maokeng', 'Kroonstad', 'Free State', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- LIMPOPO - Additional areas
INSERT INTO townships (name, city, province, type) VALUES
('Polokwane West', 'Polokwane', 'Limpopo', 'suburb'),
('Bendor', 'Polokwane', 'Limpopo', 'suburb'),
('Fauna Park', 'Polokwane', 'Limpopo', 'suburb'),
('Ivy Park', 'Polokwane', 'Limpopo', 'suburb'),
('Thornhill', 'Polokwane', 'Limpopo', 'suburb'),
('Ladanna', 'Polokwane', 'Limpopo', 'suburb'),
('Groenvlei', 'Polokwane', 'Limpopo', 'suburb'),
('Annadale', 'Polokwane', 'Limpopo', 'suburb'),
('Lebowakgomo', 'Polokwane', 'Limpopo', 'township'),
('Ga-Nchabeleng', 'Polokwane', 'Limpopo', 'township'),
('Tzaneen CBD', 'Tzaneen', 'Limpopo', 'cbd'),
('Nkowankowa', 'Tzaneen', 'Limpopo', 'township'),
('Lenyenye', 'Tzaneen', 'Limpopo', 'township'),
('Giyani CBD', 'Giyani', 'Limpopo', 'cbd'),
('Bochum', 'Bochum', 'Limpopo', 'suburb'),
('Louis Trichardt CBD', 'Louis Trichardt', 'Limpopo', 'cbd'),
('Makhado', 'Louis Trichardt', 'Limpopo', 'suburb'),
('Tshilwavhusiku', 'Louis Trichardt', 'Limpopo', 'township'),
('Musina CBD', 'Musina', 'Limpopo', 'cbd'),
('Phalaborwa CBD', 'Phalaborwa', 'Limpopo', 'cbd'),
('Namakgale', 'Phalaborwa', 'Limpopo', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- MPUMALANGA - Additional areas
INSERT INTO townships (name, city, province, type) VALUES
('Nelspruit', 'Mbombela', 'Mpumalanga', 'suburb'),
('West Acres', 'Mbombela', 'Mpumalanga', 'suburb'),
('Tekwane', 'Mbombela', 'Mpumalanga', 'suburb'),
('Bongani', 'Mbombela', 'Mpumalanga', 'suburb'),
('Msogwaba', 'Mbombela', 'Mpumalanga', 'township'),
('Daantjie', 'Mbombela', 'Mpumalanga', 'township'),
('White River', 'Mbombela', 'Mpumalanga', 'suburb'),
('Witrivier', 'Mbombela', 'Mpumalanga', 'suburb'),
('Hazyview', 'Hazyview', 'Mpumalanga', 'suburb'),
('Acornhoek', 'Acornhoek', 'Mpumalanga', 'suburb'),
('Bushbuckridge CBD', 'Bushbuckridge', 'Mpumalanga', 'cbd'),
('Dwarsloop', 'Bushbuckridge', 'Mpumalanga', 'township'),
('Emalahleni CBD', 'Emalahleni', 'Mpumalanga', 'cbd'),
('KwaGuqa', 'Emalahleni', 'Mpumalanga', 'township'),
('Ogies', 'Emalahleni', 'Mpumalanga', 'suburb'),
('Secunda CBD', 'Secunda', 'Mpumalanga', 'cbd'),
('Evander', 'Secunda', 'Mpumalanga', 'suburb'),
('eMbalenhle', 'Secunda', 'Mpumalanga', 'township'),
('Middelburg CBD', 'Middelburg', 'Mpumalanga', 'cbd'),
('Mhluzi', 'Middelburg', 'Mpumalanga', 'township'),
('Hendrina', 'Middelburg', 'Mpumalanga', 'suburb')
ON CONFLICT (name, city, province) DO NOTHING;

-- NORTH WEST - Additional areas
INSERT INTO townships (name, city, province, type) VALUES
('Rustenburg West', 'Rustenburg', 'North West', 'suburb'),
('Cashan', 'Rustenburg', 'North West', 'suburb'),
('Waterval East', 'Rustenburg', 'North West', 'suburb'),
('Geelhout Park', 'Rustenburg', 'North West', 'suburb'),
('Meriting', 'Rustenburg', 'North West', 'township'),
('Zinniaville', 'Rustenburg', 'North West', 'suburb'),
('Phokeng', 'Rustenburg', 'North West', 'township'),
('Ikageng', 'Potchefstroom', 'North West', 'township'),
('Potchefstroom CBD', 'Potchefstroom', 'North West', 'cbd'),
('Potchefstroom', 'Potchefstroom', 'North West', 'suburb'),
('Klerksdorp CBD', 'Klerksdorp', 'North West', 'cbd'),
('Jouberton', 'Klerksdorp', 'North West', 'township'),
('Alabama', 'Klerksdorp', 'North West', 'township'),
('Kanana', 'Klerksdorp', 'North West', 'township'),
('Mahikeng CBD', 'Mahikeng', 'North West', 'cbd'),
('Montshiwa', 'Mahikeng', 'North West', 'township'),
('Mmabatho', 'Mahikeng', 'North West', 'township'),
('Zeerust CBD', 'Zeerust', 'North West', 'cbd'),
('Lichtenburg CBD', 'Lichtenburg', 'North West', 'cbd'),
('Brits CBD', 'Brits', 'North West', 'cbd'),
('Letlhabile', 'Brits', 'North West', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- NORTHERN CAPE - Additional areas
INSERT INTO townships (name, city, province, type) VALUES
('Diamond Acres', 'Kimberley', 'Northern Cape', 'suburb'),
('Beaconsfield', 'Kimberley', 'Northern Cape', 'suburb'),
('Kenilworth', 'Kimberley', 'Northern Cape', 'suburb'),
('Greenpoint', 'Kimberley', 'Northern Cape', 'suburb'),
('Homestead', 'Kimberley', 'Northern Cape', 'suburb'),
('Platfontein', 'Kimberley', 'Northern Cape', 'township'),
('Upington CBD', 'Upington', 'Northern Cape', 'cbd'),
('Paballelo', 'Upington', 'Northern Cape', 'township'),
('Louisvale', 'Upington', 'Northern Cape', 'suburb'),
('Springbok CBD', 'Springbok', 'Northern Cape', 'cbd'),
('Coloured Township', 'Springbok', 'Northern Cape', 'township'),
('De Aar CBD', 'De Aar', 'Northern Cape', 'cbd'),
('Orania', 'Orania', 'Northern Cape', 'suburb')
ON CONFLICT (name, city, province) DO NOTHING;

-- GAUTENG - Midrand / Waterfall area
INSERT INTO townships (name, city, province, type) VALUES
('Waterfall', 'Midrand', 'Gauteng', 'suburb'),
('Kyalami', 'Midrand', 'Gauteng', 'suburb'),
('Carlswald', 'Midrand', 'Gauteng', 'suburb'),
('Halfway Gardens', 'Midrand', 'Gauteng', 'suburb'),
('Noordwyk', 'Midrand', 'Gauteng', 'suburb'),
('Vorna Valley', 'Midrand', 'Gauteng', 'suburb'),
('Clayville', 'Midrand', 'Gauteng', 'suburb'),
('Rabie Ridge', 'Midrand', 'Gauteng', 'township'),
('Ebony Park', 'Midrand', 'Gauteng', 'township'),
('Ivory Park', 'Midrand', 'Gauteng', 'township'),
('Tembisa', 'Midrand', 'Gauteng', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- GAUTENG - Sandton Extended
INSERT INTO townships (name, city, province, type) VALUES
('Morningside', 'Johannesburg', 'Gauteng', 'suburb'),
('Illovo', 'Johannesburg', 'Gauteng', 'suburb'),
('Dunkeld', 'Johannesburg', 'Gauteng', 'suburb'),
('Hyde Park', 'Johannesburg', 'Gauteng', 'suburb'),
('Inanda', 'Johannesburg', 'Gauteng', 'suburb'),
('Sandhurst', 'Johannesburg', 'Gauteng', 'suburb'),
('Parkmore', 'Johannesburg', 'Gauteng', 'suburb'),
('Gallo Manor', 'Johannesburg', 'Gauteng', 'suburb'),
('Hurlingham', 'Johannesburg', 'Gauteng', 'suburb'),
('Woodmead', 'Johannesburg', 'Gauteng', 'suburb'),
('Paulshof', 'Johannesburg', 'Gauteng', 'suburb'),
('Douglasdale', 'Johannesburg', 'Gauteng', 'suburb'),
('Chartwell', 'Johannesburg', 'Gauteng', 'suburb'),
('Dainfern', 'Johannesburg', 'Gauteng', 'suburb'),
('Lonehill', 'Johannesburg', 'Gauteng', 'suburb'),
('Witkoppen', 'Johannesburg', 'Gauteng', 'suburb'),
('Sunningdale', 'Johannesburg', 'Gauteng', 'suburb'),
('Beverley', 'Johannesburg', 'Gauteng', 'suburb'),
('Wendywood', 'Johannesburg', 'Gauteng', 'suburb'),
('Edenburg', 'Johannesburg', 'Gauteng', 'suburb')
ON CONFLICT (name, city, province) DO NOTHING;

-- KWAZULU-NATAL - Inland towns
INSERT INTO townships (name, city, province, type) VALUES
('Dundee CBD', 'Dundee', 'KwaZulu-Natal', 'cbd'),
('Glencoe', 'Dundee', 'KwaZulu-Natal', 'suburb'),
('Madadeni', 'Dundee', 'KwaZulu-Natal', 'township'),
('Ulundi CBD', 'Ulundi', 'KwaZulu-Natal', 'cbd'),
('Port Shepstone CBD', 'Port Shepstone', 'KwaZulu-Natal', 'cbd'),
('Harding', 'Port Shepstone', 'KwaZulu-Natal', 'suburb'),
('Margate', 'Port Shepstone', 'KwaZulu-Natal', 'suburb'),
('Scottburgh', 'Port Shepstone', 'KwaZulu-Natal', 'suburb'),
('Estcourt CBD', 'Estcourt', 'KwaZulu-Natal', 'cbd'),
('Wembezi', 'Estcourt', 'KwaZulu-Natal', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- WESTERN CAPE - Worcester and Intermediate areas
INSERT INTO townships (name, city, province, type) VALUES
('Worcester CBD', 'Worcester', 'Western Cape', 'cbd'),
('Zweletemba', 'Worcester', 'Western Cape', 'township'),
('Mbekweni', 'Paarl', 'Western Cape', 'township'),
('Simondium', 'Paarl', 'Western Cape', 'suburb'),
('Robertson CBD', 'Robertson', 'Western Cape', 'cbd'),
('Nkqubela', 'Robertson', 'Western Cape', 'township'),
('Swellendam CBD', 'Swellendam', 'Western Cape', 'cbd'),
('Bredasdorp CBD', 'Bredasdorp', 'Western Cape', 'cbd'),
('Caledon CBD', 'Caledon', 'Western Cape', 'cbd'),
('Hermanus CBD', 'Hermanus', 'Western Cape', 'cbd'),
('Onrusrivier', 'Hermanus', 'Western Cape', 'suburb'),
('Hawston', 'Hermanus', 'Western Cape', 'township'),
('Masakhane', 'Hermanus', 'Western Cape', 'township'),
('Langebaan', 'Langebaan', 'Western Cape', 'suburb'),
('Saldanha CBD', 'Saldanha', 'Western Cape', 'cbd'),
('Vredenburg CBD', 'Vredenburg', 'Western Cape', 'cbd'),
('Hopland', 'Vredenburg', 'Western Cape', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- EASTERN CAPE - Additional towns
INSERT INTO townships (name, city, province, type) VALUES
('Grahamstown CBD', 'Makhanda', 'Eastern Cape', 'cbd'),
('Joza', 'Makhanda', 'Eastern Cape', 'township'),
('Fingo Village', 'Makhanda', 'Eastern Cape', 'township'),
('Queenstown CBD', 'Queenstown', 'Eastern Cape', 'cbd'),
('Mlungisi', 'Queenstown', 'Eastern Cape', 'township'),
('Ilitha', 'Queenstown', 'Eastern Cape', 'township'),
('Aliwal North CBD', 'Aliwal North', 'Eastern Cape', 'cbd'),
('Jamestown', 'Aliwal North', 'Eastern Cape', 'township'),
('Port Alfred', 'Port Alfred', 'Eastern Cape', 'suburb'),
('Bathurst', 'Bathurst', 'Eastern Cape', 'suburb'),
('Cradock CBD', 'Cradock', 'Eastern Cape', 'cbd'),
('Lingelihle', 'Cradock', 'Eastern Cape', 'township'),
('Graaff-Reinet CBD', 'Graaff-Reinet', 'Eastern Cape', 'cbd'),
('Umasizakhe', 'Graaff-Reinet', 'Eastern Cape', 'township'),
('Butterworth CBD', 'Butterworth', 'Eastern Cape', 'cbd'),
('Gcuwa', 'Butterworth', 'Eastern Cape', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- LIMPOPO - Additional Venda / Tzaneen areas
INSERT INTO townships (name, city, province, type) VALUES
('Thohoyandou CBD', 'Thohoyandou', 'Limpopo', 'cbd'),
('Sibasa', 'Thohoyandou', 'Limpopo', 'suburb'),
('Shayandima', 'Thohoyandou', 'Limpopo', 'suburb'),
('Makwarela', 'Thohoyandou', 'Limpopo', 'township'),
('Tshilidzi', 'Thohoyandou', 'Limpopo', 'township'),
('Elim', 'Limpopo Rural', 'Limpopo', 'township'),
('Mametja', 'Limpopo Rural', 'Limpopo', 'township'),
('Jane Furse', 'Jane Furse', 'Limpopo', 'suburb'),
('Motetema', 'Motetema', 'Limpopo', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- NORTH WEST - Additional towns
INSERT INTO townships (name, city, province, type) VALUES
('Taung CBD', 'Taung', 'North West', 'cbd'),
('Pudimoe', 'Taung', 'North West', 'township'),
('Wolmaransstad CBD', 'Wolmaransstad', 'North West', 'cbd'),
('Ottosdal', 'Wolmaransstad', 'North West', 'suburb'),
('Christiana CBD', 'Christiana', 'North West', 'cbd'),
('Itsoseng', 'Itsoseng', 'North West', 'township'),
('Bophelong', 'Vaal Triangle', 'North West', 'township'),
('Boikhutso', 'Lichtenburg', 'North West', 'township')
ON CONFLICT (name, city, province) DO NOTHING;

-- GAUTENG - Additional townships Vaal
INSERT INTO townships (name, city, province, type) VALUES
('Vereeniging CBD', 'Vereeniging', 'Gauteng', 'cbd'),
('Vanderbijlpark CBD', 'Vanderbijlpark', 'Gauteng', 'cbd'),
('Meyerton CBD', 'Meyerton', 'Gauteng', 'cbd'),
('Sebokeng', 'Vereeniging', 'Gauteng', 'township'),
('Evaton', 'Vereeniging', 'Gauteng', 'township'),
('Boipatong', 'Vanderbijlpark', 'Gauteng', 'township'),
('Sharpeville', 'Vereeniging', 'Gauteng', 'township'),
('Tshepiso', 'Meyerton', 'Gauteng', 'township'),
('Stretford', 'Vereeniging', 'Gauteng', 'suburb'),
('Duncanville', 'Vereeniging', 'Gauteng', 'suburb')
ON CONFLICT (name, city, province) DO NOTHING;
