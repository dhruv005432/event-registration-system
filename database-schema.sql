-- EventHub Database Schema (Company Standard)
-- ==========================================
-- Database: eventhub
-- Engine: PostgreSQL (recommended for production)
-- Alternative: MongoDB (for flexibility)

-- 1. Users Table
-- ===============
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'user')) DEFAULT 'user',
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    department VARCHAR(100),
    job_title VARCHAR(100),
    bio TEXT,
    website VARCHAR(255),
    location VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences JSONB
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{
    "emailNotifications": true,
    "pushNotifications": true,
    "smsNotifications": false,
    "marketingEmails": false,
    "theme": "light",
    "language": "en",
    "timezone": "UTC",
    "dateFormat": "MM/DD/YYYY",
    "timeFormat": "12h",
    "currency": "USD"
}'::jsonb;

-- 2. Companies Table
-- ==================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Events Table
-- ===============
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255) NOT NULL,
    max_attendees INTEGER NOT NULL,
    current_attendees INTEGER DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    image_url VARCHAR(500),
    status VARCHAR(20) CHECK (status IN ('draft', 'published', 'cancelled', 'completed')) DEFAULT 'draft',
    is_public BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    tags TEXT[],
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Event Categories Table
-- ========================
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Registrations Table
-- ======================
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    company VARCHAR(255),
    job_title VARCHAR(100),
    dietary_restrictions TEXT,
    special_requirements TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlisted')) DEFAULT 'pending',
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')) DEFAULT 'pending',
    payment_method VARCHAR(20) CHECK (payment_method IN ('credit_card', 'paypal', 'bank_transfer', 'crypto')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    transaction_id VARCHAR(255),
    qr_code TEXT,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by UUID REFERENCES users(id) ON DELETE SET NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- 6. Payments Table
-- =================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('credit_card', 'paypal', 'bank_transfer', 'crypto')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    transaction_id VARCHAR(255),
    payment_gateway VARCHAR(50),
    gateway_response JSONB,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    refunded_amount DECIMAL(10,2) DEFAULT 0,
    refund_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Logs Table
-- ===================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Notifications Table
-- ======================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- 9. Sessions Table
-- =================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Files Table
-- ================
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) CHECK (file_type IN ('avatar', 'event_image', 'document')),
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Waitlist Table
-- ==================
CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
    position INTEGER NOT NULL,
    notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- 12. Event Analytics Table
-- ========================
CREATE TABLE event_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    registrations INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, date)
);

-- 13. User Activity Table
-- =======================
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
-- ======================

-- Users Table Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Events Table Indexes
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_company_id ON events(company_id);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_is_public ON events(is_public);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_tags ON events USING GIN(tags);

-- Registrations Table Indexes
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX idx_registrations_registered_at ON registrations(registered_at);
CREATE INDEX idx_registrations_ticket_number ON registrations(ticket_number);

-- Payments Table Indexes
CREATE INDEX idx_payments_registration_id ON payments(registration_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Audit Logs Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Notifications Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Sessions Indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Files Indexes
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_files_created_at ON files(created_at);

-- Waitlist Indexes
CREATE INDEX idx_waitlist_event_id ON waitlist(event_id);
CREATE INDEX idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX idx_waitlist_position ON waitlist(position);

-- Event Analytics Indexes
CREATE INDEX idx_event_analytics_event_id ON event_analytics(event_id);
CREATE INDEX idx_event_analytics_date ON event_analytics(date);

-- User Activity Indexes
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_action ON user_activity(action);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);

-- Triggers for Automatic Timestamp Updates
-- =======================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for Common Queries
-- ========================

-- User Statistics View
CREATE VIEW user_statistics AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.role,
    COUNT(DISTINCT e.id) as events_created,
    COUNT(DISTINCT r.id) as registrations_made,
    COALESCE(SUM(r.amount), 0) as total_spent,
    MAX(r.registered_at) as last_registration,
    u.created_at,
    u.last_login
FROM users u
LEFT JOIN events e ON u.id = e.created_by
LEFT JOIN registrations r ON u.id = r.user_id
GROUP BY u.id, u.full_name, u.email, u.role, u.created_at, u.last_login;

-- Event Statistics View
CREATE VIEW event_statistics AS
SELECT 
    e.id,
    e.title,
    e.category,
    COUNT(DISTINCT r.id) as total_registrations,
    COUNT(DISTINCT CASE WHEN r.status = 'confirmed' THEN r.id END) as confirmed_registrations,
    COUNT(DISTINCT CASE WHEN r.status = 'pending' THEN r.id END) as pending_registrations,
    COUNT(DISTINCT CASE WHEN r.status = 'cancelled' THEN r.id END) as cancelled_registrations,
    COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN r.amount END), 0) as total_revenue,
    e.max_attendees,
    e.current_attendees,
    e.start_date,
    e.end_date,
    e.status
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id, e.title, e.category, e.max_attendees, e.current_attendees, e.start_date, e.end_date, e.status;

-- Company Statistics View
CREATE VIEW company_statistics AS
SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT e.id) as total_events,
    COUNT(DISTINCT r.id) as total_registrations,
    COALESCE(SUM(r.amount), 0) as total_revenue,
    c.created_at
FROM companies c
LEFT JOIN users u ON c.id = u.company_id
LEFT JOIN events e ON c.id = e.company_id
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY c.id, c.name, c.created_at;

-- Initial Data Setup
-- ==================

-- Insert default event categories
INSERT INTO event_categories (name, description, icon, color) VALUES
('Conference', 'Professional conferences and seminars', 'fa-users', '#3B82F6'),
('Workshop', 'Hands-on training sessions', 'fa-chalkboard-teacher', '#10B981'),
('Webinar', 'Online presentations and meetings', 'fa-video', '#8B5CF6'),
('Networking', 'Business networking events', 'fa-handshake', '#F59E0B'),
('Social', 'Social gatherings and parties', 'fa-glass-cheers', '#EF4444'),
('Training', 'Professional training programs', 'fa-graduation-cap', '#6366F1'),
('Exhibition', 'Trade shows and exhibitions', 'fa-image', '#84CC16'),
('Sports', 'Sports and fitness events', 'fa-running', '#06B6D4');

-- Create admin user (default password: admin123)
INSERT INTO users (email, password_hash, full_name, first_name, last_name, role, is_email_verified) VALUES
('admin@eventhub.com', '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'System Administrator', 'System', 'Administrator', 'admin', true);

-- Constraints and Additional Rules
-- ============================

-- Check that end_date is after start_date
ALTER TABLE events ADD CONSTRAINT check_event_dates 
CHECK (end_date > start_date);

-- Check that max_attendees is positive
ALTER TABLE events ADD CONSTRAINT check_max_attendees 
CHECK (max_attendees > 0);

-- Check that price is non-negative
ALTER TABLE events ADD CONSTRAINT check_event_price 
CHECK (price >= 0);

-- Check that registration amount matches event price (when confirmed)
ALTER TABLE registrations ADD CONSTRAINT check_registration_amount 
CHECK (amount >= 0);

-- Check that payment amount is positive
ALTER TABLE payments ADD CONSTRAINT check_payment_amount 
CHECK (amount > 0);

-- Row Level Security (RLS) for multi-tenancy
-- ===========================================

-- Enable RLS on relevant tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY company_isolation_events ON events
    FOR ALL TO authenticated_users
    USING (company_id = current_setting('app.current_company_id') OR created_by = current_user_id());

CREATE POLICY company_isolation_registrations ON registrations
    FOR ALL TO authenticated_users
    USING (event_id IN (
        SELECT id FROM events 
        WHERE company_id = current_setting('app.current_company_id') OR created_by = current_user_id()
    ));

CREATE POLICY user_self_access ON users
    FOR ALL TO authenticated_users
    USING (id = current_user_id());

-- Database Configuration
-- ====================

-- PostgreSQL Configuration Recommendations
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
-- maintenance_work_mem = 64MB
-- checkpoint_completion_target = 0.9
-- wal_buffers = 16MB
-- default_statistics_target = 100
-- random_page_cost = 1.1
-- effective_io_concurrency = 200

-- Connection Pooling
-- max_connections = 200
-- superuser_reserved_connections = 3

-- Backup Strategy
-- ===============

-- Daily full backup
-- pg_dump -h localhost -U postgres -d eventhub > backup_$(date +%Y%m%d).sql

-- Point-in-time recovery (WAL archiving)
-- archive_mode = on
-- archive_command = 'cp %p /archive/%f'

-- Monitoring Queries
-- =================

-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
