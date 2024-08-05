-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "address_type" AS ENUM ('Permanent Address', 'Current Address');

-- CreateEnum
CREATE TYPE "approval_status" AS ENUM ('Approved', 'Pending', 'Rejected');

-- CreateEnum
CREATE TYPE "collection_collected_mode" AS ENUM ('Account', 'UPI', 'Cash', 'PayTM', 'e-mandate');

-- CreateEnum
CREATE TYPE "collection_status" AS ENUM ('Closed', 'Part Payment', 'Settlement', 'EMI Closed', 'EMI Paid', 'EMI Preclose');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('PAN Card', 'Aadhar Card', 'Voter ID', 'Driving License', 'Passport', 'Bank Statement', 'Pay Slip', 'Selfie', 'ID Card', 'Cheque', 'Electricity Bill', 'Mobile Bill', 'Other', 'Video', 'ZIP', 'Collection Document');

-- CreateEnum
CREATE TYPE "employee_types" AS ENUM ('Salaried', 'Self Employee', 'Professional', 'Not Employed');

-- CreateEnum
CREATE TYPE "genders" AS ENUM ('Male', 'Female');

-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('Fresh Lead', 'Callback', 'Interested', 'Not Interested', 'Wrong Number', 'Documents Received', 'Approved', 'Bank Update', 'Disbursed', 'Closed', 'Part Payment', 'Settlement', 'Incomplete Documents', 'DNC', 'Rejected', 'Not Eligible', 'Duplicate', 'Other', 'No Answer', 'EMI Paid', 'Less Salary', 'Out of Range', 'EMI PRECLOSE');

-- CreateEnum
CREATE TYPE "loan_status" AS ENUM ('Disbursed', 'Bank Update', 'Failed', 'Refund');

-- CreateEnum
CREATE TYPE "loan_type" AS ENUM ('payday', 'emi');

-- CreateEnum
CREATE TYPE "marital_status" AS ENUM ('Married', 'Unmarried');

-- CreateEnum
CREATE TYPE "relation_types" AS ENUM ('Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Friend', 'Relative', 'Other', 'Office colleague');

-- CreateEnum
CREATE TYPE "roles" AS ENUM ('Admin', 'Tele Caller', 'Credit Manager', 'Collection Manager', 'Collection Executive', 'Accounts', 'Recovery Team', 'Loan Officer', 'PD Team', 'Read only', 'Service');

-- CreateEnum
CREATE TYPE "utm_sources" AS ENUM ('google', 'mobile_app', 'website', 'facebook', 'instagram', 'twitter', 'others');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('Verified', 'Not Verified', 'Rejected');

-- CreateEnum
CREATE TYPE "bank_status" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('Active', 'In Active');

-- CreateEnum
CREATE TYPE "house_types" AS ENUM ('Owned', 'Rented', 'Company Provided', 'Parental');

-- CreateEnum
CREATE TYPE "waiver_approval_status_type" AS ENUM ('None', 'Requested', 'Rejected', 'Accepted');

-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('Download', 'Upload', 'Add', 'Update', 'Delete', 'Login', 'Verify', 'Audit Access');

-- CreateEnum
CREATE TYPE "ticket_type" AS ENUM ('Technical', 'Account', 'Feedback', 'Change', 'Disbursment', 'Collection', 'General');

-- CreateEnum
CREATE TYPE "priority_status" AS ENUM ('Low', 'Medium', 'High', 'Super');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('Open', 'In Progress', 'Closed', 'Resolved');

-- CreateTable
CREATE TABLE "address" (
    "address_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "type" "address_type" NOT NULL DEFAULT 'Current Address',
    "address" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "state" VARCHAR(255) NOT NULL,
    "pincode" VARCHAR(255) NOT NULL,
    "house_type" "house_types" NOT NULL DEFAULT 'Owned',
    "status" "verification_status" NOT NULL DEFAULT 'Not Verified',
    "verified_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("address_id")
);

-- CreateTable
CREATE TABLE "approval" (
    "approval_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "loan_type" "loan_type" NOT NULL DEFAULT 'payday',
    "product_type" VARCHAR(255),
    "branch" VARCHAR(255) NOT NULL,
    "loan_amt_approved" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "tenure" INTEGER NOT NULL,
    "roi" DOUBLE PRECISION NOT NULL,
    "salary_date" VARCHAR(255),
    "repay_date" TIMESTAMP(6) NOT NULL,
    "processing_fee" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "conversion_fees" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "gst" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "alternate_mobile" VARCHAR(20) NOT NULL,
    "official_email" VARCHAR(100) NOT NULL,
    "monthly_income" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "cibil" INTEGER NOT NULL,
    "status" "approval_status" NOT NULL,
    "final_remark" VARCHAR(255),
    "remark" VARCHAR(255),
    "loan_purpose" VARCHAR(255),
    "credited_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loan_no" VARCHAR(255),
    "row_no" SERIAL NOT NULL,
    "client_id" UUID NOT NULL,
    "processing_fee_percent" DOUBLE PRECISION NOT NULL DEFAULT 10.00,
    "conversion_fee_percent" DOUBLE PRECISION NOT NULL DEFAULT 5.00,

    CONSTRAINT "approval_pkey" PRIMARY KEY ("approval_id")
);

-- CreateTable
CREATE TABLE "call_history" (
    "call_history_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "call_type" VARCHAR(255) NOT NULL,
    "status" "lead_status" NOT NULL,
    "remark" VARCHAR(255) NOT NULL,
    "callback_time" TIMESTAMP(6),
    "called_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "call_history_pkey" PRIMARY KEY ("call_history_id")
);

-- CreateTable
CREATE TABLE "collection" (
    "collection_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "loan_no" VARCHAR(255) NOT NULL,
    "collected_amount" DOUBLE PRECISION NOT NULL,
    "penalty_amount" DOUBLE PRECISION,
    "collected_mode" VARCHAR(255) NOT NULL DEFAULT 'Account',
    "collected_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collection_time" VARCHAR(255) NOT NULL,
    "reference_no" VARCHAR(255) NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "settlement_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "status" "lead_status" NOT NULL DEFAULT 'Part Payment',
    "remark" VARCHAR(255) NOT NULL,
    "collected_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("collection_id")
);

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "gender" "genders",
    "dob" DATE NOT NULL,
    "mobile" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "pancard" VARCHAR(100),
    "aadhar_no" VARCHAR(100),
    "marital_status" "marital_status" NOT NULL,
    "is_verified" "verification_status" NOT NULL DEFAULT 'Not Verified',
    "employee_type" "employee_types" NOT NULL DEFAULT 'Salaried',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "document" (
    "document_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "document_type" "document_type" NOT NULL,
    "document_url" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255),
    "status" "verification_status" NOT NULL DEFAULT 'Not Verified',
    "verified_by" UUID,
    "verified_date" DATE,
    "uploaded_by" UUID,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,
    "lead_id" UUID,

    CONSTRAINT "document_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "employer" (
    "employer_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "employer_name" VARCHAR(255) NOT NULL,
    "total_experience" VARCHAR(255) NOT NULL DEFAULT '0-6 Months',
    "current_company_experience" VARCHAR(255) NOT NULL DEFAULT '0-6 Months',
    "address" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "state" VARCHAR(255) NOT NULL,
    "pincode" VARCHAR(255) NOT NULL,
    "status" "verification_status" NOT NULL DEFAULT 'Not Verified',
    "verified_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "employer_pkey" PRIMARY KEY ("employer_id")
);

-- CreateTable
CREATE TABLE "leads" (
    "lead_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "user_id" UUID,
    "collection_user_id" UUID,
    "purpose" VARCHAR(255) NOT NULL,
    "loan_required" VARCHAR(255) NOT NULL,
    "tenure" INTEGER NOT NULL DEFAULT 5,
    "monthly_income" VARCHAR(255) NOT NULL,
    "salary_mode" VARCHAR(200) DEFAULT 'salaried',
    "city" VARCHAR(255) NOT NULL,
    "state" VARCHAR(255) NOT NULL,
    "pincode" VARCHAR(100) NOT NULL,
    "status" "lead_status" NOT NULL DEFAULT 'Fresh Lead',
    "utm_source" VARCHAR(255) NOT NULL DEFAULT 'website',
    "domain_name" VARCHAR(255),
    "ip" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waiver_approval" "waiver_approval_status_type" NOT NULL DEFAULT 'None',
    "client_id" UUID NOT NULL,
    "gclid" VARCHAR(255),
    "conversion_time" TIMESTAMP(6),
    "conversion_name" VARCHAR(255),
    "credit_manager_id" UUID,
    "loan_type" "loan_type" NOT NULL DEFAULT 'payday',

    CONSTRAINT "leads_pkey" PRIMARY KEY ("lead_id")
);

-- CreateTable
CREATE TABLE "loan" (
    "loan_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lead_id" UUID NOT NULL,
    "row_no" SERIAL NOT NULL,
    "loan_no" VARCHAR(255),
    "customer_id" UUID NOT NULL,
    "loan_type" "loan_type" NOT NULL DEFAULT 'payday',
    "disbursal_amount" DOUBLE PRECISION NOT NULL,
    "disbursal_date" TIMESTAMP(6) NOT NULL,
    "disbursal_reference_no" VARCHAR(255),
    "account_no" VARCHAR(100) NOT NULL,
    "account_type" VARCHAR(100) NOT NULL,
    "bank_ifsc" VARCHAR(100) NOT NULL,
    "bank" VARCHAR(255) NOT NULL,
    "bank_branch" VARCHAR(255) NOT NULL,
    "cheque_details" VARCHAR(255),
    "pd_date" VARCHAR(255) NOT NULL,
    "pd_done_by" UUID,
    "processing_fee" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "deduction" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "remarks" VARCHAR(255) NOT NULL,
    "status" "loan_status" NOT NULL,
    "company_account_no" VARCHAR(255) NOT NULL DEFAULT '',
    "disbursed_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waiver_request_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "client_id" UUID NOT NULL,
    "waiver_request_type" VARCHAR(255),
    "conversion_fee" DOUBLE PRECISION NOT NULL DEFAULT 0.00,

    CONSTRAINT "loan_pkey" PRIMARY KEY ("loan_id")
);

-- CreateTable
CREATE TABLE "reference" (
    "reference_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "relation" "relation_types" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255),
    "city" VARCHAR(255),
    "state" VARCHAR(255),
    "pincode" VARCHAR(255),
    "mobile" VARCHAR(20) NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "reference_pkey" PRIMARY KEY ("reference_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(20) NOT NULL,
    "branch" VARCHAR(255) NOT NULL,
    "role" "roles" NOT NULL DEFAULT 'Read only',
    "status" "user_status" NOT NULL DEFAULT 'Active',
    "created_by" UUID NOT NULL,
    "allowed_mac" VARCHAR(255),
    "otp" INTEGER,
    "otp_timestamp" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_ids" UUID[],

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "banks" (
    "bank_id" BIGINT NOT NULL,
    "bank" VARCHAR(255) NOT NULL,
    "ifsc" VARCHAR(255) NOT NULL,
    "branch" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "contact" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "district" VARCHAR(255) NOT NULL,
    "state" VARCHAR(255) NOT NULL,
    "status" INTEGER NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("bank_id")
);

-- CreateTable
CREATE TABLE "userassigned" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_assigned_id" UUID NOT NULL,
    "role" "roles" NOT NULL,
    "task_assigned" BOOLEAN NOT NULL DEFAULT false,
    "client_id" UUID NOT NULL,

    CONSTRAINT "userassigned_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userreportees" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_reportee_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,

    CONSTRAINT "userreportees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_report" (
    "credit_report_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lead_id" UUID NOT NULL,
    "gross_income" DOUBLE PRECISION[],
    "band_percent" DOUBLE PRECISION NOT NULL,
    "foir_score" DOUBLE PRECISION NOT NULL,
    "eligibile_amount" DOUBLE PRECISION NOT NULL,
    "customer_id" UUID,
    "client_id" UUID NOT NULL,

    CONSTRAINT "credit_report_pkey" PRIMARY KEY ("credit_report_id")
);

-- CreateTable
CREATE TABLE "liabilities" (
    "liabilities_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lead_id" UUID NOT NULL,
    "liability_name" VARCHAR(255) NOT NULL,
    "credit" DOUBLE PRECISION NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL,
    "customer_id" UUID,
    "client_id" UUID NOT NULL,

    CONSTRAINT "liabilities_pkey" PRIMARY KEY ("liabilities_id")
);

-- CreateTable
CREATE TABLE "branch_target" (
    "bt_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "target" DOUBLE PRECISION NOT NULL,
    "branch_name" VARCHAR(255) NOT NULL,
    "month" VARCHAR(255) NOT NULL,
    "approved_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "branch_target_pkey" PRIMARY KEY ("bt_id")
);

-- CreateTable
CREATE TABLE "customer_assets" (
    "asset_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "asset_name" VARCHAR(255) NOT NULL,
    "asset_value" VARCHAR(255) NOT NULL,
    "customer_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "customer_assets_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "sanction_target" (
    "st_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "sanction_user_id" UUID NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "month" VARCHAR(255) NOT NULL,
    "approved_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "sanction_target_pkey" PRIMARY KEY ("st_id")
);

-- CreateTable
CREATE TABLE "customer_otp" (
    "otp_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_mobile_no" VARCHAR(100) NOT NULL,
    "otp" INTEGER NOT NULL,
    "otp_timestamp" VARCHAR(255) NOT NULL,
    "client_id" UUID NOT NULL,

    CONSTRAINT "customer_otp_pkey" PRIMARY KEY ("otp_id")
);

-- CreateTable
CREATE TABLE "kyc_requests" (
    "kyc_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lead_id" UUID NOT NULL,
    "kyc_request_id" VARCHAR(255) NOT NULL,
    "video_file_id" VARCHAR(255),
    "front_aadhar_card" VARCHAR(255),
    "back_aadhar_card" VARCHAR(255),
    "pan_card" VARCHAR(255),
    "customer_identifier" UUID NOT NULL,
    "kyc_location" VARCHAR(255),
    "aadhar_dob" VARCHAR(255),
    "aadhar_no" VARCHAR(255),
    "aadhar_customer_name" VARCHAR(255),
    "aadhar_father_name" VARCHAR(255),
    "aadhar_address" VARCHAR(255),
    "id_types" VARCHAR(255),
    "pan_dob" VARCHAR(255),
    "pan_no" VARCHAR(255),
    "pan_customer_name" VARCHAR(255),
    "pan_father_name" VARCHAR(255),
    "status" VARCHAR(255) DEFAULT 'requested',
    "customer_status" "user_status" NOT NULL DEFAULT 'Active',
    "request_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "kyc_requests_pkey" PRIMARY KEY ("kyc_id")
);

-- CreateTable
CREATE TABLE "e_sign_docs" (
    "e_sign_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lead_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "e_sign_doc_id" VARCHAR(255) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "e_sign_request_by" UUID,
    "customer_status" "user_status" NOT NULL DEFAULT 'Active',
    "status" VARCHAR(255) DEFAULT 'requested',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "e_sign_docs_pkey" PRIMARY KEY ("e_sign_id")
);

-- CreateTable
CREATE TABLE "collection_timeline" (
    "collection_timeline_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "related_to" VARCHAR(255) NOT NULL,
    "customer_response" VARCHAR(255) NOT NULL,
    "contacted_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "collection_timeline_pkey" PRIMARY KEY ("collection_timeline_id")
);

-- CreateTable
CREATE TABLE "pd_visit" (
    "visit_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "pd_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "visit_date" TIMESTAMP(6) NOT NULL,
    "visit_time" VARCHAR(255) NOT NULL,
    "client_id" UUID NOT NULL,

    CONSTRAINT "pd_visit_pkey" PRIMARY KEY ("visit_id")
);

-- CreateTable
CREATE TABLE "client" (
    "client_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "client_name" VARCHAR(255) NOT NULL,
    "client_logo" VARCHAR(255) NOT NULL,
    "client_status" "user_status" NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "novu_key" VARCHAR(255),
    "client_nbfc" VARCHAR(255),
    "client_sanction_email" VARCHAR(255),
    "client_collection_email" VARCHAR(255),
    "client_info_email" VARCHAR(255),
    "client_loan_prefix" VARCHAR(255),
    "client_bank_accounts" JSONB[],
    "client_domain" VARCHAR(255),
    "client_auto_disbursal_accounts" JSONB[],
    "eligible_leads_conversion_name" VARCHAR(255),
    "cashfree_integration" BOOLEAN NOT NULL DEFAULT false,
    "cashfree_client_id" VARCHAR(255),
    "cashfree_secret_key" JSONB,
    "cashfree_public_key_url" VARCHAR(255),
    "client_penalty_roi" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "google_sheet_key_url" VARCHAR(255),
    "google_sheet_id" VARCHAR(255),
    "loan_type" "loan_type" NOT NULL DEFAULT 'payday',
    "default_loan_no" BIGINT NOT NULL DEFAULT 10000000000,
    "kyc_template_name" VARCHAR(255),
    "e_sign_id" VARCHAR(255),

    CONSTRAINT "client_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "auto_disbursal" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "payment_id" VARCHAR(255) NOT NULL,
    "acc_no" VARCHAR(255) NOT NULL,
    "ifsc" VARCHAR(255) NOT NULL,
    "mode" VARCHAR(255) NOT NULL,
    "payment_portal" VARCHAR(255) NOT NULL,
    "disbursal_amt" DOUBLE PRECISION NOT NULL,
    "lead_id" UUID NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    "client_id" UUID NOT NULL,
    "utr_no" VARCHAR(255),

    CONSTRAINT "auto_disbursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "log_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "activity" VARCHAR(255),
    "user_id" UUID NOT NULL,
    "event_type" "event_type" NOT NULL DEFAULT 'Audit Access',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "emis" (
    "emi_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "loan_id" UUID NOT NULL,
    "loan_no" VARCHAR(255) NOT NULL,
    "emi_date" TIMESTAMP(6) NOT NULL,
    "emi_amount" DOUBLE PRECISION NOT NULL,
    "emi_status" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "emis_pkey" PRIMARY KEY ("emi_id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "ticket_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ticket_number" VARCHAR(255) NOT NULL,
    "ticket_query" VARCHAR(255) NOT NULL,
    "ticket_category" "ticket_type" NOT NULL,
    "created_by" UUID NOT NULL,
    "assigned_to" UUID,
    "status" "ticket_status" NOT NULL DEFAULT 'Open',
    "priority" "priority_status" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateTable
CREATE TABLE "ticket_comment" (
    "comment_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ticket_id" UUID NOT NULL,
    "comment" VARCHAR(255) NOT NULL,
    "comment_by" UUID NOT NULL,
    "comment_by_user_type" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" UUID NOT NULL,

    CONSTRAINT "ticket_comment_pkey" PRIMARY KEY ("comment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "approval_lead_id_key" ON "approval"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "loan_loan_no_key" ON "loan"("loan_no");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_otp_customer_mobile_no_key" ON "customer_otp"("customer_mobile_no");

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employer" ADD CONSTRAINT "employer_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan" ADD CONSTRAINT "customer_loan_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan" ADD CONSTRAINT "lead_fk" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reference" ADD CONSTRAINT "reference_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "userassigned" ADD CONSTRAINT "userassigned_user_assigned_id_fkey" FOREIGN KEY ("user_assigned_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "userreportees" ADD CONSTRAINT "userreportees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_assets" ADD CONSTRAINT "customer_assets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sanction_target" ADD CONSTRAINT "sanction_target_sanction_user_id_fkey" FOREIGN KEY ("sanction_user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kyc_requests" ADD CONSTRAINT "kyc_requests_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "e_sign_docs" ADD CONSTRAINT "e_sign_docs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection_timeline" ADD CONSTRAINT "collection_timeline_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pd_visit" ADD CONSTRAINT "pd_visit_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "emis" ADD CONSTRAINT "emis_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loan"("loan_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket_comment" ADD CONSTRAINT "ticket_comment_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
