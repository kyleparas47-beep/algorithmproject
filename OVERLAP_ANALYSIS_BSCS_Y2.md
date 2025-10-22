# 🐛 Overlap Analysis: BSCS Year 2 Schedule

## 📊 Schedule Organized by Room & Day

### **Room: comlab5 (Laboratory)**

#### **Friday**
```
7:00 AM   ├─ 11:00 AM ║ Slot 1
10:00 AM  ├─ 3:00 PM  ║ Slot 2 ⚠️ OVERLAP (10:00-11:00)
7:00 AM   ├─ 9:40 AM  ║ Slot 3 ⚠️ OVERLAP (entire slot overlaps with Slot 1)
10:00 AM  ├─ 12:40 PM ║ Slot 4 ⚠️ OVERLAP (10:00-11:00 with Slot 1, and 10:00-12:40 with Slot 2)
5:00 PM   ├─ 7:40 PM  ║ Slot 5 ✅ NO OVERLAP
```

**Conflicts Found: 3**
- Slot 1 (7:00-11:00) overlaps with Slot 2 (10:00-3:00) → **10:00-11:00 conflict**
- Slot 1 (7:00-11:00) overlaps with Slot 3 (7:00-9:40) → **7:00-9:40 conflict**
- Slot 2 (10:00-3:00) overlaps with Slot 4 (10:00-12:40) → **10:00-12:40 conflict**

#### **Monday**
```
2:00 PM   ├─ 7:00 PM  ║ Slot 1
7:00 AM   ├─ 11:00 AM ║ Slot 2 ✅ NO OVERLAP (different times)
10:00 AM  ├─ 3:00 PM  ║ Slot 3 ⚠️ OVERLAP (10:00-3:00 with Slot 1 overlap at 2:00-3:00)
2:00 PM   ├─ 6:40 PM  ║ Slot 4 ⚠️ OVERLAP (entire slot overlaps with Slot 1)
6:00 PM   ├─ 8:40 PM  ║ Slot 5 ⚠️ OVERLAP (6:00-6:40 with Slot 1)
```

**Conflicts Found: 3**
- Slot 1 (2:00-7:00) overlaps with Slot 3 (10:00-3:00) → **2:00-3:00 conflict**
- Slot 1 (2:00-7:00) overlaps with Slot 4 (2:00-6:40) → **2:00-6:40 conflict**
- Slot 1 (2:00-7:00) overlaps with Slot 5 (6:00-8:40) → **6:00-7:00 conflict**

#### **Thursday**
```
7:00 AM   ├─ 11:00 AM ║ Slot 1 ✅ (lecture in 204, different room)
10:00 AM  ├─ 3:00 PM  ║ Slot 2
2:00 PM   ├─ 7:00 PM  ║ Slot 3 ⚠️ OVERLAP (2:00-3:00 with Slot 2)
```

**Conflicts Found: 1**
- Slot 2 (10:00-3:00) overlaps with Slot 3 (2:00-7:00) → **2:00-3:00 conflict**

#### **Tuesday**
```
7:00 AM   ├─ 11:00 AM ║ Slot 1 ✅
10:00 AM  ├─ 3:00 PM  ║ Slot 2 ✅ (lecture in 204, different room)
3:00 PM   ├─ 7:00 PM  ║ Slot 3 ✅ NO OVERLAP (starts when Slot 2 ends)
```

**Conflicts Found: 0** ✅

#### **Wednesday**
```
7:00 AM   ├─ 9:40 AM  ║ Slot 1 (lecture in 204, different room)
10:00 AM  ├─ 12:40 PM ║ Slot 2 (lecture in 204, different room)
2:00 PM   ├─ 7:00 PM  ║ Slot 3 ✅
7:00 AM   ├─ 11:00 AM ║ Slot 4 ⚠️ OVERLAP (7:00-9:40 with Slot 1, but that's in 204)
10:00 AM  ├─ 3:45 PM  ║ Slot 5 (lecture in 204, different room)
```

**Conflicts Found: 0** ✅ (Slots 1, 2, 5 are in Room 204, not comlab5)

---

### **Room: 204 (Lecture)**

#### **Friday**
```
2:00 PM   ├─ 6:40 PM  ║ Slot 1
7:00 AM   ├─ 9:40 AM  ║ Slot 2 ✅ NO OVERLAP
10:00 AM  ├─ 12:40 PM ║ Slot 3 ✅ NO OVERLAP
1:00 PM   ├─ 5:00 PM  ║ Slot 4 ⚠️ OVERLAP (1:00-2:00 with Slot 1)
6:00 PM   ├─ 8:40 PM  ║ Slot 5 ✅ NO OVERLAP
```

**Conflicts Found: 1**
- Slot 1 (2:00-6:40) overlaps with Slot 4 (1:00-5:00) → **2:00-5:00 conflict**

#### **Thursday**
```
11:00 AM  ├─ 1:40 PM  ║ Slot 1
2:00 PM   ├─ 4:40 PM  ║ Slot 2 ✅ NO OVERLAP
5:00 PM   ├─ 7:40 PM  ║ Slot 3 ✅ NO OVERLAP
7:00 AM   ├─ 9:40 AM  ║ Slot 4 ✅ NO OVERLAP
10:00 AM  ├─ 3:00 PM  ║ Slot 5 ⚠️ OVERLAP (10:00-1:40 with Slot 1)
```

**Conflicts Found: 1**
- Slot 1 (11:00-1:40) overlaps with Slot 5 (10:00-3:00) → **11:00-1:40 conflict**

#### **Tuesday**
```
7:00 AM   ├─ 11:00 AM ║ Slot 1
3:00 PM   ├─ 7:00 PM  ║ Slot 2 ✅ NO OVERLAP
```

**Conflicts Found: 0** ✅

#### **Wednesday**
```
7:00 AM   ├─ 9:40 AM  ║ Slot 1
10:00 AM  ├─ 12:40 PM ║ Slot 2 ✅ NO OVERLAP
2:00 PM   ├─ 7:00 PM  ║ Slot 3 ✅ NO OVERLAP (but this is comlab5, not 204)
10:00 AM  ├─ 3:45 PM  ║ Slot 4 ⚠️ OVERLAP (10:00-12:40 with Slot 2)
4:00 PM   ├─ 6:40 PM  ║ Slot 5 ✅ NO OVERLAP
```

**Conflicts Found: 1**
- Slot 2 (10:00-12:40) overlaps with Slot 4 (10:00-3:45) → **10:00-12:40 conflict**

---

### **Room: 203**

#### **Monday**
```
2:00 PM   ├─ 6:40 PM  ║ Slot 1
6:00 PM   ├─ 8:40 PM  ║ Slot 2 ⚠️ OVERLAP (6:00-6:40)
```

**Conflicts Found: 1**
- Slot 1 (2:00-6:40) overlaps with Slot 2 (6:00-8:40) → **6:00-6:40 conflict**

---

## 📈 Summary of All Conflicts

| Room | Day | Conflict | Duration |
|------|-----|----------|----------|
| comlab5 | Fri | 7:00-11:00 ↔ 10:00-3:00 | 10:00-11:00 (1 hr) |
| comlab5 | Fri | 7:00-11:00 ↔ 7:00-9:40 | 7:00-9:40 (2h 40m) |
| comlab5 | Fri | 10:00-3:00 ↔ 10:00-12:40 | 10:00-12:40 (2h 40m) |
| comlab5 | Mon | 2:00-7:00 ↔ 10:00-3:00 | 2:00-3:00 (1 hr) |
| comlab5 | Mon | 2:00-7:00 ↔ 2:00-6:40 | 2:00-6:40 (4h 40m) |
| comlab5 | Mon | 2:00-7:00 ↔ 6:00-8:40 | 6:00-7:00 (1 hr) |
| comlab5 | Thu | 10:00-3:00 ↔ 2:00-7:00 | 2:00-3:00 (1 hr) |
| 204 | Fri | 2:00-6:40 ↔ 1:00-5:00 | 2:00-5:00 (3 hrs) |
| 204 | Thu | 11:00-1:40 ↔ 10:00-3:00 | 11:00-1:40 (2h 40m) |
| 204 | Wed | 10:00-12:40 ↔ 10:00-3:45 | 10:00-12:40 (2h 40m) |
| 203 | Mon | 2:00-6:40 ↔ 6:00-8:40 | 6:00-6:40 (40 min) |

**Total Conflicts: 11** ⚠️

---

## 🎯 Root Cause

The **overlap detection fix** I added is **NOT working properly**. It should have prevented these overlapping sessions from being scheduled in the same room, but they're still appearing.

**Problem Areas:**
1. ❌ Multiple sessions in same room on same day with overlapping times
2. ❌ Lab sessions (comlab5) have the most conflicts (7 out of 11)
3. ❌ Overlap detection isn't being applied correctly

---

## 🔧 What Needs to Be Fixed

The issue is that the overlap detection fix is checking if **newly found slots overlap with each other**, but the system is still allowing them to be added to the schedule simultaneously.

**Root Issue:** The `findFlexibleSlots()` method finds slots and returns them, but when multiple slots are found, they might still overlap when actually scheduled.

**Solution Needed:** The overlap detection needs to prevent these overlapping sessions from even being scheduled in the first place.
