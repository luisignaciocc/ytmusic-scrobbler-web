-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastNotificationSent" TIMESTAMP(3),
ADD COLUMN     "notificationEmail" TEXT,
ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
