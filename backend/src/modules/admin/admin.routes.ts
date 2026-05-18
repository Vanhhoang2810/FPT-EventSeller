import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', AdminController.dashboard);

// Events CRUD đầy đủ
router.get('/events', AdminController.listEvents);
router.get('/events/:id', AdminController.getEventDetail);
router.post('/events', AdminController.createEvent);
router.put('/events/:id', AdminController.updateEvent);
router.put('/events/:id/status', AdminController.updateEventStatus);
router.post('/events/:id/zones', AdminController.setupZones);
router.delete('/events/:id', AdminController.deleteEvent);

// Venues CRUD đầy đủ
router.get('/venues', AdminController.listVenues);
router.post('/venues', AdminController.createVenue);
router.put('/venues/:id', AdminController.updateVenue);
router.delete('/venues/:id', AdminController.deleteVenue);

// Users
router.get('/users', AdminController.listUsers);
router.put('/users/:id/ban', AdminController.toggleBanUser);

// Bookings
router.get('/bookings', AdminController.listBookings);
router.put('/bookings/:id/refund', AdminController.refundBooking);

// Users detail
router.get('/users/:id', AdminController.getUserDetail);

// Charts
router.get('/charts/revenue', AdminController.revenueChart);
router.get('/charts/seat-fill', AdminController.seatFillStats);
router.get('/charts/demographics', AdminController.demographics);
router.get('/charts/conversion', AdminController.conversionFunnel);
router.get('/charts/peak-hours', AdminController.peakHours);

// Audit logs
router.get('/audit-logs', AdminController.auditLogs);

// Reports export
router.get('/reports/export', AdminController.exportReport);

export default router;
