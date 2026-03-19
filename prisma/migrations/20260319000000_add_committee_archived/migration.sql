-- Migration: add_committee_archived
-- Adds an `archived` boolean flag to the Committee table.
-- Archived committees are hidden from non-admin users but their
-- documents and events are preserved.

-- Add the archived column with a default of false
ALTER TABLE "Committee" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- Add an index for efficient filtering on archived status
CREATE INDEX "Committee_archived_idx" ON "Committee"("archived");
