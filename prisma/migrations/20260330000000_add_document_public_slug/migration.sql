-- AlterTable
ALTER TABLE "Document" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Document" ADD COLUMN "publicSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Document_publicSlug_key" ON "Document"("publicSlug");

-- CreateIndex
CREATE INDEX "Document_isPublic_idx" ON "Document"("isPublic");
