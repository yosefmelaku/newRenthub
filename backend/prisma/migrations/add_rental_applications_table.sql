-- Create rental_applications table
CREATE TABLE IF NOT EXISTS "rental_applications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" UUID NOT NULL,
  "property_title" TEXT NOT NULL,
  "property_location" TEXT NOT NULL,
  "monthly_rent" DECIMAL(12, 2) NOT NULL,
  "owner_id" UUID NOT NULL,
  "applicant_id" UUID NOT NULL,
  "applicant_name" TEXT NOT NULL,
  "applicant_email" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "occupation" TEXT NOT NULL,
  "employer" TEXT,
  "monthly_income" TEXT NOT NULL,
  "number_of_occupants" TEXT NOT NULL,
  "move_in_date" TIMESTAMP NOT NULL,
  "previous_address" TEXT,
  "reason_for_moving" TEXT,
  "has_pets" TEXT NOT NULL,
  "pet_details" TEXT,
  "emergency_contact_name" TEXT NOT NULL,
  "emergency_contact_phone" TEXT NOT NULL,
  "additional_notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "submitted_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "reviewed_at" TIMESTAMP,
  CONSTRAINT "rental_applications_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE,
  CONSTRAINT "rental_applications_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "rental_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "rental_applications_property_id_idx" ON "rental_applications"("property_id");
CREATE INDEX IF NOT EXISTS "rental_applications_owner_id_idx" ON "rental_applications"("owner_id");
CREATE INDEX IF NOT EXISTS "rental_applications_applicant_id_idx" ON "rental_applications"("applicant_id");
CREATE INDEX IF NOT EXISTS "rental_applications_applicant_email_idx" ON "rental_applications"("applicant_email");
CREATE INDEX IF NOT EXISTS "rental_applications_status_idx" ON "rental_applications"("status");

-- Add comment
COMMENT ON TABLE "rental_applications" IS 'Stores rental applications from tenants for properties';
