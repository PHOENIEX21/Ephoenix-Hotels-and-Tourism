export type Hotel = { slug: string; shortName: string; name: string; address: string; phone: string; description: string; rooms: number; image: string; vatMode: string; serviceNote: string };
export type RoomType = { hotel: string; name: string; slug: string; price: number; deposit: number; roomNumbers: string[]; image?: string; images?: string[] };
export type Policy = { item: string; detail: string };
export const cloudinary = (publicId: string) => `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'n4m6aaqd'}/image/upload/f_auto,q_auto/${publicId}`;
const cloudinaryName = (name: string) => {
  const stem = name.replace(/\.[^.]+$/, '');
  const curated = stem.match(/^use(\d+)/i);
  if (curated) return `use${curated[1]}`;
  return stem.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/^z-(\d+)$/, 'z-$1');
};
export const curatedImages = (folder: string, names: string[]) => names
  .map((name, index) => {
    const baseName = name.replace(/\.[^.]+$/, '');
    return { name, order: Number(baseName.match(/^use(\d+)/)?.[1] || Number.MAX_SAFE_INTEGER), index };
  })
  .sort((a, b) => a.order - b.order || a.index - b.index)
  .map(({ name }) => `${cloudinary(`${folder}/${cloudinaryName(name)}`)}.jpg`);
const curatedNumbers: Record<string, number[]> = {
  'ephoenix/annex-ii/exterior': [1, 2, 4, 5],
  'ephoenix/annex-ii/lobby': [1, 2, 3, 4, 5, 6, 8, 9],
  'ephoenix/annex-ii/restaurant-and-abr': [1, 2, 4],
};
export const curatedImageSet = (folder: string, count: number) => {
  const numbers = curatedNumbers[folder] || Array.from({ length: count }, (_, index) => index + 1);
  return curatedImages(folder, numbers.map(number => `use${number}`));
};
export const folderImages = (folder: string, names: string[]) => curatedImages(folder, names);
const roomImage = (folder: string, filename: string) => `${cloudinary(`${folder}/${filename}`)}.jpg`;

export const hotels: Hotel[] = [
  { slug: 'main', shortName: 'Main GRA Branch', name: 'E-Phoenix Hotels and Tourism (Main)', address: '45 Aderemi Adeleye Street, GRA, Ilorin, Kwara State, Adjacent Federal Secretariat, Opposite Federal High Court', phone: '07077014444 / 08178887145 / 08035799641', description: 'Flagship location with premium suites and executive accommodation.', rooms: 54, image: cloudinary('ephoenix/main/overview/EXTERIOR%20MAIN/photo-01'), vatMode: 'room-rate', serviceNote: 'Room rate is charged as displayed; no VAT or service charge added.' },
  { slug: 'annex-i', shortName: 'Annex 1', name: 'E-Phoenix Hotels and Tourism (Annex 1)', address: '6 Umar Audi Road, Opposite Unilorin Senior Staff Quarters, Beside Premium Bank, Tanke Junction, GRA, Ilorin, Kwara State', phone: '08062267110 / 08178884601 / 08035799641', description: 'Modern retreat with luxury amenities and a serene environment.', rooms: 29, image: cloudinary('ephoenix/annex-i/exterior-annex-1/photo-01'), vatMode: 'room-rate', serviceNote: 'Room rate is charged as displayed; no VAT or service charge added.' },
  { slug: 'annex-ii', shortName: 'Annex 2', name: 'E-Phoenix Hotel (Annex II)', address: '13 Reservation Road, Flower Garden, GRA, Ilorin, Kwara State', phone: '09084878587 / 08035799587 / 08035603554', description: 'Ultra-modern annex with a pool, restaurant, and entertainment.', rooms: 62, image: cloudinary('ephoenix/annex-ii/exterior/photo-01'), vatMode: 'room-rate', serviceNote: 'Room rate is charged as displayed; no VAT or service charge added.' },
];

const room = (hotel: string, name: string, price: number, deposit: number, roomNumbers: string[], imageOrImages?: string | string[]): RoomType => {
  const images = Array.isArray(imageOrImages) ? imageOrImages : imageOrImages ? [imageOrImages] : undefined;
  return { hotel, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), price, deposit, roomNumbers, image: images?.[0], images };
};
export const rooms: RoomType[] = [
  room('main', 'Diamond Suite', 60000, 20000, ['109', '110', '111', '112'], roomImage('ephoenix/main/suite', '1-1')),
  room('main', 'Legacy Room', 40000, 15000, ['141', '142', '143', '144', '145', '146', '147'], roomImage('ephoenix/main/legacy', '6-2')),
  room('main', 'Wole Olanipekun', 35000, 15000, ['106', '107', '108', '148', '149', '150', '151', '152', '153', '154', '155', '156'], roomImage('ephoenix/main/wole-olanipekun', '1-8')),
  room('main', 'Platinum Luxury', 40000, 15000, ['101', '102', '104', '105'], roomImage('ephoenix/main/platinum', '7-4')),
  room('main', 'Pentagon', 30000, 15000, ['132', '133', '134', '135', '136', '137', '138', '139'], roomImage('ephoenix/main/pentagon', '5-2')),
  room('main', 'Classic Room', 25000, 10000, ['103', '113', '114', '115', '116', '118', '119', '121', '122', '124', '125', '126', '127', '128', '129', '140'], curatedImageSet('ephoenix/main/classic', 2)),
  room('main', 'Standard Double', 22000, 10000, ['117', '120', '123'], roomImage('ephoenix/main/standard-double', '3-2')),
  room('annex-i', 'Luxury Rooms', 40000, 15000, ['301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '313', '315', '316', '317', '318', '319', '321', '322', '323', '327'], roomImage('ephoenix/annex-i/luxury', '4-4')),
  room('annex-i', 'Superior Luxury', 45000, 20000, ['311', '312', '314', '320', '324', '325', '326'], curatedImageSet('ephoenix/annex-i/superior-luxury', 2)),
  room('annex-i', "Director's Suite", 65000, 25000, ['328'], curatedImageSet('ephoenix/annex-i/director-suite', 2)),
  room('annex-i', "Chairman's Suite", 70000, 30000, ['329'], curatedImageSet('ephoenix/annex-i/chairman-s-suite', 2)),
  room('annex-ii', 'Standard', 35000, 15000, ['509', '529', '549'], roomImage('ephoenix/annex-ii/classic', '1-5')),
  room('annex-ii', 'Classic', 45000, 20000, ['501', '502', '503', '504', '505', '507', '516', '521', '522', '523', '524', '527', '530', '531', '532', '533', '536', '543', '544', '545', '550', '551', '552', '553', '554', '555', '557', '558', '559', '560'], curatedImageSet('ephoenix/annex-ii/classic', 2)),
  room('annex-ii', 'Deluxe', 50000, 20000, ['508', '510', '511', '512', '513', '514', '515', '519', '528', '534', '535', '538', '539', '540', '541', '546'], curatedImageSet('ephoenix/annex-ii/deluxe', 4)),
  room('annex-ii', 'Super Deluxe', 60000, 25000, ['506', '517', '518', '525'], curatedImageSet('ephoenix/annex-ii/presidential-suite/super-deluxe', 3)),
  room('annex-ii', 'City View Luxury', 65000, 25000, ['526', '547'], curatedImageSet('ephoenix/annex-ii/city-view-luxury', 2)),
  room('annex-ii', 'Pool View Suite', 85000, 35000, ['520', '537', '542', '556'], 'https://res.cloudinary.com/n4m6aaqd/image/upload/v1787873414/ephoenix/annex-ii/pool-view-suite/5-1.jpg'),
  room('annex-ii', 'White House City View', 105000, 50000, ['561'], curatedImageSet('ephoenix/annex-ii/white-house-city-view', 4)),
  room('annex-ii', 'Senatorial Suite', 155000, 75000, ['562'], curatedImageSet('ephoenix/annex-ii/senatorial-suite', 5)),
  room('annex-ii', 'Presidential Suite', 250000, 100000, ['548'], curatedImageSet('ephoenix/annex-ii/presidential-suite', 6)),
];

export const policiesByHotel: Record<string, Policy[]> = {
  main: [
    { item: 'Check-out time', detail: '12:00 noon the following day; guests may check in at any time under the 24-hour stay model' },
    { item: 'Cancellation (24hrs+ before arrival)', detail: '20% charge' },
    { item: 'Cancellation (<24hrs before arrival)', detail: '50% charge' },
    { item: 'No-show', detail: '100% charge' },
    { item: 'Outside food/beverages', detail: 'Not allowed on premises or in rooms' },
    { item: 'Pricing', detail: 'Room rate is charged as displayed; no VAT or service charge added.' },
  ],
  'annex-i': [
    { item: 'Check-out time', detail: '12:00 noon the following day; guests may check in at any time under the 24-hour stay model' },
    { item: 'Cancellation (24hrs+ before arrival)', detail: '20% charge' },
    { item: 'Cancellation (<24hrs before arrival)', detail: '50% charge' },
    { item: 'No-show', detail: '100% charge' },
    { item: 'Outside food/beverages', detail: 'Not allowed on premises or in rooms' },
    { item: 'Complimentary breakfast', detail: 'Optional, 6:30am-9:00am' },
    { item: 'Internet', detail: 'Free' },
    { item: 'Pricing', detail: 'Room rate is charged as displayed; no VAT or service charge added.' },
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
    { item: 'Pricing', detail: 'Room rate is charged as displayed; no VAT or service charge added.' },
  ],
};
export const policies = policiesByHotel.main.map(policy => `${policy.item}: ${policy.detail}`);
export const halls = [{ hotel: 'main', name: 'Big Hall', price: 450000, deposit: 100000 }, { hotel: 'main', name: 'Small Hall', price: 250000, deposit: 75000 }, { hotel: 'annex-i', name: 'Small Hall', price: 250000, deposit: 75000 }, { hotel: 'annex-ii', name: 'Big Hall', price: 650000, deposit: 250000 }, { hotel: 'annex-ii', name: 'Small Hall', price: 250000, deposit: 100000 }];
export const naira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;
