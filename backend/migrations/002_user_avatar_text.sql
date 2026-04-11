-- Allow storing base64/data-url profile photos.
ALTER TABLE "User"
ALTER COLUMN "avatar" TYPE TEXT;
