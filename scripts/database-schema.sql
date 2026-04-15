-- DocuFlow Document Management System
-- PostgreSQL Database Schema
-- Run this script to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Folder',
    color VARCHAR(50) DEFAULT 'gray',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(100),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    email_notifications BOOLEAN DEFAULT true,
    document_approvals BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT false,
    system_alerts BOOLEAN DEFAULT true,
    two_factor_enabled BOOLEAN DEFAULT false,
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    employee_number VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    position VARCHAR(100),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for authentication
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    device_info TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DOCUMENTS
-- ============================================

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    subject TEXT,
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('received', 'sent', 'contract')),
    file_url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    file_type TEXT,
    
    -- Common fields
    day_and_date DATE,
    company_name VARCHAR(255),
    address TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    remark TEXT,
    
    -- Type-specific fields
    received_date DATE,           -- For 'received' type
    to_whom VARCHAR(255),         -- For 'received' type
    sent_date DATE,               -- For 'sent' type
    forwarded_to VARCHAR(255),    -- For 'sent' type
    ethiopian_date VARCHAR(50),   -- For 'contract' type (Ethiopian calendar)
    
    -- Status and priority
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'sent', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Metadata
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document sharing table
CREATE TABLE document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    send_email BOOLEAN DEFAULT false,
    viewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document activity log
CREATE TABLE document_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'viewed', 'edited', 'shared', 'deleted', 'status_changed'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name VARCHAR(255) DEFAULT 'Acme Corporation',
    contact_email VARCHAR(255) DEFAULT 'admin@acme.com',
    address TEXT DEFAULT '123 Business Street, Suite 100',
    auto_backup_enabled BOOLEAN DEFAULT true,
    backup_frequency VARCHAR(20) DEFAULT 'daily',
    last_backup_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Backup history
CREATE TABLE backup_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type VARCHAR(20) NOT NULL, -- 'auto', 'manual'
    file_name VARCHAR(255),
    file_size BIGINT,
    status VARCHAR(20) DEFAULT 'completed',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_documents_department ON documents(department_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_document_shares_document ON document_shares(document_id);
CREATE INDEX idx_document_shares_shared_with ON document_shares(shared_with);
CREATE INDEX idx_document_activities_document ON document_activities(document_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_email ON employees(email);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default departments
INSERT INTO departments (name, description, icon, color) VALUES
    ('Finance', 'Financial documents and reports', 'DollarSign', 'green'),
    ('Human Resources', 'HR documents and employee records', 'Users', 'blue'),
    ('Legal', 'Legal documents and contracts', 'Scale', 'amber'),
    ('Operations', 'Operational documents', 'Settings', 'gray'),
    ('Marketing', 'Marketing materials and campaigns', 'Megaphone', 'pink'),
    ('IT Department', 'IT policies and technical documents', 'Monitor', 'purple'),
    ('Executive', 'Executive communications', 'Briefcase', 'indigo'),
    ('Procurement', 'Procurement and vendor documents', 'ShoppingCart', 'orange');

-- Create production users manually after deployment.
-- Example:
-- INSERT INTO users (username, email, password_hash, name, role, status)
-- VALUES ('admin', 'admin@example.com', '<bcrypt hash>', 'Administrator', 'admin', 'active');

-- Insert default system settings
INSERT INTO system_settings (organization_name, contact_email, address) VALUES
    ('Acme Corporation', 'admin@acme.com', '123 Business Street, Suite 100');

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Document statistics view
CREATE VIEW document_stats AS
SELECT 
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE document_type = 'received') as received_count,
    COUNT(*) FILTER (WHERE document_type = 'sent') as sent_count,
    COUNT(*) FILTER (WHERE document_type = 'contract') as contract_count,
    COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days
FROM documents;

-- Documents by department view
CREATE VIEW documents_by_department AS
SELECT 
    d.id as department_id,
    d.name as department_name,
    COUNT(doc.id) as document_count
FROM departments d
LEFT JOIN documents doc ON d.id = doc.department_id
GROUP BY d.id, d.name
ORDER BY document_count DESC;

-- Monthly activity view
CREATE VIEW monthly_document_activity AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    document_type,
    COUNT(*) as count
FROM documents
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at), document_type
ORDER BY month DESC;
