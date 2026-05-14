import { Router } from 'express';
import { EventsController } from './events.controller';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { listEventsSchema, suggestionsSchema } from './events.validation';

const router = Router();

// Static paths TRƯỚC dynamic paths (tránh route conflict)
router.get('/featured', EventsController.featured);
router.get('/trending', EventsController.trending);
router.get('/suggestions', validate(suggestionsSchema, 'query'), EventsController.suggestions);
router.get('/favorites', authenticate, EventsController.favorites);
router.get('/', validate(listEventsSchema, 'query'), optionalAuth, EventsController.list);
router.get('/:idOrSlug', optionalAuth, EventsController.detail);
router.get('/:id/seat-map', EventsController.seatMap);
router.post('/:id/favorite', authenticate, EventsController.toggleFavorite);
router.post('/:id/remind', authenticate, EventsController.remind);

export default router;
