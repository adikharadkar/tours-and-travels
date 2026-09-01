CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Identity
    customer_code TEXT NOT NULL UNIQUE,
    registration_date TEXT NOT NULL,

    prefix TEXT
        CHECK (prefix IS NULL OR prefix IN ('mr', 'mrs', 'ms', 'dr')),

    name TEXT NOT NULL,

    customer_type TEXT NOT NULL
        CHECK (customer_type IN ('company', 'individual')),

    contact_person TEXT,

    -- Contact
    mobile1 TEXT NOT NULL,
    mobile2 TEXT,
    email TEXT NOT NULL,
    alternate_email TEXT,

    -- Registered address
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    state_code TEXT NOT NULL,
    pin_code TEXT NOT NULL,

    -- Tax / business information
    gst_number TEXT,
    pan TEXT,
    vendor_code TEXT,

    -- Billing address
    billing_name TEXT NOT NULL,

    billing_same_as_address INTEGER NOT NULL DEFAULT 1
        CHECK (billing_same_as_address IN (0, 1)),

    billing_address TEXT NOT NULL,
    billing_city TEXT NOT NULL,
    billing_state TEXT NOT NULL,
    billing_state_code TEXT NOT NULL,
    billing_pin_code TEXT NOT NULL,

    -- Financial information
    opening_balance_paise INTEGER NOT NULL DEFAULT 0
        CHECK (opening_balance_paise >= 0),

    opening_balance_type TEXT NOT NULL DEFAULT 'debit'
        CHECK (opening_balance_type IN ('debit', 'credit')),

    credit_limit_paise INTEGER
        CHECK (
            credit_limit_paise IS NULL
            OR credit_limit_paise >= 0
        ),

    payment_terms TEXT NOT NULL DEFAULT '30_days'
        CHECK (
            payment_terms IN (
                'immediate',
                '15_days',
                '30_days',
                '45_days',
                '60_days'
            )
        ),

    billing_cycle TEXT NOT NULL DEFAULT 'monthly'
        CHECK (
            billing_cycle IN (
                'per_trip',
                'daily',
                'weekly',
                'monthly'
            )
        ),

    -- Additional information
    date_of_birth TEXT,
    marriage_date TEXT,
    notes TEXT,

    -- Status
    is_active INTEGER NOT NULL DEFAULT 1
        CHECK (is_active IN (0, 1)),

    -- Audit
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_gst_number
    ON customers(gst_number);

CREATE INDEX IF NOT EXISTS idx_customers_pan
    ON customers(pan);

CREATE INDEX IF NOT EXISTS idx_customers_name_mobile
    ON customers(name, mobile1);

CREATE INDEX IF NOT EXISTS idx_customers_active
    ON customers(is_active);

CREATE INDEX IF NOT EXISTS idx_customers_customer_type
    ON customers(customer_type);

CREATE INDEX IF NOT EXISTS idx_customers_registration_date
    ON customers(registration_date);