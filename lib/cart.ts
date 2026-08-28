import { prisma } from './prisma';
import { createPendingBooking } from './booking';
import { getStayWindow } from './availability';

export type CartItemInput = {
  roomTypeId: string;
  checkIn: string;
  nights: number;
  guests: number;
  quantity: number;
};

export function validateCartItem(item: CartItemInput) {
  if (!item.roomTypeId || !/^\d{4}-\d{2}-\d{2}$/.test(item.checkIn)) throw new Error('A valid room type and check-in date are required.');
  if (!Number.isInteger(item.nights) || item.nights < 1 || item.nights > 30) throw new Error('Nights must be between 1 and 30.');
  if (!Number.isInteger(item.guests) || item.guests < 1 || item.guests > 20) throw new Error('Guests must be between 1 and 20.');
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) throw new Error('Quantity must be between 1 and 20.');
}

/** Creates one order and one physical booking per requested room, preserving each
 * cart line's independent dates, nights and guest count. */
export async function createOrderFromCart(input: {
  items: CartItemInput[];
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  holdMinutes?: number;
}) {
  if (!input.items.length || input.items.length > 30) throw new Error('Your cart is empty or too large.');
  const guestName = input.guestName.trim();
  const guestEmail = input.guestEmail.trim().toLowerCase();
  const guestPhone = input.guestPhone.trim();
  if (!guestName || !guestEmail || !guestPhone) throw new Error('Guest name, email and phone are required.');
  input.items.forEach(validateCartItem);

  const bookings: Array<{ booking: Awaited<ReturnType<typeof createPendingBooking>>; item: CartItemInput }> = [];
  try {
    for (const item of input.items) {
      // Creating each quantity as an independent hold makes availability
      // rechecks safe even when cart lines overlap.
      for (let i = 0; i < item.quantity; i += 1) {
        bookings.push({ item, booking: await createPendingBooking({ ...item, guestName, guestEmail, guestPhone, holdMinutes: input.holdMinutes }) });
      }
    }
    const total = bookings.reduce((sum, entry) => sum + entry.booking.totalKobo, 0);
    const subtotal = bookings.reduce((sum, entry) => sum + entry.booking.subtotalKobo, 0);
    const vat = bookings.reduce((sum, entry) => sum + entry.booking.vatKobo, 0);
    const service = bookings.reduce((sum, entry) => sum + entry.booking.serviceChargeKobo, 0);
    const expiresAt = bookings.reduce<Date | null>((earliest, entry) => !earliest || (entry.booking.expiresAt && entry.booking.expiresAt < earliest) ? entry.booking.expiresAt : earliest, null);

    return await prisma.$transaction(async tx => {
      const order = await tx.order.create({
        data: { reference: `EPX-ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, guestName, guestEmail, guestPhone, subtotalKobo: subtotal, vatKobo: vat, serviceChargeKobo: service, totalKobo: total, expiresAt },
      });
      for (const entry of bookings) {
        const { checkIn, checkOut } = getStayWindow(entry.item.checkIn, entry.item.nights);
        await tx.orderItem.create({ data: { orderId: order.id, bookingId: entry.booking.id, roomTypeId: entry.item.roomTypeId, checkIn, checkOut, guests: entry.item.guests, quantity: 1, unitTotalKobo: entry.booking.totalKobo } });
      }
      return { ...order, bookings: bookings.map(entry => entry.booking) };
    });
  } catch (error) {
    // Holds are created by the legacy single-booking service, outside the
    // order transaction. Explicitly release them if order creation fails.
    const bookingIds = bookings.map(entry => entry.booking.id);
    if (bookingIds.length) {
      await prisma.booking.updateMany({ where: { id: { in: bookingIds }, status: 'PENDING' }, data: { status: 'CANCELLED' } });
    }
    throw error;
  }
}
