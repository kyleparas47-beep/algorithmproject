# Course Types and Terms Feature

## ✅ New Course Types Added!

You can now specify LABORATORY and LECTURE + LAB courses, plus assign terms to all courses!

⚠️ **Important:** Laboratory (2 hrs) is **ONLY available for BSIT programs**. BSCS and BSIS can only use Lecture and Lecture + Lab types.

---

## 🔍 Excel Import Validation

**NEW!** The system now validates your Excel file before importing. It checks:

✅ **Template Structure**
- All required columns present: Program, Year, Code, Name, Type, Term
- Column names match exactly (case-insensitive)

✅ **Data Validation**
- Program: Must be BSIT, BSCS, or BSIS
- Year: Must be 1, 2, 3, or 4
- Code: Cannot be empty
- Name: Cannot be empty
- Type: Must be lecture, laboratory, or leclab
- Term: Must be TERM 1, TERM 2, or TERM 3

✅ **Business Rules**
- Laboratory type only for BSIT
- All data types correct
- All required fields present

✅ **Import Confirmation**
- Shows validation summary before importing
- Displays total courses to import
- Confirms all data is valid

---

## Excel Validation Errors - Solutions

### ❌ "Invalid Excel template! Missing columns"
**Cause:** Your Excel file is missing one or more required columns  
**Solution:**
- Download the template from the Courses page
- Use the exact column names: Program, Year, Code, Name, Type, Term
- Don't add or remove columns

### ❌ "Invalid program code"
**Cause:** Program column has wrong value  
**Solution:**
```
❌ Wrong: Information Technology, IT, BS in IT
✅ Correct: BSIT

❌ Wrong: Computer Science, CS
✅ Correct: BSCS

❌ Wrong: Information Systems, IS
✅ Correct: BSIS
```

### ❌ "Invalid Year"
**Cause:** Year column has invalid value  
**Solution:**
```
✅ Valid: 1, 2, 3, 4
❌ Invalid: First Year, Year 1, 1st, A, B
```

### ❌ "Course Code is required"
**Cause:** Code column is empty  
**Solution:** Fill in a course code (e.g., IT101, CS201)

### ❌ "Course Name is required"
**Cause:** Name column is empty  
**Solution:** Fill in the course name (e.g., Programming 1)

### ❌ "Invalid Type"
**Cause:** Type column has unsupported value  
**Solution:**
```
✅ Valid: lecture, laboratory (BSIT only), leclab
❌ Invalid: Lecture + Lab only, Theory, Practical
```

### ❌ "Laboratory type is only available for BSIT"
**Cause:** Trying to add laboratory course to BSCS/BSIS  
**Solution:**
- Laboratory type only works for BSIT
- Use `lecture` or `leclab` for BSCS/BSIS

### ❌ "Invalid Term"
**Cause:** Term column has wrong value  
**Solution:**
```
✅ Valid: TERM 1, TERM 2, TERM 3 (or just 1, 2, 3)
❌ Invalid: First Semester, Semester 1, Q1
```

---

## ✅ Import Success Flow

**Step 1:** Click "Import Excel File"  
**Step 2:** Select your Excel file  
**Step 3:** System validates template and data  
**Step 4:** See validation summary:
```
✅ Excel validation passed!

Summary:
- Courses to import: 15
- Template: Valid
- All columns: Present
- All data: Valid format

Click OK to proceed with importing.
```
**Step 5:** Click OK to confirm  
**Step 6:** See success message:
```
✅ Successfully imported 15 course(s)!
```

---

## 📋 Perfect Excel File Example

| Program | Year | Code | Name | Type | Term |
|---------|------|------|------|------|------|
| BSIT | 1 | IT101 | Intro to Computing | lecture | TERM 1 |
| BSIT | 1 | IT102 | Programming Lab | laboratory | TERM 1 |
| BSIT | 2 | IT201 | Data Structures | leclab | TERM 2 |
| BSCS | 1 | CS101 | CS Fundamentals | leclab | TERM 1 |
| BSCS | 2 | CS201 | Algorithms | lecture | TERM 2 |

This file will import perfectly! ✅

---

## Course Types Available

### BSIT Program
- ✅ **Lecture (2 hrs)** - Classroom teaching
- ✅ **Laboratory (2 hrs)** - **NEW!** Lab/practical work
- ✅ **Lecture + Lab (2 + 2 hrs)** - Combined theory and practice

### BSCS/BSIS Programs
- ✅ **Lecture (4 hrs)** - Classroom teaching
- ✅ **Lecture + Lab (2.67 + 4 hrs)** - Combined theory and practice

---

## How to Add Courses with Laboratory

### Manual Entry

1. Go to **Courses** page
2. Fill in course details
3. **Type**: Now shows **Laboratory (2 hrs)** option
4. **Term**: Select TERM 1, TERM 2, or TERM 3
5. Click **Add Course**

**Example:**
```
Program: BSIT
Year: 1
Code: IT102
Name: Programming Lab
Type: Laboratory (2 hrs)  ← NEW!
Term: TERM 1
```

### Excel Import

The template now includes examples of all types:

| Program | Year | Code | Name | Type | Term |
|---------|------|------|------|------|------|
| BSIT | 1 | IT101 | Intro | lecture | TERM 1 |
| BSIT | 1 | IT102 | Programming Lab | **laboratory** | TERM 1 |
| BSIT | 1 | IT103 | Programming 1 | leclab | TERM 2 |

**Supported Type Values in Excel:**
- `lecture`
- `laboratory` (BSIT only)
- `lab` (BSIT only)
- `leclab`
- `lecture + lab`
- Any text containing "lab" alone = laboratory (BSIT only)
- Any text containing "lab" + "lec" = leclab

---

## Database Migration

### For Existing Databases

Run this migration to add laboratory type:

```sql
ALTER TABLE courses 
MODIFY COLUMN type ENUM('lecture', 'leclab', 'laboratory') NOT NULL;
```

Or use the script:
```bash
mysql -u root -p nu_scheduling < backend/add_term_column.sql
```

---

## Features

✅ **Laboratory (2 hrs)** - For lab-only courses  
✅ **Lecture + Lab** - Combined courses  
✅ **Three Term Options** - Organize by TERM 1, 2, or 3  
✅ **Excel Import** - Supports all types and terms  
✅ **Edit Courses** - Change type and term anytime  
✅ **Auto Hours** - Hours calculated based on type  

---

## Course Table Display

| Code | Name | Program | Year | Term | Type | Actions |
|------|------|---------|------|------|------|---------|
| IT101 | Intro | BSIT | 1 | TERM 1 | Lecture | Edit/Delete |
| IT102 | Lab | BSIT | 1 | TERM 1 | **Laboratory** | Edit/Delete |
| CS101 | Fundamentals | BSCS | 1 | TERM 1 | Lec+Lab | Edit/Delete |

---

## Hours Calculation

**Automatically calculated** when you:
- Select a Program
- Select a Type

| Program | Type | Lecture Hrs | Lab Hrs | Total |
|---------|------|-------------|---------|-------|
| BSIT | Lecture | 2 | 0 | 2 |
| BSIT | **Laboratory** | **0** | **2** | **2** |
| BSIT | Lec+Lab | 2 | 2 | 4 |
| BSCS | Lecture | 4 | 0 | 4 |
| BSCS | Lec+Lab | 2.67 | 4 | 6.67 |

---

## Quick Test

Try adding these courses:

**Test 1: BSIT Laboratory**
- Program: BSIT
- Year: 1
- Code: TEST102
- Name: Test Lab
- Type: **Laboratory (2 hrs)**
- Term: TERM 1

**Test 2: BSIT Lecture + Lab**
- Program: BSIT
- Year: 1
- Code: TEST103
- Name: Test Lecture + Lab
- Type: **Lecture + Lab (2 + 2 hrs)**
- Term: TERM 2

Both should save successfully! ✅

---

## Excel Import Example

```
Program,Year,Code,Name,Type,Term
BSIT,1,IT101,Intro to Computing,lecture,TERM 1
BSIT,1,IT102,Programming Lab,laboratory,TERM 1
BSIT,1,IT103,Programming 1,leclab,TERM 2
BSCS,1,CS101,CS Fundamentals,leclab,TERM 1
BSCS,1,CS102,Database Design,lecture,TERM 2
```

All these will import successfully! ✅

**Note:** Laboratory type is only available for BSIT. BSCS and BSIS can only use lecture or leclab types.

---

## Backend Validation

### Laboratory Type Restriction

**The backend API enforces** that Laboratory (2 hrs) is only available for BSIT programs:

✅ **POST /api/courses** - Validates laboratory type on course creation  
✅ **PUT /api/courses/:id** - Validates laboratory type on course update  

**If you try to:**
- Create a BSCS/BSIS course with type "laboratory" → ❌ Error returned
- Update a BSCS/BSIS course to type "laboratory" → ❌ Error returned
- Create a BSIT course with type "laboratory" → ✅ Allowed

**Error Message:**
```json
{
  "error": "Laboratory type is only available for BSIT programs, not BSCS"
}
```

### Benefits

✅ **Prevents Data Inconsistencies** - No invalid course types in database  
✅ **Schedule Generation Stability** - No conflicts from invalid types  
✅ **API Security** - Server-side validation prevents manipulation  
✅ **Data Integrity** - Enforces business rules at database layer  

---

## Complete Feature Set

You now have:
- ✅ **Create** - Add courses with all types
- ✅ **Read** - View all courses with terms
- ✅ **Update** - Edit courses and change types
- ✅ **Delete** - Remove courses
- ✅ **Import** - Bulk import with Excel
- ✅ **Terms** - Organize by TERM 1, 2, 3
- ✅ **Types** - Lecture, Laboratory, Lecture+Lab

---

**Everything is ready! Start using laboratory courses now!** 🎉


