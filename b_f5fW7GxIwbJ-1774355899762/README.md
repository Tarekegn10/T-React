# DocuFlow - Document Management System

A secure, web-based Document Management System (DMS) designed for medium-sized organizations. Built with Next.js 16, React 19, Tailwind CSS, and PostgreSQL.

## Features

### Core Functionality
- **Document Upload** - Upload documents with drag-and-drop support (max 10MB)
- **Three Document Types** - Received, Sent, and Contract documents with type-specific forms
- **Department Organization** - Organize documents by department/category
- **Advanced Search** - Search by title, reference number, department, type, and date range
- **Document Tracking** - Track document status (Pending, Received, Sent, Archived)
- **Document Sharing** - Share documents with other users via email

### User Management
- **Role-Based Access Control** - Admin, Manager, and User roles with different permissions
- **Employee Management** - Full CRUD operations for employee records
- **User Profiles** - Editable profiles with avatar upload, contact info, and preferences
- **Session Management** - Secure JWT-based authentication with session tracking

### Dashboard & Reports
- **Dashboard Overview** - Document statistics, recent documents, quick actions, activity feed
- **Reports & Analytics** - Charts showing document activity, status distribution, department breakdown
- **Export Options** - Export reports to Excel or PDF format

### Admin Features
- **Admin Settings** - System configuration, user management, backup settings
- **Audit Logging** - Track all document actions (created, viewed, edited, shared, deleted)
- **Data Export** - Bulk export system data
- **Backup System** - Manual and automatic backup options

## Document Types

### Received Documents
Fields: File Document Number, Day and Date, Received Date, Company Name, Address, To Whom, Department, Subject, Remark

### Sent Documents
Fields: File Document Number, Day and Date, Sent Date, Company Name, Address, Forwarded To, Department, Subject, Remark

### Contract Documents
Fields: File Document Number, Day and Date, Date (Ethiopian Calendar), Company Name, Address, Department, Subject, Remark

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS v4, shadcn/ui
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt password hashing
- **Charts**: Recharts
- **Icons**: Lucide React

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE docuflow;

# Connect to the database
\c docuflow
```

### 2. Run Schema Migration

Run the SQL schema file located at `scripts/database-schema.sql`:

```bash
psql -U postgres -d docuflow -f scripts/database-schema.sql
```

This will create:
- All required tables (users, documents, departments, sessions, notifications, etc.)
- Indexes for performance
- Triggers for automatic timestamps
- Views for reporting
- Default seed data (departments, admin user)

### 3. Database Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with roles and preferences |
| `departments` | Department/category definitions |
| `documents` | All document records with metadata |
| `document_shares` | Document sharing records |
| `document_activities` | Audit log of document actions |
| `sessions` | User authentication sessions |
| `notifications` | User notifications |
| `system_settings` | Global system configuration |
| `backup_history` | Backup operation log |

### 4. Default Accounts

After running the schema, these accounts are available:

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Admin | admin | admin123 | admin@company.com |
| User | user | user123 | user@company.com |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Documents
- `GET /api/documents` - List documents (with filters)
- `POST /api/documents` - Create document
- `GET /api/documents/[id]` - Get single document
- `PUT /api/documents/[id]` - Update document
- `DELETE /api/documents/[id]` - Delete document
- `POST /api/documents/[id]/share` - Share document

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user (admin only)
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (admin only)

### Departments
- `GET /api/departments` - List departments with counts
- `POST /api/departments` - Create department (admin only)

### Other
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications` - Mark notifications as read
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/reports` - Reports data with filters
- `POST /api/upload` - Upload file
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update settings (admin only)

## Project Structure

```
app/
├── api/                   # API routes
│   ├── auth/              # Authentication endpoints
│   ├── documents/         # Document CRUD
│   ├── users/             # User management
│   ├── departments/       # Department management
│   ├── notifications/     # Notifications
│   ├── dashboard/         # Dashboard stats
│   ├── reports/           # Reports data
│   ├── upload/            # File uploads
│   └── settings/          # System settings
├── (dashboard)/           # Protected dashboard routes
│   ├── page.tsx           # Dashboard
│   ├── documents/         # Documents list
│   ├── upload/            # Upload documents
│   ├── search/            # Advanced search
│   ├── categories/        # Department categories
│   ├── reports/           # Reports & analytics
│   ├── users/             # Employee management
│   ├── settings/          # User settings
│   ├── profile/           # User profile
│   └── admin-settings/    # Admin-only settings
├── login/                 # Login page
└── layout.tsx             # Root layout

lib/
├── db.ts                  # Database connection pool
├── auth.ts                # Authentication utilities
└── utils.ts               # General utilities

scripts/
└── database-schema.sql    # Complete database schema

components/
├── app-sidebar.tsx        # Main navigation sidebar
├── header.tsx             # Page header with search
├── auth-guard.tsx         # Route protection
├── dashboard/             # Dashboard components
├── documents/             # Document table & actions
├── upload/                # Upload zone & forms
├── categories/            # Category grid
├── reports/               # Charts & stats
├── users/                 # Employee table
├── settings/              # Settings forms
└── ui/                    # shadcn/ui components

contexts/
└── auth-context.tsx       # Authentication state
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Database Connection
DATABASE_URL=postgresql://postgres:password@localhost:5432/docuflow

# Or use individual parameters:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=docuflow
# DB_USER=postgres
# DB_PASSWORD=your_password

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# File Upload Directory (optional, defaults to public/uploads)
UPLOAD_DIR=./public/uploads
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd docuflow

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Set up the database
psql -U postgres -d docuflow -f scripts/database-schema.sql

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

```bash
pnpm build
pnpm start
```

## User Roles & Permissions

### Administrator
- Full system access
- Manage all users and roles
- Configure departments
- Access admin settings
- View all documents
- Backup/restore data
- Update system settings

### Manager
- View department documents
- Approve documents
- Generate reports
- Manage team members

### User (Secretary/Staff)
- Upload and register documents
- Edit own documents
- Assign documents to departments
- Track document status
- View assigned documents

## Department Structure

Default departments (customizable):
- Finance
- Human Resources
- Legal
- Operations
- Marketing
- IT Department
- Executive
- Procurement

## Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Tokens** - Secure session management
- **HTTP-Only Cookies** - Protection against XSS
- **Role-Based Access** - Granular permissions
- **Audit Logging** - Track all actions
- **Session Tracking** - Device and IP logging

## Future Enhancements

- [ ] Email notifications (SMTP integration)
- [ ] Document versioning
- [ ] PDF preview and thumbnails
- [ ] Dark mode support
- [ ] Ethiopian calendar date picker component
- [ ] Document approval workflow
- [ ] Full-text search with PostgreSQL
- [ ] File storage with cloud providers (AWS S3, Cloudinary)
- [ ] Two-factor authentication
- [ ] API rate limiting
- [ ] Document OCR scanning
- [ ] Bulk document operations
- [ ] Document templates
- [ ] Mobile responsive improvements
- [ ] Print-friendly document views

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
psql -U postgres -d docuflow -c "SELECT 1"

# Check environment variables
echo $DATABASE_URL
```

### Common Errors

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | PostgreSQL is not running or wrong port |
| `password authentication failed` | Check DB_PASSWORD in .env.local |
| `database "docuflow" does not exist` | Run: `createdb docuflow` |
| `relation "users" does not exist` | Run the schema migration |
| `JWT_SECRET is not defined` | Add JWT_SECRET to .env.local |

### Reset Database

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS docuflow"
psql -U postgres -c "CREATE DATABASE docuflow"
psql -U postgres -d docuflow -f scripts/database-schema.sql
```

### Clear Sessions (Force Logout All Users)

```sql
DELETE FROM sessions;
```

## File Storage

### Local Storage (Default)
Files are stored in `public/uploads/` directory by default. The folder structure:
```
public/uploads/
├── documents/      # Document files
├── avatars/        # User profile images
└── temp/           # Temporary uploads
```

### Cloud Storage (Production)
For production, configure cloud storage:

```env
# AWS S3
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET_NAME=docuflow-files
AWS_REGION=us-east-1

# Or Cloudinary
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

## Backup & Restore

### Manual Backup

```bash
# Backup database
pg_dump -U postgres docuflow > backup_$(date +%Y%m%d).sql

# Backup with data and schema
pg_dump -U postgres -Fc docuflow > backup_$(date +%Y%m%d).dump
```

### Restore from Backup

```bash
# Restore from SQL file
psql -U postgres -d docuflow < backup_20240101.sql

# Restore from dump file
pg_restore -U postgres -d docuflow backup_20240101.dump
```

### Automated Backups
Configure in Admin Settings or use cron:
```bash
# Daily backup at 2 AM
0 2 * * * pg_dump -U postgres docuflow > /backups/docuflow_$(date +\%Y\%m\%d).sql
```

## Performance Tips

1. **Database Indexes** - The schema includes indexes on frequently queried columns
2. **Connection Pooling** - Uses pg Pool for efficient connections
3. **Pagination** - All list endpoints support pagination
4. **Lazy Loading** - Components load data as needed
5. **Image Optimization** - Use Next.js Image component for avatars

## Ethiopian Calendar Integration

The Contract document type includes an Ethiopian calendar date field. To implement a full Ethiopian calendar picker:

```tsx
// Example Ethiopian date conversion
const toEthiopian = (gregorianDate: Date) => {
  // Ethiopian calendar is ~7-8 years behind Gregorian
  // Implementation depends on your calendar library
}

const toGregorian = (ethiopianDate: string) => {
  // Convert back to Gregorian for storage
}
```

Recommended library: `ethiopic-calendar` or implement using the `Ethiopic.js` algorithm.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Add comments for complex logic
- Update README for new features

## Changelog

### Version 1.0.0
- Initial release
- Three document types (Received, Sent, Contract)
- User authentication with roles
- Dashboard with statistics
- Document search and filtering
- Department organization
- Reports and analytics
- Admin settings panel
- Employee management
- User profiles
- PostgreSQL database backend
- REST API endpoints

## License

TAREKEGN TADEL 

## Support

For support:
- Open an issue in the repository
- Contact the system administrator
- Email: Tarekegntadeleg2mail@gmail.com

---

Built with Next.js, React, and PostgreSQL
