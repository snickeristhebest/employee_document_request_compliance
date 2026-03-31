Employee Document Request & Compliance System — MVP Specification
1. Overview
Purpose:
Build an internal system to request documents from employees, track submission and approval, manage expiration of certifications, and automate reminders.

Core Value:
Move from manual tracking to a system-driven compliance workflow.
2. User Roles
Admin:
- Manage employees
- Create/manage requests
- Review documents
- Approve/reject

Employee:
- View own requests
- Submit documents
3. Authentication Model
- No public signup
- First admin created manually
- Admins create all users

Employee Login Flow:
1. Admin creates employee
2. Admin creates login
3. Employee receives temp password
4. Employee must change password on first login
4. Core Entities
Employees:
- id, first_name, last_name, email, clinic, is_active

Users:
- id, employee_id, username, password_hash, role, must_change_password, is_active

DocumentRequests:
- id, employee_id, document_type, title, description, status,
  due_date, expiration_required, expiration_date, file_url,
  submitted_at, approved_at, rejected_reason
5. Status System
Stored:
- requested
- submitted
- approved
- rejected

Derived:
- overdue (past due date)
- expired (past expiration date)
6. Screens
Admin:
- Create Employee
- View Employees
- View Employee Documents
- Create Request
- View Requests
- View Request
- Edit Request
- Create User Account

Employee:
- Login
- Change Password
- View My Requests
- Submit Request
7. Email System
Triggers:
- Request created → notify employee
- Document submitted → notify admin
- Expiration reminders → notify employee
8. Reminder System
Daily job checks:
- Due soon
- Overdue
- Expiring

Default reminders:
- 30 days
- 14 days
- 7 days
- daily after expiration
9. File Storage
- Store files in cloud (GCS or Firebase)
- Save file URLs
- Restrict access by role
10. Permissions
Admin:
- Full access

Employee:
- Limited to own data and submissions
11. Validation Rules
- Required fields enforced
- Cannot approve without file
- Cannot reject without reason
- File type and size restrictions
- Username unique
- Password hashed
12. Development Phases
Phase 1: Core system
Phase 2: Automation (email + reminders)
Phase 3: Polish + deployment
13. Time Estimate
Core: 40–50 hours
Auth: 10–20 hours
Automation: 15–20 hours
Polish: 10–20 hours

Total: 70–100 hours
14. Design Principles
- Keep it simple
- Avoid overengineering
- Prioritize working flow over UI


