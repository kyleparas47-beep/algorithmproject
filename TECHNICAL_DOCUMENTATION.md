# Technical Documentation: Course Scheduling System
## Simple Explanation for Everyone

---

## 🎯 **What Does This System Do?**

Imagine you're organizing a school schedule:
- 📚 You have **122 courses** to fit into a schedule
- 🏫 You have **5 rooms** available
- 👥 You have **3 programs** (BSCS, BSIS, BSIT)
- 📅 You have **3 terms** to schedule

**The Problem:** Courses can't be in the same room at the same time!

**The Solution:** This system finds time slots for all courses **automatically** without conflicts.

---

## 🛠️ **The Tools We Use**

| What We Use | What It Does |
|-------------|------------|
| **Node.js** | Runs the scheduling program on a computer |
| **Express.js** | Handles requests from the website |
| **React** | Shows the schedule on the website (what you see) |
| **MySQL** | Stores all data in a database |
| **JavaScript** | Programming language for all the logic |

**Think of it like:**
- Node.js = The engine
- React = The dashboard/screen
- MySQL = The filing cabinet
- Express.js = The delivery person connecting them

---

## 📊 **How the Scheduling Works (Simple Version)**

### **Step-by-Step Process:**

```
┌─────────────────────────────────────────┐
│  START: Clear everything, begin fresh   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  LOOP 1: Schedule BSCS Program          │
│  ├─ LOOP 2: Schedule TERM 1             │
│  │  ├─ Get all courses for BSCS TERM 1  │
│  │  ├─ Try to fit each course           │
│  │  └─ Save to database                 │
│  ├─ LOOP 2: Schedule TERM 2             │
│  │  ├─ Clear rooms (start fresh!)       │
│  │  ├─ Get all courses for BSCS TERM 2  │
│  │  ├─ Try to fit each course           │
│  │  └─ Save to database                 │
│  └─ LOOP 2: Schedule TERM 3             │
│     ├─ Clear rooms (start fresh!)       │
│     ├─ Get all courses for BSCS TERM 3  │
│     ├─ Try to fit each course           │
│     └─ Save to database                 │
│                                         │
│  LOOP 1: Schedule BSIS Program          │
│  (Same as above for BSIS)               │
│                                         │
│  LOOP 1: Schedule BSIT Program          │
│  (Same as above for BSIT)               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  DONE! Show how many conflicts we had   │
└─────────────────────────────────────────┘
```

**Key Idea:** 
- Each **program** gets scheduled separately
- Each **term** gets completely fresh rooms (like wiping the schedule clean)
- Then we move to the next program

---

## 🎯 **Finding Available Time Slots (The Smart Part)**

### **What We Look For:**

When we need to schedule a course, we search for a time slot:

```
Time Slot = A specific TIME in a specific ROOM on a specific DAY

Example:
├─ Room: Lecture Room 204
├─ Day: Monday
└─ Time: 8:00 AM to 10:00 AM

We look at: Is this time+room combination free?
```

### **The Search Pattern:**

```
For each Room (1, 2, 3, 4, 5):
    For each Day (Monday to Friday):
        For each Hour (8 AM to 10 PM):
            Check every 30 minutes:
                8:00, 8:30, 9:00, 9:30, 10:00, ... etc
                
                → Found a free slot? ✓ Stop searching!
                → Not free? → Keep looking
```

**Why 30-minute intervals?**
- Some classes are 2 hours long
- Some classes are 2 hours 40 minutes long
- 30-minute intervals give us flexibility to fit both

---

## 🚫 **How We Prevent Conflicts (Most Important!)**

### **Conflict = Two classes in the same room at the same time**

**Example of a conflict:**
```
Room 204 on Monday:
├─ 8:00 AM - 10:00 AM ← Math Class
└─ 9:00 AM - 11:00 AM ← Physics Class
   ↑ These overlap! ✗ CONFLICT!
```

### **How We Stop Conflicts:**

**We keep TWO lists for each room:**

```
Room 204's Schedule for Monday:
┌────────────────────┐
│ 8:00 - 10:00 ✓     │
│ 10:30 - 12:30 ✓    │
│ 1:00 - 5:00 ✓      │
│ 6:00 - 8:40 ✓      │
└────────────────────┘

When we want to add a new class, we check:
- Does it overlap with any of these? 
- If YES → Can't add it here, try another room
- If NO → Add it! ✓
```

### **The Simple Math Behind Overlap Detection:**

```javascript
Do times overlap?

Time A: 8:00 - 10:00
Time B: 9:00 - 11:00

Check: Does A start before B ends? YES (8:00 < 11:00)
   AND Does B start before A ends? YES (9:00 < 10:00)
   
Result: OVERLAP! ✓ (Both are true)

---

Time A: 8:00 - 10:00
Time B: 10:00 - 12:00

Check: Does A start before B ends? YES (8:00 < 12:00)
   AND Does B start before A ends? NO (10:00 is NOT < 10:00)
   
Result: NO OVERLAP ✓ (Not both true, only one is true)
```

### **We Also Track Student Schedules:**

```
Student Schedule (Section A):
┌────────────────────┐
│ Monday 8:00-10:00  │ ← Math
│ Monday 10:30-12:30 │ ← Physics (different room)
│ Tuesday 2:00-4:00  │ ← Chemistry
└────────────────────┘

When adding a new class to Section A, we check:
- Does it conflict with any of these times?
- If YES → Find a different time!
- If NO → Add it! ✓

This ensures a student is never in 2 places at once!
```

---

## ✅ **Proof That There Are No Conflicts**

### **How We Know It Works:**

**Simple Check:**
```
When a class is scheduled:

Step 1: Check if room is free
        ✓ Room 204 Monday 8-10? Yes, it's free!

Step 2: Check if student section is free
        ✓ Section A Monday 8-10? Yes, it's free!

Step 3: Add the class
        ✓ Class scheduled!

Step 4: Update our list
        ✓ Room 204 is now marked as busy 8-10
        ✓ Section A is now marked as busy 8-10

Step 5: Next class to schedule?
        ✓ If it tries to use Room 204 Monday 8-10
        ✓ We'll see it's already taken!
        ✓ Won't allow the conflict!
```

**Real Example from Your Schedule:**
```
Room 204 - Friday (No conflicts!)

8:00 - 9:40 AM   → Math Lecture
10:00 - 12:40 PM → Math Lecture (2nd session, different time!)
1:00 - 5:00 PM   → Physics Lecture
6:00 - 8:40 PM   → Physics Lecture (2nd session)

Check overlaps:
├─ 8:00-9:40 vs 10:00-12:40? NO (9:40 < 10:00) ✓
├─ 10:00-12:40 vs 1:00-5:00? NO (12:40 < 1:00) ✓
├─ 1:00-5:00 vs 6:00-8:40? NO (5:00 < 6:00) ✓

Result: Perfect! No conflicts! ✓
```

---

## 📚 **How We Make Sure All Courses Get Scheduled**

### **Step 1: Sort Courses by Priority**

When scheduling a course, we follow this order:
```
1. Program (BSCS first, then BSIS, then BSIT)
2. Term (TERM 1 first, then TERM 2, then TERM 3)
3. Year Level (Year 1 first, then Year 2, etc.)
4. Course Type (Lecture before Lab)
5. Course Name (Alphabetical order)

This ensures we handle easy-to-fit courses first!
```

### **Step 2: Try Each Room**

```
For a course that needs 2 time slots:

Try Room 1:
├─ Can we find 2 free time slots? 
├─ Monday 8:00-10:00? Free? ✓
├─ Wednesday 2:00-4:00? Free? ✓
└─ Success! Schedule in Room 1

If Room 1 is full:
Try Room 2, then Room 3, then Room 4, then Room 5

If Room 5 is also full:
Record: "Could not schedule this course - CONFLICT"
```

### **Step 3: Verify Capacity**

```
Your system has:
- 5 rooms
- 5 days per week
- 14 hours available per day

Total capacity: 5 × 5 × 14 = 350 room-hours per week

Your courses need approximately:
- BSCS: 32 courses × 2 sessions × 2.5 hours = ~160 hours
- BSIS: 31 courses × 2 sessions × 2.5 hours = ~155 hours
- BSIT: 57 courses × 2 sessions × 2.5 hours = ~285 hours

You have plenty of room! ✓
```

---

## 👥 **How We Handle Multiple Sections (e.g., Section A, B, C)**

### **The Key Principle:**

> **All sections take the SAME courses, but at DIFFERENT times**

### **Example:**

```
BSCS Year 1 has 3 sections: A, B, C

All 3 sections take:
├─ Fundamentals of Programming
└─ Introduction to Computing

But at DIFFERENT times:

Section A (BSCS1A):
├─ Fundamentals: Monday 8:00-10:00, Room 204
├─ Fundamentals: Wednesday 8:00-10:00, Room 204
├─ Intro: Thursday 11:30-2:10, Room 205
└─ Intro: Friday 11:30-2:10, Room 205

Section B (BSCS1B):
├─ Fundamentals: Tuesday 9:00-11:00, Room 206 ← Different!
├─ Fundamentals: Thursday 9:00-11:00, Room 206 ← Different!
├─ Intro: Monday 2:00-4:40, Room 207 ← Different!
└─ Intro: Friday 2:00-4:40, Room 207 ← Different!

Section C (BSCS1C):
├─ Fundamentals: Tuesday 11:00-1:00, Room 208 ← Different!
├─ Fundamentals: Friday 11:00-1:00, Room 208 ← Different!
├─ Intro: Wednesday 9:00-11:40, Room 209 ← Different!
└─ Intro: Monday 11:30-2:10, Room 209 ← Different!

Same courses, NO conflicts because different times! ✓
```

### **How It's Scheduled:**

```
For each course at Year 1:
    Get all sections at Year 1 (A, B, C)
    
    For Section A:
        Find 2 free time slots → Schedule
    
    For Section B:
        Find 2 different free time slots → Schedule
    
    For Section C:
        Find 2 different free time slots → Schedule

Result: Each section has its own schedule!
```

---

## 🗄️ **How Data is Stored**

### **The Database Structure (Simplified):**

```
COURSES Table:
┌────────────────────────────────────┐
│ Course ID │ Name │ Program │ Term │
├────────────────────────────────────┤
│ 1 │ Fundamentals │ BSCS │ TERM 1 │
│ 2 │ Intro │ BSCS │ TERM 1 │
│ 3 │ Database │ BSCS │ TERM 2 │
└────────────────────────────────────┘

SECTIONS Table:
┌──────────────────────────────────────┐
│ Section ID │ Name │ Program │ Year │
├──────────────────────────────────────┤
│ 1 │ BSCS1A │ BSCS │ 1 │
│ 2 │ BSCS1B │ BSCS │ 1 │
│ 3 │ BSCS2A │ BSCS │ 2 │
└──────────────────────────────────────┘

SCHEDULES Table:
┌────────────────────────────────────────────────────┐
│ Course │ Section │ Room │ Day │ Start Time │ End │
├────────────────────────────────────────────────────┤
│ 1 │ 1 │ 204 │ Mon │ 08:00 │ 10:00 │
│ 1 │ 1 │ 204 │ Wed │ 08:00 │ 10:00 │
│ 1 │ 2 │ 206 │ Tue │ 09:00 │ 11:00 │
└────────────────────────────────────────────────────┘
```

---

## 🔧 **Key Features Explained**

### **1. Room Reset Between Terms**

```
TERM 1 Scheduling:
├─ Room 204: Booked Mon 8-10, Wed 2-4, etc.
├─ Courses scheduled
└─ Clear the schedule

TERM 2 Scheduling:
├─ Room 204: NOW EMPTY! ← Fresh start!
├─ Can schedule new courses at same times
└─ Different courses, same room, different term

Why? Because TERM 1 ends before TERM 2 starts!
     Same room, different time periods, NO conflict!
```

### **2. Course Types**

```
LECTURE:
- Classroom discussion
- 2-3 hours per session
- 2 sessions per week
- Needs: Lecture Room

LABORATORY:
- Hands-on practical work
- 4-5 hours per session
- 2 sessions per week
- Needs: Lab Room

LECLAB:
- Combination (Lecture + Lab)
- 2-3 hours lecture + 4-5 hours lab
- 4 sessions per week total
- Needs: Both Lecture Room AND Lab Room
```

### **3. Time Granularity (30-minute intervals)**

```
Why we check every 30 minutes:

8:00, 8:30, 9:00, 9:30, 10:00, 10:30, etc.

This allows us to fit different class lengths:
├─ 2:00 hour class: 8:00-10:00 ✓
├─ 2:40 hour class: 9:00-11:40 ✓
└─ 4:00 hour class: 1:00-5:00 ✓

Without this, we'd waste time slots!
```

---

## 📋 **Complete Workflow Example**

```
User clicks: "Generate Schedule"
                    ↓
Backend starts:
1. Clear all schedules from database
2. Get all courses, sections, rooms
                    ↓
3. Loop 1 - BSCS Program:
   ├─ Clear room availability
   ├─ Loop 2 - TERM 1:
   │  ├─ Get 11 courses for BSCS TERM 1
   │  ├─ For each course:
   │  │  ├─ Get year level sections (e.g., Year 1: A, B, C)
   │  │  ├─ For each section:
   │  │  │  ├─ Search for 2 free time slots
   │  │  │  ├─ Found? → Save to database
   │  │  │  └─ Not found? → Record conflict
   │  ├─ Save all scheduled classes
   │  └─ Clear room availability
   │
   ├─ Loop 2 - TERM 2: (repeat above)
   └─ Loop 2 - TERM 3: (repeat above)
                    ↓
4. Loop 1 - BSIS Program: (repeat all terms)
5. Loop 1 - BSIT Program: (repeat all terms)
                    ↓
6. Show results:
   ✓ Total courses scheduled
   ✗ Total conflicts (if any)
   
                    ↓
Frontend receives data and displays:
- Schedules by Section
- Schedules by Room
- Conflict report
```

---

## 🎓 **How to Check If Everything Works**

### **Quick Checks:**

**1. Check Total Courses:**
```
Expected:
├─ BSCS: 32 courses × 3 terms = 96 courses scheduled
├─ BSIS: 31 courses × 3 terms = 93 courses scheduled
└─ BSIT: 57 courses × 3 terms = 171 courses scheduled

Total: 360 scheduled courses ✓
```

**2. Check No Room Conflicts:**
```
Look at any room schedule:
├─ Room 204 Monday: 8:00-10:00, 10:30-12:30, 1:00-5:00
├─ No overlaps? ✓
└─ Great!

If you see: 8:00-10:00 AND 9:00-11:00 in same room
├─ CONFLICT! ✗
└─ Report the bug
```

**3. Check All Sections Have Classes:**
```
Look at "View Schedules → By Section"

You should see:
├─ BSCS1A ✓
├─ BSCS1B ✓
├─ BSCS1C ✓
├─ BSCS2A ✓
├─ BSCS2B ✓
├─ BSCS3A ✓
├─ BSCS4A ✓
├─ BSCS4B ✓
└─ ... and all BSIS and BSIT sections

Missing sections? → Conflicts prevented them from scheduling
```

---

## 📖 **Summary**

| What | How | Why |
|------|-----|-----|
| **Avoid conflicts** | Track each room's schedule + each student's schedule | So no class is in 2 places at once |
| **Schedule everything** | Try each room, prioritize easy-to-fit courses | So nothing is left unscheduled |
| **Use all sections** | Each section gets independent time slots | So students don't overlap in same courses |
| **Fill all terms** | Schedule TERM 1, reset, schedule TERM 2, reset, schedule TERM 3 | So rooms can be reused for different terms |

---

**That's it! The system works like organizing a real school schedule, but automatically!** 📚✓

