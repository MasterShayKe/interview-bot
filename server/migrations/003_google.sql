-- Second sign-in provider: Google (OpenID Connect), for users without LinkedIn.
ALTER TABLE users ADD COLUMN google_sub text UNIQUE;
