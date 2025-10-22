# Excel Import Validation - Complete Guide

## ✅ What's New

Your Excel import now has **comprehensive validation** before importing courses. The system checks everything to ensure data quality and prevent errors.

---

## 🛡️ Multi-Layer Validation

### Layer 1: Template Structure
✅ Checks that all required columns exist:
- Program
- Year
- Code
- Name
- Type
- Term

**Error if missing:** Shows which columns are missing and what should be present

### Layer 2: Data Format
✅ Validates each field's data type and format:
- **Program:** Text (BSIT, BSCS, BSIS)
- **Year:** Number (1, 2, 3, 4)
- **Code:** Text (not empty)
- **Name:** Text (not empty)
- **Type:** Text (lecture, laboratory, leclab)
- **Term:** Text (TERM 1, TERM 2, TERM 3)

**Error if invalid:** Shows exact row and what's wrong

### Layer 3: Business Rules
✅ Enforces program-specific rules:
- Laboratory type only for BSIT
- Valid program codes only
- Valid year levels only
- Required fields filled

**Error if violated:** Shows which rule was broken

### Layer 4: Confirmation
✅ Shows import summary before proceeding:
- Total courses to import
- Validation status
- Asks for final confirmation

---

## 🎯 Validation Process

```
1. User selects Excel file
   ↓
2. System reads file and checks columns
   ↓ (If columns missing → Show error & stop)
   ↓
3. Validate each row of data
   ↓ (If data invalid → Show all errors & stop)
   ↓
4. Check business rules (Laboratory for BSIT only)
   ↓ (If rules violated → Show error & stop)
   ↓
5. Show import summary & ask for confirmation
   ↓ (If user cancels → Stop)
   ↓
6. Import courses to database
   ↓
7. Show success message
```

---

## ✨ Error Messages - What They Mean

### Missing Columns
```
❌ Invalid Excel template!

Missing columns: Code, Term

Required columns: Program, Year, Code, Name, Type, Term

Found columns: Program, Year, Name, Type

Please download the template and use the exact format.
```
**Fix:** Download the template and use exact column names

### Invalid Data
```
❌ Excel file validation failed!

Errors found (3 total):

Row 2: Invalid program code "BS Information Technology". Valid options: BSIT, BSCS, BSIS
Row 3: Invalid Year "First Year". Must be 1, 2, 3, or 4
Row 4: Laboratory type is only available for BSIT programs, not BSCS

Please fix these errors and try again.
```
**Fix:** Correct each row according to the error message

### No Valid Courses
```
❌ No valid courses found in the Excel file
```
**Fix:** Check that you have at least one valid course row

---

## ✅ Success Message

When validation passes:
```
✅ Excel validation passed!

Summary:
- Courses to import: 25
- Template: Valid
- All columns: Present
- All data: Valid format

Click OK to proceed with importing.
```

Then after import:
```
✅ Successfully imported 25 course(s)!
```

---

## 📋 Template Requirements - Exact Format

### Column Names (Case-Insensitive)
```
Program | Year | Code | Name | Type | Term
```

### Valid Values
- **Program:** BSIT, BSCS, BSIS
- **Year:** 1, 2, 3, 4
- **Code:** Any text (e.g., IT101)
- **Name:** Any text (e.g., Programming 1)
- **Type:** 
  - BSIT: lecture, laboratory, leclab
  - BSCS/BSIS: lecture, leclab
- **Term:** TERM 1, TERM 2, TERM 3 (or just 1, 2, 3)

### Example Valid Row
```
BSIT | 1 | IT101 | Introduction to Computing | lecture | TERM 1
```

---

## 🚀 How to Import Successfully

### Step 1: Download Template
- Go to Courses page
- Click "Download Template" button
- Save the file

### Step 2: Fill in Data
- Open the template
- Keep the header row
- Add your courses below
- Use exact format (see examples below)

### Step 3: Verify Data
- Program: BSIT, BSCS, or BSIS ✅
- Year: 1, 2, 3, or 4 ✅
- Code: Not empty ✅
- Name: Not empty ✅
- Type: lecture, laboratory (BSIT only), leclab ✅
- Term: TERM 1, TERM 2, or TERM 3 ✅

### Step 4: Import
- Go to Courses page
- Click "Import Excel File"
- Select your file
- Review validation summary
- Click OK to import

---

## 📊 Examples

### ✅ Valid Import File
```
Program,Year,Code,Name,Type,Term
BSIT,1,IT101,Intro to Computing,lecture,TERM 1
BSIT,1,IT102,Programming Lab,laboratory,TERM 1
BSIT,1,IT103,Data Structures,leclab,TERM 2
BSCS,1,CS101,Algorithms,lecture,TERM 1
BSCS,1,CS102,Database Systems,leclab,TERM 2
BSIS,2,IS201,Business Analysis,lecture,TERM 1
```

### ❌ Invalid Examples & Fixes
```
❌ BSIT,1,IT101,Programming,invalid_type,TERM 1
✅ BSIT,1,IT101,Programming,lecture,TERM 1
   Problem: Type must be lecture, laboratory, or leclab

❌ BSCS,1,CS101,Databases,laboratory,TERM 1
✅ BSCS,1,CS101,Databases,leclab,TERM 1
   Problem: Laboratory is only for BSIT

❌ BSIT,5,IT101,Computing,lecture,TERM 1
✅ BSIT,1,IT101,Computing,lecture,TERM 1
   Problem: Year must be 1, 2, 3, or 4

❌ BSIT,1,,Programming,lecture,TERM 1
✅ BSIT,1,IT101,Programming,lecture,TERM 1
   Problem: Code cannot be empty

❌ BSIT,1,IT101,,lecture,TERM 1
✅ BSIT,1,IT101,Programming,lecture,TERM 1
   Problem: Name cannot be empty
```

---

## 🎓 Key Points

1. ✅ Always download and use the official template
2. ✅ Follow exact column names and format
3. ✅ Laboratory is BSIT-only
4. ✅ Year must be 1, 2, 3, or 4
5. ✅ Read error messages carefully - they tell you exactly what's wrong
6. ✅ Fix errors before trying again
7. ✅ Review the summary before confirming import

---

**The validation system ensures data quality and prevents errors!** 🎉

