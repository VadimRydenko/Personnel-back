-- Migrate existing city values into stationing, then drop city column
UPDATE units SET stationing = city WHERE city != '' AND city IS NOT NULL;

ALTER TABLE units DROP COLUMN city;

ALTER TABLE units ALTER COLUMN stationing SET DEFAULT '';
