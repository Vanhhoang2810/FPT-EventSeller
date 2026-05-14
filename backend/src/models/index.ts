export { User } from './User';
export { ChatConversation } from './ChatConversation';
export { ChatMessage } from './ChatMessage';
export { RefreshToken } from './RefreshToken';
export { Venue } from './Venue';
export { Event } from './Event';
export { Zone } from './Zone';
export { Seat } from './Seat';
export { Booking } from './Booking';
export { BookingSeat } from './BookingSeat';
export { Ticket } from './Ticket';
export { Payment } from './Payment';
export { Notification } from './Notification';
export { AuditLog } from './AuditLog';
export { Favorite } from './Favorite';
export { PromoCode } from './PromoCode';
export { PromoUsage } from './PromoUsage';

import { User } from './User';
import { RefreshToken } from './RefreshToken';
import { Venue } from './Venue';
import { Event } from './Event';
import { Zone } from './Zone';
import { Seat } from './Seat';
import { Booking } from './Booking';
import { BookingSeat } from './BookingSeat';
import { Ticket } from './Ticket';
import { Payment } from './Payment';
import { Notification } from './Notification';
import { AuditLog } from './AuditLog';
import { Favorite } from './Favorite';
import { PromoCode } from './PromoCode';
import { PromoUsage } from './PromoUsage';

// User associations
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
User.hasMany(Ticket, { foreignKey: 'user_id', as: 'tickets' });
User.hasMany(Favorite, { foreignKey: 'user_id', as: 'favorites' });
User.hasMany(AuditLog, { foreignKey: 'admin_id', as: 'auditLogs' });

// Venue associations
Venue.hasMany(Event, { foreignKey: 'venue_id', as: 'events' });

// Event associations
Event.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });
Event.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Event.hasMany(Zone, { foreignKey: 'event_id', as: 'zones' });
Event.hasMany(Booking, { foreignKey: 'event_id', as: 'bookings' });
Event.hasMany(Ticket, { foreignKey: 'event_id', as: 'tickets' });
Event.hasMany(Favorite, { foreignKey: 'event_id', as: 'favoritedBy' });

// Zone associations
Zone.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
Zone.hasMany(Seat, { foreignKey: 'zone_id', as: 'seats' });

// Seat associations
Seat.belongsTo(Zone, { foreignKey: 'zone_id', as: 'zone' });
Seat.hasMany(BookingSeat, { foreignKey: 'seat_id', as: 'bookingSeats' });

// Booking associations
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Booking.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
Booking.belongsTo(PromoCode, { foreignKey: 'promo_code_id', as: 'promoCode' });
Booking.hasMany(BookingSeat, { foreignKey: 'booking_id', as: 'bookingSeats' });
Booking.hasMany(Ticket, { foreignKey: 'booking_id', as: 'tickets' });
Booking.hasOne(Payment, { foreignKey: 'booking_id', as: 'payment' });

// BookingSeat associations
BookingSeat.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
BookingSeat.belongsTo(Seat, { foreignKey: 'seat_id', as: 'seat' });

// Ticket associations
Ticket.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
Ticket.belongsTo(Seat, { foreignKey: 'seat_id', as: 'seat' });
Ticket.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Ticket.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Payment associations
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// RefreshToken associations
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Favorite associations
Favorite.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Favorite.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// PromoCode associations
PromoCode.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PromoCode.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
PromoCode.hasMany(PromoUsage, { foreignKey: 'promo_id', as: 'usages' });

// PromoUsage associations
PromoUsage.belongsTo(PromoCode, { foreignKey: 'promo_id', as: 'promoCode' });
PromoUsage.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
PromoUsage.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

// Chat associations
import { ChatConversation } from './ChatConversation';
import { ChatMessage } from './ChatMessage';
ChatConversation.hasMany(ChatMessage, { foreignKey: 'conversation_id', as: 'messages' });
ChatMessage.belongsTo(ChatConversation, { foreignKey: 'conversation_id', as: 'conversation' });
ChatConversation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ChatConversation.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedAdmin' });
