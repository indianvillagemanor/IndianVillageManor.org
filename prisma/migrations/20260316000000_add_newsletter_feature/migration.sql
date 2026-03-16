-- AlterTable
ALTER TABLE "Committee" ADD COLUMN "hasNewsletterFeature" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "isNewsletter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "thumbnailPath" TEXT;

-- CreateIndex
CREATE INDEX "Document_isNewsletter_idx" ON "Document"("isNewsletter");
