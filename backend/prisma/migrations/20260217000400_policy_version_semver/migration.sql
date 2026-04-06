-- AlterColumn
ALTER TABLE "policy_versions"
  ALTER COLUMN "version" TYPE VARCHAR(30)
  USING "version"::text;
