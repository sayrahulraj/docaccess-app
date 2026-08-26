-- DocAccess database schema
-- Run this once against your Neon database (see README for instructions).

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  can_access_documents BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS persons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_person_id ON documents(person_id);

-- Seed the four people whose documents can be browsed.
-- Safe to re-run: only inserts if the table is empty.
INSERT INTO persons (name)
SELECT * FROM (VALUES
  ('Rahul Raj'),
  ('Divya Kumar'),
  ('Rudransh Raj'),
  ('Devenash Raj')
) AS seed(name)
WHERE NOT EXISTS (SELECT 1 FROM persons);
