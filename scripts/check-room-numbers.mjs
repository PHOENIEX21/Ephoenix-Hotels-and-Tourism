import { rooms } from '../lib/data';
const byHotel = {};
for (const rt of rooms) (byHotel[rt.hotel] ||= []).push(...rt.roomNumbers);
let ok = true;
for (const [hotel, nums] of Object.entries(byHotel)) {
  const dupes = [...new Set(nums.filter((n, i) => nums.indexOf(n) !== i))];
  if (dupes.length) { ok = false; console.log(`CONFLICT in ${hotel}: ${dupes.join(', ')}`); }
  else console.log(`${hotel}: ${nums.length} room numbers, all unique`);
}
const sl = rooms.find(r => r.hotel === 'annex-i' && r.name === 'Superior Luxury');
console.log(`Annex I Superior Luxury now: ${sl.roomNumbers.join(', ')}`);
console.log(`Annex I total rooms: ${(byHotel['annex-i'] || []).length}`);
process.exit(ok ? 0 : 1);
