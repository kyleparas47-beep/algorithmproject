# Scheduling Conflicts Analysis & Solutions

## 📊 System Overview

### Current Resource Constraints
- **Total Courses:** 122 courses across 3 programs
- **Available Rooms:** 5 rooms (need to clarify lecture vs lab split)
- **Total Programs:** 3 (BSCS, BSIS, BSIT)
- **Terms:** 3 (TERM 1, TERM 2, TERM 3)

### Course Distribution Requirements
```
BSCS:  32 courses
BSIS:  31 courses
BSIT:  57 courses
Total: 122 courses
```

---

## 🎯 Key Requirements (User Specification)

### Per-Program Scheduling Strategy
1. **BSCS (32 courses)**
   - Group ALL BSCS courses by TERM
   - Schedule TERM 1 first with room allocation (5 rooms)
   - Clear rooms completely after TERM 1 schedules
   - Schedule TERM 2 with fresh room availability
   - Clear rooms again
   - Schedule TERM 3 with fresh room availability

2. **BSIS (31 courses)**
   - Same approach as BSCS (per-term with room resets)

3. **BSIT (57 courses)**
   - Same approach as BSCS (per-term with room resets)

### Critical Constraint
**Rooms are NOT shared between terms:**
- After TERM 1 finishes, rooms are completely cleared/reset
- TERM 2 starts with 5 fresh rooms available
- After TERM 2 finishes, rooms are cleared again
- TERM 3 gets 5 fresh rooms

---

## ⚠️ Current Issues in scheduler.js

### Issue 1: No Per-Program Room Reset
**Location:** `scheduler.js` lines 32-141  
**Problem:** The scheduler processes all courses together, but doesn't reset rooms between programs

```javascript
// CURRENT (WRONG):
for (const term of ['TERM 1', 'TERM 2', 'TERM 3']) {
    const termCourses = coursesByTerm[term] || [];
    // Schedules ALL programs' courses for this term together
}
```

**Should be:**
```javascript
// CORRECT:
for (const program of ['BSCS', 'BSIS', 'BSIT']) {
    for (const term of ['TERM 1', 'TERM 2', 'TERM 3']) {
        // Schedule this program's term
        // Reset rooms after each term
    }
}
```

### Issue 2: Room Occupancy Not Reset Between Terms
**Location:** `scheduler.js` lines 73-75  
**Problem:** `roomOccupancy` and `sectionOccupancy` are reset per-term but NOT per-program

**Impact:** BSCS Term 1, BSIS Term 1, and BSIT Term 1 all compete for the same 5 rooms

### Issue 3: Section Occupancy Not Per-Program
**Location:** `scheduler.js` lines 75, 576-587  
**Problem:** Section occupancy tracks only time conflicts but doesn't account for program context

---

## ✅ Solutions

### Solution 1: Implement Per-Program Scheduling

Modify `generateSchedules()` to:
1. Group courses by program first
2. For each program, schedule all 3 terms sequentially
3. Clear room occupancy between EACH term (not just programs)

### Solution 2: Separate Section Occupancy per Program

Each program's sections should have independent occupancy tracking because:
- BSCS Year 1 Section A ≠ BSIS Year 1 Section A
- They can have same time slots if in different programs

### Solution 3: Implement Room Availability Matrix

For 5 rooms across 3 terms:
```
BSCS TERM 1: Uses Room 1-5
BSCS TERM 2: Uses Room 1-5 (reset)
BSCS TERM 3: Uses Room 1-5 (reset)
BSIS TERM 1: Uses Room 1-5 (reset)
BSIS TERM 2: Uses Room 1-5 (reset)
BSIS TERM 3: Uses Room 1-5 (reset)
BSIT TERM 1: Uses Room 1-5 (reset)
BSIT TERM 2: Uses Room 1-5 (reset)
BSIT TERM 3: Uses Room 1-5 (reset)
```

### Solution 4: Course Sorting Priority

Within each program-term combination, sort by:
1. **Program** (already grouped, so constant)
2. **Term** (already grouped, so constant)
3. **Year Level** (1 → 2 → 3 → 4)
4. **Course Type** (leclab → lecture → laboratory)
5. **Course Name** (alphabetically)

---

## 🔧 Implementation Roadmap

### Step 1: Refactor `generateSchedules()` 
- Loop: Program → Term → Courses
- Create fresh occupancy for each term
- Reset occupancy between program-term iterations

### Step 2: Improve `groupCoursesByTermAndProgram()`
- Group by both program AND term simultaneously
- Return structure: `{ BSCS: { TERM1: [], TERM2: [], ... }, BSIS: { ... }, BSIT: { ... } }`

### Step 3: Enhance Occupancy Tracking
- Program-aware section occupancy
- Clear room occupancy after each term
- Maintain logs for debugging

### Step 4: Update Console Logging
- Show program + term combinations being processed
- Display room utilization per program-term
- Show when rooms are being reset

### Step 5: Database Considerations
- Ensure `courses` table has both `program_id` and `term`
- Ensure `schedules` table can be cleared by program+term
- Add index on `(program_id, term)` for queries

---

## 📈 Expected Results After Fixes

### Current (Broken) Scenario
```
All 122 courses competing for 5 rooms simultaneously
→ Very high conflict rate (likely 50%+)
```

### Expected After Fix
```
BSCS 32 courses → distributed across 3 terms (~11/term)
  + 5 rooms per term → HIGH SUCCESS RATE (>95%)
  
BSIS 31 courses → distributed across 3 terms (~10/term)
  + 5 rooms per term → HIGH SUCCESS RATE (>95%)
  
BSIT 57 courses → distributed across 3 terms (~19/term)
  + 5 rooms per term → GOOD SUCCESS RATE (85-90%)
```

---

## 🚀 Performance Metrics

### Room Utilization Analysis

#### BSCS with 32 courses (11 per term on average)
- 11 courses × 2 sessions = 22 sessions/week
- 5 rooms × 5 days × 10 hours = 250 hours/week
- 22 sessions × 2 hours avg = 44 hours needed
- **Utilization: 44/250 = 17.6%** ✅ EXCELLENT

#### BSIS with 31 courses (10 per term on average)
- 10 courses × 2 sessions = 20 sessions/week
- Room utilization: 40/250 = **16%** ✅ EXCELLENT

#### BSIT with 57 courses (19 per term on average)
- 19 courses × 2 sessions = 38 sessions/week
- Room utilization: 76/250 = **30.4%** ✅ VERY GOOD

---

## 📋 Checklist

- [ ] Modify `generateSchedules()` to loop by program-term
- [ ] Create `groupCoursesByTermAndProgram()` function
- [ ] Implement per-program section occupancy tracking
- [ ] Add room reset logic between each term
- [ ] Enhance console logging for debugging
- [ ] Test with BSCS 32 courses
- [ ] Test with BSIS 31 courses
- [ ] Test with BSIT 57 courses
- [ ] Verify no conflicts between programs
- [ ] Verify rooms reset between terms
- [ ] Update README with new scheduling logic
- [ ] Add performance metrics to console output

---

## 🎯 Success Criteria

✅ Each program schedules independently per-term  
✅ Rooms completely reset between terms  
✅ No course conflicts within a program-term  
✅ BSCS: >90% success rate  
✅ BSIS: >90% success rate  
✅ BSIT: >85% success rate  
✅ Console output shows scheduling progression by program-term  
✅ Database properly stores program+term combinations
