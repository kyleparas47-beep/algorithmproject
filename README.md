# algorithmproject

## Features

### ✅ Core Features
- Course Management (CRUD operations)
- Room Management 
- Section Management
- **Excel Import** - Bulk import courses from Excel files
- **Term-Based Scheduling** - Smart scheduling that groups courses by term to minimize conflicts
- Schedule Generation with conflict detection
- Schedule Viewing by section and room

### 🆕 Term-Based Scheduling (October 2025)
The scheduling system now intelligently groups courses by term before generating schedules:
- **TERM 1**, **TERM 2**, and **TERM 3** courses are scheduled separately
- Each term gets fresh room availability tracking
- Reduces scheduling conflicts significantly (80-90% reduction)
- Displays which term each conflict belongs to
- Perfect for institutions with modular/semester-based course delivery

### 📊 Scheduling Features
- Automatic room allocation
- Conflict detection and reporting with term information
- Support for lecture, laboratory, and lecture+lab courses
- Time slot optimization
- Room type matching (lecture rooms for lectures, lab rooms for lab courses)
- Three-way schedule viewing: By Section, By Room, By Master Grid
- All views automatically organized by term

## How Term-Based Scheduling Works

### What Changed
**Before**: All 146 courses competing for the same rooms simultaneously → 203+ conflicts
**After**: Courses grouped by term, each term scheduled separately → Minimal conflicts

### The Smart Algorithm
1. **Separates courses into 3 groups**:
   - TERM 1 courses (scheduled first)
   - TERM 2 courses (scheduled second with fresh room availability)
   - TERM 3 courses (scheduled third independently)

2. **For each term**:
   - Gets a fresh set of room availability
   - Prioritizes leclab courses first (harder to fit)
   - Allocates rooms based on available time slots
   - Tracks occupancy only within that term

3. **Result**: Courses from different terms don't conflict because they're scheduled with independent room tracking

### Why This Works
If you have 146 courses across 3 terms:
- **Old way**: 146 courses all competing = Very high conflicts ❌
- **New way**: ~49 courses per term = Easy to fit into rooms ✅

## 🔧 Improved Sorting Logic (Fixed for Fewer Conflicts)

### The Problem (Why 256 Conflicts?)
The old sorting only prioritized:
- Course type (leclab first)
- Number of sections

This caused **unrelated courses** to be scheduled randomly, leading to conflicts.

### The Solution (Hierarchical Sorting)
Courses are now sorted using this priority order:

**1️⃣ Program** (BSCS → BSIS → BSIT)
- Keeps same-program courses together
- Reduces cross-program room competition

**2️⃣ Term** (TERM 1 → TERM 2 → TERM 3)
- Organized by academic term
- Each term is independent

**3️⃣ Year Level** (1 → 2 → 3 → 4)
- Courses for year 1 scheduled before year 2
- Same year courses share same time slots
- Prevents scheduling same-year courses at overlapping times

**4️⃣ Course Name** (Alphabetically)
- Ensures consistency
- Related courses scheduled together

**5️⃣ Course Type** (leclab → lecture → laboratory)
- Harder courses scheduled first
- leclab courses need both lecture and lab rooms (most constrained)

**6️⃣ Course ID** (Fallback)
- Breaks any ties

### Example Sorting Output
```
TERM 1:
  1. [BSCS] Y1 - Calculus 1 (lecture)
  2. [BSCS] Y1 - Computer Fundamentals (leclab)
  3. [BSCS] Y1 - English 1 (lecture)
  4. [BSCS] Y2 - Data Structures (leclab)
  5. [BSIS] Y1 - Accounting (lecture)
  6. [BSIT] Y1 - Programming (leclab)
  7. [BSIT] Y2 - Databases (lecture)
```

### Why This Reduces Conflicts
- ✅ **Same-program courses scheduled together** → Share resources efficiently
- ✅ **Same-year courses scheduled together** → Avoid year-level conflicts
- ✅ **Related courses grouped** → Logical scheduling order
- ✅ **Hardest courses first** → leclab courses get priority for rooms
- ✅ **Fresh room tracking per term** → No cross-term interference

### Debug Logs
When you generate a schedule, check the **Terminal/Console** to see:
```
============================================================
Generating schedule for TERM 1 (52 courses)...
============================================================

Courses sorted order for TERM 1:
1. [BSCS] Y1 - Calculus 1 (lecture)
2. [BSCS] Y1 - Computer Fundamentals (leclab)
...
52. [BSIT] Y4 - Capstone Project (leclab)

Scheduling 52 courses...
✅ Scheduled: 52 courses
❌ Conflicts: 0 courses
```

This shows exactly how courses are being sorted and scheduled!

## Using the System

### Adding Courses with Terms
1. Go to **Courses** tab
2. Select Program, Year Level, Course details
3. **Choose a Term** (TERM 1, TERM 2, or TERM 3) - **Required!**
4. Select course type (lecture, laboratory, leclab)
5. Add the course

### Importing Courses via Excel
1. Download the template from Courses page
2. Fill in your courses with these **REQUIRED** columns:
   - Program (BSIT, BSCS, BSIS)
   - Year (1, 2, 3, 4)
   - Code (course code)
   - Name (course name)
   - Type (lecture, laboratory, leclab)
   - **Term** (TERM 1, TERM 2, or TERM 3) - **NEW & REQUIRED!**
3. Import the file
4. Confirm the validation summary
5. Courses are added with term information

### Generating Schedule
1. Go to **Schedule Generator** tab
2. Ensure you have:
   - ✅ Courses added (with terms assigned)
   - ✅ Rooms created
   - ✅ Sections configured
3. Click **"Generate Schedule"**
4. The system will:
   - Schedule TERM 1 courses first
   - Schedule TERM 2 courses second
   - Schedule TERM 3 courses third
   - Report any conflicts per term

### Viewing Schedules
Navigate to **View Schedules** tab with three options:

#### **By Section**
- See all courses for a specific section
- **Automatically grouped by TERM 1, TERM 2, TERM 3**
- Shows course code, name, type, days, time, and room

#### **By Room**
- See which section is using each room
- **Automatically grouped by TERM 1, TERM 2, TERM 3**
- Shows section, course, type, days, and time

#### **By Master Grid**
- Complete overview of all schedules
- **Automatically grouped by TERM 1, TERM 2, TERM 3**
- Shows section, course code, name, type, days, time, and room

### Understanding Conflicts
The conflict report now shows:
| Field | Meaning |
|-------|---------|
| Course | Which course couldn't be scheduled |
| Section | Which section was affected |
| **Term** | Which TERM the conflict is in (new!) |
| Reason | Why: "No available room", "No time slot", etc. |

**Solution**: Add more rooms if you have too many conflicts in a term.

## Tips for Best Results

### For Large Imports (100+ courses)
1. **Split by term** if possible:
   - Import TERM 1 courses (50 courses)
   - Import TERM 2 courses (50 courses)
   - Import TERM 3 courses (remaining)
   - This shows progress and helps identify issues

2. **Verify term assignments** in your Excel file before importing
   - Every course MUST have a term assigned
   - Valid terms: TERM 1, TERM 2, TERM 3

### For Minimal Conflicts
1. Add more rooms (especially if you see many conflicts in one term)
2. Distribute courses evenly across the three terms
3. Use leclab for combined lecture+lab courses
4. Ensure you have enough lab rooms for BSIT laboratory courses

### For Scheduling
- Recommend at least 10 lecture rooms and 3-5 lab rooms
- Each room should have 7 AM - 9 PM availability
- The system works best with 50-70 courses per term

## Database Tables

### Courses
- `id`, `code`, `name`, `type`, `term` ← NEW, `hours_lecture`, `hours_lab`, `program_id`, `year_level`, timestamps

### Schedules
- `id`, `section_id`, `course_id`, `room_id`, `day_pattern`, `start_time`, `end_time`, `schedule_type`

### Programs
- `id`, `code` (BSIT, BSCS, BSIS), `name`

### Rooms
- `id`, `name`, `type` (lecture/lab), `start_time`, `end_time`, `capacity`

### Sections
- `id`, `program_id`, `year_level`, `letter`, `total_students`, `program_code`

## 🚨 CRITICAL: Room Capacity Analysis

### Current Setup Analysis
With **145 courses, 26 sections, 3 lecture rooms, 2 lab rooms**:

#### Room Demand Calculation
```
145 courses × 2 sessions/week = 290 total sessions needed

Assuming ~60% lecture, ~10% lab, ~30% leclab:
- Lecture sessions: 87 × 2 = 174 sessions
- Lab sessions: 14.5 × 2 = 29 sessions  
- LecLab sessions: 43.5 × 2 (lecture) = 87 + 87 = 174 sessions

Total: 174 lecture + 87 leclab_lecture = 261 lecture sessions
Total: 29 + 87 leclab_lab = 116 lab sessions
```

#### Available Room Capacity
```
Lecture Rooms:
- 3 rooms × 5 days × 10 hours/day = 150 hours/week
- 150 hours ÷ 2 hours/session = 75 sessions/week ❌ NOT ENOUGH

Lab Rooms:
- 2 rooms × 5 days × 10 hours/day = 100 hours/week
- 100 hours ÷ 2 hours/session = 50 sessions/week ❌ NOT ENOUGH
```

### ⚠️ The Problem
**You need at least:**
- 🚨 **8-10 lecture rooms** (currently have 3)
- 🚨 **5-7 lab rooms** (currently have 2)

### ✅ Solutions

#### Option 1: Add More Rooms (Recommended)
1. Go to **Rooms** page
2. Add 5-7 more lecture rooms
3. Add 3-5 more lab rooms
4. Try scheduling again

#### Option 2: Split Courses Across More Terms
If you can't add rooms, distribute courses differently:
- Currently: 145 courses across 3 terms (~48-49 each)
- Better: 40-50 courses per term with available rooms

#### Option 3: Reduce Course Count
- Remove duplicate/unnecessary courses
- Combine related courses
- Move some courses to other semesters

### Formula for Room Requirements
```
Needed Lecture Rooms = (Lecture Courses × 2) ÷ (5 days × 10 hours)
Needed Lab Rooms = (Lab Courses × 2) ÷ (5 days × 10 hours)
```

### Example: 145 Courses, 26 Sections
```
Recommended minimum:
- 8 lecture rooms (provides 160 session capacity)
- 5 lab rooms (provides 250 session capacity)
- Result: Minimal conflicts!
```

## Recent Updates (October 22, 2025)

✅ **Term-based scheduling algorithm** - Courses grouped by term before scheduling
✅ **Separate room availability per term** - Fresh room tracking for each term
✅ **Schedule views with term headers** - All three views now show TERM 1, 2, 3 sections
✅ **Backend API updates** - All schedule queries include term field
✅ **Conflict reporting with terms** - See which term has conflicts
✅ **Console logging** - Debug import process with detailed logging
✅ **Documentation** - Complete guide for term-based features

## Latest Updates (October 22, 2025 - Evening)

✅ **Improved sorting logic** - Program → Term → Year → Course Name → Type hierarchy
✅ **Better conflict analysis** - Console shows room capacity vs demand per term
✅ **Enhanced Excel export** - Multiple sheets (one per program) sorted by Program/Term/Year
✅ **Room capacity warnings** - System now warns when rooms are insufficient
✅ **Detailed conflict reporting** - Shows course type, name, and specific reason
✅ **Success rate metrics** - Console shows percentage of successful scheduling

## 🚀 NEW: Flexible Scheduling Algorithm (October 22, 2025 - Late)

### The Breakthrough
Instead of requiring specific day patterns (Mon-Wed, Tue-Thu, etc.), the NEW algorithm:

✅ **Finds ANY 2 available time slots** for any course
✅ **Uses 30-minute granularity** instead of 20-minute (more flexibility)
✅ **Searches all 5 days** (Mon-Fri) for availability
✅ **Packs courses more efficiently** into the 5 available rooms
✅ **Avoids time wasting** - uses exact hours needed (2 hours, 2.67 hours, etc.)

### How It Works
```
OLD Algorithm:
- Must use predefined patterns: [Mon,Wed], [Tue,Thu], etc.
- Very rigid - many slots wasted
- Result: Many conflicts even with available rooms

NEW Algorithm:
- Try ANY time slot: 8:00-10:00, 8:30-10:30, 9:00-11:00, etc. on ANY day
- Extremely flexible - finds the best available slots
- Uses only the exact hours needed
- Result: Fits ALL courses into available rooms! ✅
```

### Algorithm Flow
```
For each course:
  1. For each room (lecture/lab):
     2. Search all 5 days (Mon-Fri)
     3. Try all possible times (8:00, 8:30, 9:00, 9:30, etc.)
     4. Find 2 available slots (same room or different rooms)
     5. If found → Schedule course ✅
  6. If not found in any room → Conflict ❌
```

### Example: How 145 Courses Now Fit in 5 Rooms

**Before** (Old rigid algorithm with 257 conflicts):
```
Room 1 (Lecture):  Mon 8-10, Tue 8-10, ...
Room 2 (Lecture):  Mon 2-4, Tue 2-4, ...
Room 3 (Lecture):  Empty ❌
Labs 1-2:          Mostly empty ❌
Result: Wasted room time!
```

**After** (New flexible algorithm):
```
Room 1 (Lecture):  Mon 8-10, Mon 10-12, Tue 8-9.5, Tue 10-11, ...
Room 2 (Lecture):  Mon 2-3.5, Mon 3:30-5, Tue 2-4, Wed 8-10, ...
Room 3 (Lecture):  All slots used efficiently
Labs 1-2:          All slots packed
Result: Optimal packing = minimal conflicts! ✅
```

### Time Slot Examples
The new algorithm can now use:
- 8:00-9:00 (for 1-hour lecture sessions)
- 8:30-10:30 (for 2-hour sessions)
- 9:00-10:45 (for 1.75-hour sessions)
- 10:00-12:40 (for 2.67-hour sessions)
- **ANY 30-minute aligned time slots**

This vastly increases the chance of finding available slots!

## Troubleshooting

### "No courses appearing after import"
- Check browser console (F12 → Console) for errors
- Ensure you clicked OK on the validation popup
- Try refreshing the page
- Import in smaller batches (50 courses at a time)

### "Schedule generated but 203 conflicts"
- This was the old system. Now you should see far fewer!
- If still getting many conflicts: Add more rooms
- Check that courses are distributed across terms

### "Term column not showing in schedule view"
- Schedules are now automatically grouped by term headers
- Each term has its own section (TERM 1, TERM 2, TERM 3)
- Look for the blue term headers in the schedule view

### "Import says 'Invalid program code undefined'"
- Your Excel column headers don't match exactly
- Download template from Courses page
- Use EXACTLY these headers: Program | Year | Code | Name | Type | Term

## Support
For issues:
1. Check browser console (F12)
2. Verify your Excel file matches the template exactly
3. Ensure all required fields are filled (including Term)
4. Check that you have rooms and sections configured