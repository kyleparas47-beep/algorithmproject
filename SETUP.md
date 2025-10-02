# NU LAGUNA Academic Scheduling System - Setup Guide

## Database Setup (MySQL via XAMPP)

### Step 1: Start MySQL in XAMPP
1. Open XAMPP Control Panel
2. Start the MySQL service

### Step 2: Create Database
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Create a new database named `nu_scheduling`
3. Import the database schema:
   - Navigate to the `backend/database.sql` file
   - Copy its contents
   - Go to phpMyAdmin > nu_scheduling database > SQL tab
   - Paste and execute the SQL

Alternatively, run this command in your MySQL client:
```bash
mysql -u root -p < backend/database.sql
```

### Step 3: Configure Database Connection
The system uses these default MySQL settings:
- Host: localhost
- User: root  
- Password: (empty)
- Database: nu_scheduling

If your MySQL uses different credentials, you'll need to set environment variables in Replit Secrets:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME

## Running the Application

### Backend Server (Port 3000)
The backend runs on port 3000 and handles all API requests and the scheduling algorithm.

```bash
npm run server
```

### Frontend (Port 5000)
The frontend runs on port 5000 and provides the user interface.

```bash
npm run frontend
```

### Run Both Together
```bash
npm run dev
```

## System Requirements

- Node.js 20+
- MySQL 5.7+ (via XAMPP or standalone)
- Modern web browser

## Workflow

1. **Input Enrollment Data**: Enter student numbers for each program/year
2. **Generate Sections**: System auto-creates sections (12-40 students each)
3. **Add Courses**: Input courses for each program and year level
4. **Add Rooms**: Configure lecture and laboratory rooms
5. **Generate Schedule**: Run the greedy scheduling algorithm
6. **View & Export**: Review schedules by section or room, export to Excel

## Troubleshooting

### Database Connection Errors
- Ensure MySQL is running in XAMPP
- Verify database credentials
- Check if database `nu_scheduling` exists

### API Connection Errors
- Ensure backend server is running on port 3000
- Check browser console for specific error messages

### Schedule Conflicts
- Add more rooms (especially laboratories)
- Reduce number of courses or sections
- Extend room operating hours
