# NU LAGUNA Academic Scheduling System

## Project Overview
A web-based academic scheduling system that automatically generates course schedules for NU LAGUNA university's computer studies programs (BSIT, BSCS, BSIS) using a greedy algorithm approach.

## Current State
✅ **System fully implemented and ready for use!**

The system includes:
- Backend API (Express.js on port 3000) with all endpoints
- Frontend UI (React/Vite on port 5000) with complete workflow
- Greedy scheduling algorithm with proper constraint enforcement
- MySQL database schema (requires XAMPP setup)
- Multiple schedule views and Excel export
- Robust error handling and database connectivity status

**Next Step**: Set up MySQL database in XAMPP (see SETUP.md)

## Tech Stack
- **Frontend**: React, Vite, Axios, XLSX
- **Backend**: Node.js, Express.js
- **Database**: MySQL (requires XAMPP setup)
- **Algorithm**: Greedy scheduling with constraint handling

## Key Features
1. Automatic section generation (12-40 students per section)
2. Course management for BSIT, BSCS, BSIS programs
3. Room allocation (Lecture and Laboratory rooms)
4. Greedy scheduling algorithm with hard constraint enforcement
5. Multiple schedule views (by section, by room)
6. Excel export functionality
7. Conflict detection and reporting

## Project Structure
```
/
├── backend/
│   ├── server.js          # Express API server
│   ├── scheduler.js       # Greedy scheduling algorithm
│   ├── db.js             # MySQL connection pool
│   └── database.sql      # Database schema
├── frontend/
│   └── src/
│       ├── App.jsx       # Main React application
│       └── App.css       # Styling
├── SETUP.md              # Setup instructions
└── package.json          # Node.js configuration
```

## Database Setup Required
The user needs to:
1. Start MySQL in XAMPP
2. Create database: `nu_scheduling`
3. Run the SQL schema from `backend/database.sql`

Default connection settings:
- Host: localhost
- User: root
- Password: (empty)
- Database: nu_scheduling

## Scheduling Algorithm
The greedy algorithm prioritizes:
1. Lecture+Lab courses first (harder to schedule)
2. Courses with most sections
3. Earliest available time slots

Constraints enforced:
- No room double-booking
- No section conflicts
- Correct room types (lecture vs lab)
- 7:00 AM - 9:00 PM window
- Monday-Saturday only

## Time Slot Options
**Pure Lecture (4 hours)**:
- Option A: 2 hours on two days (Mon+Thu, Tue+Fri, Wed+Sat)
- Option B: 4 hours straight once a week

**Lecture+Lab courses**:
- Lecture (2.67 hrs): Once per week or split into 1.34 hrs on two days
- Lab (4 hrs): Once per week or split into 2 hrs on two days

## Recent Changes (October 2, 2025)
- ✅ Implemented complete frontend with 6-tab workflow navigation
- ✅ Created greedy scheduling algorithm with proper constraint enforcement:
  - Tracks both room AND section occupancy (prevents double-booking)
  - Uses actual course hours from database (hours_lecture, hours_lab)
  - Respects individual room availability windows (start_time, end_time)
- ✅ Set up MySQL database schema with all required tables
- ✅ Added robust error handling throughout the application
- ✅ Frontend gracefully handles database connection failures
- ✅ Configured Vite for Replit environment (allowedHosts)
- ✅ Set up workflows for backend (port 3000) and frontend (port 5000)
- ✅ Added database connectivity status indicators
- ✅ Created SETUP.md with complete instructions

## User Preferences
None documented yet.

## Notes
- Backend runs on port 3000 (API endpoints)
- Frontend runs on port 5000 (user interface)
- MySQL must be configured separately (XAMPP)
- System supports up to 4 year levels for each of 3 programs
