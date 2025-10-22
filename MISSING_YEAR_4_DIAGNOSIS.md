# 🔍 Diagnosis: Missing YEAR 4 for BSCS Program

## ❌ The Problem

When you generate the schedule, BSCS program only shows **Year 1, 2, 3** but **no Year 4 level**.

---

## 🤔 Why This Happens

There are **3 possible reasons**:

### Reason 1: No Sections Created for BSCS Year 4 ⚠️

**Check:** Go to Enrollment page:
1. Look at the enrollment data
2. Is there a row for **BSCS Year 4**?
3. Is the **total_students** value set to a number > 0?

**If NO enrollment for Year 4:**
- No sections will be created
- No schedules can be generated
- Year 4 won't appear in View Schedules

**Solution:**
```
Enrollment Tab → Add BSCS Year 4 with student count
→ Click "Generate Sections"
```

### Reason 2: No Courses Created for BSCS Year 4 ⚠️

**Check:** Go to Courses page:
1. Filter or scroll to see BSCS courses
2. Look for courses with **Year Level = 4**
3. Count how many exist

**If NO courses for Year 4:**
- Sections exist but have nothing to schedule
- View Schedules will skip empty year levels
- Year 4 won't appear

**Solution:**
```
Courses Tab → Add courses with:
- Program: BSCS
- Year Level: 4
- Term: TERM 1, 2, or 3
- Type: lecture/leclab
→ Click "Generate Schedule"
```

### Reason 3: All BSCS Year 4 Courses Have Conflicts ⚠️

**Check:** Generate the schedule and look at console:
```
BSCS - TERM 1:
✅ Scheduled: 10
❌ Conflicts: 5  ← Check details

Conflicts for BSCS TERM 1:
- CS401 [BSCS4A] - No available lecture room slots
- CS402 [BSCS4B] - No available room slots for leclab
```

**If Year 4 courses show in conflicts:**
- Sections exist
- Courses exist
- But ALL couldn't be scheduled
- View Schedules filters them out

**Solution:**
```
→ Add more rooms
→ Reduce number of courses
→ Distribute courses across terms differently
→ Try generating schedule again
```

---

## 🔧 How to Diagnose

### Step 1: Check Enrollment Data

**Frontend Enrollment Tab:**
```
Program: BSCS
├─ Year 1: [students] ← Check
├─ Year 2: [students] ← Check
├─ Year 3: [students] ← Check
└─ Year 4: [??] ← Is this filled in?
```

**If Year 4 is empty or 0:**
→ **Reason 1: Sections not created**

### Step 2: Check Courses

**Frontend Courses Tab:**
```
Filter/Search for BSCS courses
├─ BSCS Y1: CS101, CS102, ... (count: ?)
├─ BSCS Y2: CS201, CS202, ... (count: ?)
├─ BSCS Y3: CS301, CS302, ... (count: ?)
└─ BSCS Y4: ??? (count: 0?) ← Check
```

**If Year 4 course count = 0:**
→ **Reason 2: Courses not created**

### Step 3: Check Console Output

**Browser Console (F12):**
```
When you Generate Schedule, look for:

████████ PROGRAM: BSCS
BSCS - TERM 1:
  Courses to schedule: 10
  ✅ Scheduled: 8
  ❌ Conflicts: 2

BSCS - TERM 2:
  Courses to schedule: 9
  ✅ Scheduled: 7
  ❌ Conflicts: 2

BSCS - TERM 3:
  Courses to schedule: 8
  ✅ Scheduled: 6
  ❌ Conflicts: 2

← Is there any Year 4 in here?
← What are the conflict reasons?
```

**If Year 4 courses listed with 100% conflicts:**
→ **Reason 3: All conflicts (no room capacity)**

---

## ✅ Solutions by Reason

### Solution 1: Create Sections for Year 4

```
1. Go to Enrollment Tab
2. Find BSCS Year 4 row
3. Enter a number (e.g., 80 students)
4. Click "Generate Sections"
5. Verify BSCS4A, BSCS4B sections created
6. Go to View Schedules → Should see Year 4 now
```

### Solution 2: Add Courses for Year 4

```
1. Go to Courses Tab
2. Click "Add Course"
3. Fill in:
   - Program: BSCS
   - Year Level: 4
   - Code: CS401 (or similar)
   - Name: (Capstone/Elective/etc)
   - Type: lecture or leclab
   - Term: TERM 1
4. Click "Add Course"
5. Repeat for more Year 4 courses
6. Generate Schedule again
```

### Solution 3: Fix Room Conflicts

```
1. Generate Schedule
2. Check console for Year 4 conflicts
3. Add more rooms:
   - Rooms Tab → Add Lecture Room 6, 7, etc.
4. Or reduce courses:
   - Delete less important courses
   - Move some to different terms
5. Generate Schedule again
```

---

## 🧪 Verification

After applying solutions, verify Year 4 appears:

**Test Case:**
1. Ensure Enrollment has BSCS Year 4 with students > 0
2. Ensure Courses exist for BSCS Year 4
3. Ensure enough Rooms to avoid conflicts
4. Generate Schedule
5. Go to View Schedules → By Section
6. Look for **BSCS4A, BSCS4B, BSCS4C** etc.

**Expected Result:**
```
✅ BSCS1A - Shows courses
✅ BSCS2A - Shows courses
✅ BSCS3A - Shows courses
✅ BSCS4A - Shows courses ← Should appear now!
```

---

## 📊 Quick Checklist

- [ ] BSCS Year 4 enrollment has student count > 0?
- [ ] Sections generated (BSCS4A, BSCS4B)?
- [ ] BSCS Year 4 courses created (CS401, etc)?
- [ ] Enough rooms to avoid conflicts?
- [ ] Generated schedule successfully?
- [ ] Year 4 now showing in View Schedules?

---

## 🎯 Most Likely Cause

**99% of the time, it's one of these:**

1. **No enrollment entered for Year 4** (Reason 1 - 50% likely)
2. **No courses for Year 4** (Reason 2 - 40% likely)
3. **All Year 4 courses have room conflicts** (Reason 3 - 10% likely)

**Check enrollment first!** 🎯
