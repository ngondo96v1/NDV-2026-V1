-- SQL Schema for NDV Money App
-- Run this in your Supabase SQL Editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  "fullName" TEXT,
  "idNumber" TEXT UNIQUE,
  balance NUMERIC DEFAULT 0,
  "totalLimit" NUMERIC DEFAULT 0,
  rank TEXT DEFAULT 'standard',
  "rankProgress" NUMERIC DEFAULT 0,
  "isLoggedIn" BOOLEAN DEFAULT false,
  "isAdmin" BOOLEAN DEFAULT false,
  "pendingUpgradeRank" TEXT,
  "rankUpgradeBill" TEXT,
  avatar TEXT,
  "payosCheckoutUrl" TEXT,
  "payosOrderCode" BIGINT,
  "payosAmount" NUMERIC,
  "payosExpireAt" BIGINT,
  address TEXT,
  "joinDate" TEXT,
  "idFront" TEXT,
  "idBack" TEXT,
  "refZalo" TEXT UNIQUE,
  relationship TEXT,
  password TEXT,
  "lastLoanSeq" INTEGER DEFAULT 0,
  "bankName" TEXT,
  "bankAccountNumber" TEXT,
  "bankAccountHolder" TEXT,
  "hasJoinedZalo" BOOLEAN DEFAULT false,
  "bankBin" TEXT,
  "spins" INTEGER DEFAULT 0,
  "vouchers" JSONB DEFAULT '[]',
  "totalProfit" NUMERIC DEFAULT 0,
  "updatedAt" BIGINT
);

-- 2. Loans Table
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id),
  "userName" TEXT,
  amount NUMERIC NOT NULL,
  date TEXT,
  "createdAt" TEXT,
  status TEXT NOT NULL,
  fine NUMERIC DEFAULT 0,
  "billImage" TEXT,
  "bankTransactionId" TEXT,
  "settlementType" TEXT,
  "partialAmount" NUMERIC DEFAULT 0,
  "voucherId" TEXT,
  "settledAt" TEXT,
  "payosCheckoutUrl" TEXT,
  "payosOrderCode" BIGINT,
  "payosAmount" NUMERIC,
  "payosExpireAt" BIGINT,
  signature TEXT,
  "rejectionReason" TEXT,
  "principalPaymentCount" INTEGER DEFAULT 0,
  "extensionCount" INTEGER DEFAULT 0,
  "partialPaymentCount" INTEGER DEFAULT 0,
  "updatedAt" BIGINT
);

-- 3. Budget Logs Table
CREATE TABLE IF NOT EXISTS budget_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  "balanceAfter" NUMERIC NOT NULL,
  note TEXT,
  "createdAt" TEXT NOT NULL
);

-- 4. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id),
  title TEXT,
  message TEXT,
  time TEXT,
  read BOOLEAN DEFAULT false,
  type TEXT
);

-- 4. Config Table (for system settings)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config values
INSERT INTO config (key, value) VALUES 
('SYSTEM_BUDGET', '0'),
('TOTAL_RANK_PROFIT', '0'),
('TOTAL_LOAN_PROFIT', '0'),
('MONTHLY_STATS', '[]'),
('UPGRADE_PERCENT', '10'),
('PRE_DISBURSEMENT_FEE', '10'),
('MAX_EXTENSIONS', '3'),
('FINE_RATE', '2'),
('MAX_FINE_PERCENT', '30'),
('MAX_LOAN_PER_CYCLE', '10000000'),
('MIN_SYSTEM_BUDGET', '1000000'),
('MAX_SINGLE_LOAN_AMOUNT', '10000000'),
('USER_ID_FORMAT', '"{RANDOM 4 SỐ}"'),
('RANK_CONFIG', '[
  {"id": "standard", "name": "TIÊU CHUẨN", "minLimit": 1000000, "maxLimit": 2000000, "color": "#6b7280", "features": ["Hạn mức 1 - 2 triệu", "Duyệt trong 24h"]},
  {"id": "bronze", "name": "ĐỒNG", "minLimit": 1000000, "maxLimit": 3000000, "color": "#fdba74", "features": ["Hạn mức 1 - 3 triệu", "Ưu tiên duyệt lệnh"]},
  {"id": "silver", "name": "BẠC", "minLimit": 1000000, "maxLimit": 4000000, "color": "#bfdbfe", "features": ["Hạn mức 1 - 4 triệu", "Hỗ trợ 24/7"]},
  {"id": "gold", "name": "VÀNG", "minLimit": 1000000, "maxLimit": 5000000, "color": "#facc15", "features": ["Hạn mức 1 - 5 triệu", "Giảm 10% phí phạt"]},
  {"id": "diamond", "name": "KIM CƯƠNG", "minLimit": 1000000, "maxLimit": 10000000, "color": "#60a5fa", "features": ["Hạn mức 1 - 10 triệu", "Duyệt lệnh tức thì"]}
]')
ON CONFLICT (key) DO NOTHING;

-- Safe Migration Script (Run this if you are updating an existing database)
DO $$ 
BEGIN 
    -- Users table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='payosOrderCode') THEN
        ALTER TABLE users ADD COLUMN "payosOrderCode" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='payosCheckoutUrl') THEN
        ALTER TABLE users ADD COLUMN "payosCheckoutUrl" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='payosAmount') THEN
        ALTER TABLE users ADD COLUMN "payosAmount" NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='payosExpireAt') THEN
        ALTER TABLE users ADD COLUMN "payosExpireAt" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='idNumber') THEN
        ALTER TABLE users ADD COLUMN "idNumber" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='refZalo') THEN
        ALTER TABLE users ADD COLUMN "refZalo" TEXT;
    END IF;

    -- Loans table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='payosOrderCode') THEN
        ALTER TABLE loans ADD COLUMN "payosOrderCode" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='payosCheckoutUrl') THEN
        ALTER TABLE loans ADD COLUMN "payosCheckoutUrl" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='payosAmount') THEN
        ALTER TABLE loans ADD COLUMN "payosAmount" NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='payosExpireAt') THEN
        ALTER TABLE loans ADD COLUMN "payosExpireAt" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='partialAmount') THEN
        ALTER TABLE loans ADD COLUMN "partialAmount" NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='principalPaymentCount') THEN
        ALTER TABLE loans ADD COLUMN "principalPaymentCount" INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='extensionCount') THEN
        ALTER TABLE loans ADD COLUMN "extensionCount" INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='partialPaymentCount') THEN
        ALTER TABLE loans ADD COLUMN "partialPaymentCount" INTEGER DEFAULT 0;
    END IF;

    -- Constraints (Safe addition)
    BEGIN
        ALTER TABLE users ADD CONSTRAINT users_idNumber_unique UNIQUE ("idNumber");
    EXCEPTION WHEN duplicate_object THEN
        -- Do nothing if constraint already exists
    END;
    
    BEGIN
        ALTER TABLE users ADD CONSTRAINT users_refZalo_unique UNIQUE ("refZalo");
    EXCEPTION WHEN duplicate_object THEN
        -- Do nothing if constraint already exists
    END;

    -- 5. Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users("isAdmin");
    CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans("userId");
    CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
    CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans("createdAt");
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId");
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    CREATE INDEX IF NOT EXISTS idx_budget_logs_created_at ON budget_logs("createdAt");
END $$;
