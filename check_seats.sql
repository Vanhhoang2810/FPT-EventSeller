SELECT e.id, e.title, 
       COUNT(z.id) as zone_count, 
       COUNT(s.id) as seat_count 
FROM events e 
LEFT JOIN zones z ON z.event_id = e.id 
LEFT JOIN seats s ON s.zone_id = z.id 
GROUP BY e.id, e.title 
ORDER BY e.id;
