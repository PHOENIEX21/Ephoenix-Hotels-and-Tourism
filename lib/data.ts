export type Hotel = { slug: string; shortName: string; name: string; address: string; phone: string; description: string; rooms: number; image: string; vatMode: string; serviceNote: string };
export type RoomType = { hotel: string; name: string; slug: string; price: number; deposit: number; roomNumbers: string[]; image?: string };
export type Policy = { item: string; detail: string };
export const cloudinary = (publicId: string) => `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'n4m6aaqd'}/image/upload/f_auto,q_auto/${publicId}`;

export const hotels: Hotel[] = [
  { slug: 'main', shortName: 'Main', name: 'E-Phoenix Hotels and Tourism (Main)', address: '45 Aderemi Adeleye Street, GRA, Ilorin, Kwara State, Adjacent Federal Secretariat, Opposite Federal High Court', phone: '07077014444 / 08178887145 / 08035799641', description: 'Our flagship GRA address, made for an easy, polished stay in the heart of Ilorin.', rooms: 54, image: cloudinary('ephoenix/main/overview/EXTERIOR%20MAIN/photo-01'), vatMode: 'exclusive', serviceNote: '10% service charge + 7.5% VAT added to rate' },
  { slug: 'annex-i', shortName: 'Annex I', name: 'E-Phoenix Hotels and Tourism (Annex 1)', address: '6 Umar Audi Road, Opposite Unilorin Senior Staff Quarters, Beside Premium Bank, Tanke Junction, GRA, Ilorin, Kwara State', phone: '08062267110 / 08178884601 / 08035799641', description: 'A relaxed annex with self-catering suites and the same thoughtful EPhoenix welcome.', rooms: 29, image: cloudinary('ephoenix/annex-i/exterior-annex-1/photo-01'), vatMode: 'exclusive', serviceNote: '10% service charge + 7.5% VAT added to rate' },
  { slug: 'annex-ii', shortName: 'Annex II', name: 'E-Phoenix Hotel (Annex II)', address: '13 Reservation Road, Flower Garden, GRA, Ilorin, Kwara State', phone: '09084878587 / 08035799587 / 08035603554', description: 'Our widest range of rooms, including the signature Presidential Suites.', rooms: 62, image: cloudinary('ephoenix/annex-ii/exterior/photo-01'), vatMode: 'inclusive', serviceNote: '10% service charge + 7.5% VAT already included' },
];

const room = (hotel: string, name: string, price: number, deposit: number, roomNumbers: string[], image?: string): RoomType => ({ hotel, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), price, deposit, roomNumbers, image });
export const rooms: RoomType[] = [
  room('main', 'Diamond Suite', 60000, 20000, ['109', '110', '111', '112']),
  room('main', 'Legacy Room', 40000, 15000, ['141', '142', '143', '144', '145', '146', '147']),
  room('main', 'Wole Olanipekun', 35000, 15000, ['106', '107', '108', '148', '149', '150', '151', '152', '153', '154', '155', '156']),
  room('main', 'Platinum Luxury', 40000, 15000, ['101', '102', '104', '105']),
  room('main', 'Pentagon', 30000, 15000, ['132', '133', '134', '135', '136', '137', '138', '139']),
  room('main', 'Classic Room', 25000, 10000, ['103', '113', '114', '115', '116', '118', '119', '121', '122', '124', '125', '126', '127', '128', '129', '140']),
  room('main', 'Standard Double', 22000, 10000, ['117', '120', '123']),
  room('annex-i', 'Luxury Rooms', 40000, 15000, ['301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '313', '315', '316', '317', '318', '319', '321', '322', '323', '327']),
  room('annex-i', 'Superior Luxury', 45000, 20000, ['311', '312', '314', '320', '324', '325', '326']),
  room('annex-i', "Director's Suite", 65000, 25000, ['328']),
  room('annex-i', "Chairman's Suite", 70000, 30000, ['329']),
  room('annex-ii', 'Standard', 35000, 15000, ['509', '529', '549']),
  room('annex-ii', 'Classic', 45000, 20000, ['501', '502', '503', '504', '505', '507', '516', '521', '522', '523', '524', '527', '530', '531', '532', '533', '536', '543', '544', '545', '550', '551', '552', '553', '554', '555', '557', '558', '559', '560']),
  room('annex-ii', 'Deluxe', 50000, 20000, ['508', '510', '511', '512', '513', '514', '515', '519', '528', '534', '535', '538', '539', '540', '541', '546']),
  room('annex-ii', 'Super Deluxe', 60000, 25000, ['506', '517', '518', '525']),
  room('annex-ii', 'City View Luxury', 65000, 25000, ['526', '547']),
  room('annex-ii', 'Pool View Suite', 85000, 35000, ['520', '537', '542', '556']),
  room('annex-ii', 'White House City View', 105000, 50000, ['561']),
  room('annex-ii', 'Senatorial Suite', 155000, 75000, ['562']),
  room('annex-ii', 'Presidential Suite', 250000, 100000, ['548'], cloudinary('ephoenix/annex-ii/presidential-suite/photo-01')),
];

export const policiesByHotel: Record<string, Policy[]> = {
  main: [
    { item: 'Check-out time', detail: '12:00 noon the following day; guests may check in at any time under the 24-hour stay model' },
    { item: 'Cancellation (24hrs+ before arrival)', detail: '20% charge' },
    { item: 'Cancellation (<24hrs before arrival)', detail: '50% charge' },
    { item: 'No-show', detail: '100% charge' },
    { item: 'Outside food/beverages', detail: 'Not allowed on premises or in rooms' },
    { item: 'Service charge & VAT', detail: 'EXCLUSIVE - 10% service charge + 7.5% VAT added to rate' },
  ],
  'annex-i': [
    { item: 'Check-out time', detail: '12:00 noon the following day; guests may check in at any time under the 24-hour stay model' },
    { item: 'Cancellation (24hrs+ before arrival)', detail: '20% charge' },
    { item: 'Cancellation (<24hrs before arrival)', detail: '50% charge' },
    { item: 'No-show', detail: '100% charge' },
    { item: 'Outside food/beverages', detail: 'Not allowed on premises or in rooms' },
    { item: 'Complimentary breakfast', detail: 'Optional, 6:30am-9:00am' },
    { item: 'Internet', detail: 'Free' },
    { item: 'Service charge & VAT', detail: 'EXCLUSIVE - 10% service charge + 7.5% VAT added to rate' },
  ],
  'annex-ii': [
    { item: 'Check-in time', detail: 'Anytime; 24-hour stay model with checkout fixed at 12:00 noon the following day' },
    { item: 'Cancellation (24hrs+ before arrival)', detail: '20% charge' },
    { item: 'Cancellation (<24hrs before arrival)', detail: '50% charge' },
    { item: 'No-show', detail: '100% charge' },
    { item: 'Outside food/beverages', detail: 'Not allowed on premises or in rooms' },
    { item: 'Complimentary breakfast', detail: 'Optional, 6:30am-9:00am' },
    { item: 'Internet', detail: 'Free' },
    { item: 'Unused deposit refunds', detail: '7.5% administrative charge deducted' },
    { item: 'Service charge & VAT', detail: 'INCLUSIVE - 10% service charge + 7.5% VAT already in rate' },
  ],
};
export const policies = policiesByHotel.main.map(policy => `${policy.item}: ${policy.detail}`);
export const halls = [{ hotel: 'main', name: 'Big Hall', price: 450000, deposit: 100000 }, { hotel: 'main', name: 'Small Hall', price: 250000, deposit: 75000 }, { hotel: 'annex-i', name: 'Small Hall', price: 250000, deposit: 75000 }, { hotel: 'annex-ii', name: 'Big Hall', price: 650000, deposit: 250000 }, { hotel: 'annex-ii', name: 'Small Hall', price: 250000, deposit: 100000 }];
export const naira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;
