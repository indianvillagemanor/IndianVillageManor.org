-- CreateTable
CREATE TABLE "DocumentDownload" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentDownload_documentId_idx" ON "DocumentDownload"("documentId");

-- CreateIndex
CREATE INDEX "DocumentDownload_documentId_downloadedAt_idx" ON "DocumentDownload"("documentId", "downloadedAt");

-- AddForeignKey
ALTER TABLE "DocumentDownload" ADD CONSTRAINT "DocumentDownload_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
