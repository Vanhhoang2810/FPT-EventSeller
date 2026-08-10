SELECT e.id, e.title, v.name as venue, v.city FROM events e JOIN venues v ON e.venue_id = v.id WHERE e.id IN (2,5,6,7);
