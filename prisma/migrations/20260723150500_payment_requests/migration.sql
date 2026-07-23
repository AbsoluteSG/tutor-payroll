-- AlterEnum
ALTER TYPE "ClientPaymentMethod" ADD VALUE 'STRIPE';

-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED');

-- AlterTable
ALTER TABLE "ClientPayment" ADD COLUMN "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClientPayment_stripeSessionId_key" ON "ClientPayment"("stripeSessionId");

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentRequest_clientId_idx" ON "PaymentRequest"("clientId");

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
