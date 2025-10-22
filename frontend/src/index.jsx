import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './App.css';
import nuLogo from './assets/national-university-philippines-logo-png_seeklogo-499282-removebg-preview.png';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : '/api';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [scheduleView, setScheduleView] = useState('section');
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [theme, setTheme] = useState('light');

  const [enrollmentData, setEnrollmentData] = useState([]);
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    type: 'lecture',
    term: 'TERM 1',
    program_id: '',
    year_level: 1
  });
  const [editingCourse, setEditingCourse] = useState(null);
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: 'lecture'
  });

  useEffect(() => {
    loadPrograms();
    loadSections();
    loadCourses();
    loadRooms();
    loadSchedules();
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const loadPrograms = async () => {
    try {
      const response = await axios.get(`${API_URL}/programs`);
      if (Array.isArray(response.data)) {
        setPrograms(response.data);
        initializeEnrollmentData(response.data);
        setDbConnected(true);
      } else {
        setPrograms([]);
        setDbConnected(false);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
      setPrograms([]);
      setDbConnected(false);
    }
  };

  const initializeEnrollmentData = (programs) => {
    if (!Array.isArray(programs) || programs.length === 0) {
      setEnrollmentData([]);
      return;
    }
    
    const data = [];
    programs.forEach(program => {
      for (let year = 1; year <= 4; year++) {
        data.push({
          program_id: program.id,
          program_code: program.code,
          year_level: year,
          total_students: 0
        });
      }
    });
    setEnrollmentData(data);
  };

  const loadSections = async () => {
    try {
      const response = await axios.get(`${API_URL}/sections`);
      setSections(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setSections([]);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses`);
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setCourses([]);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      setRooms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setRooms([]);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await axios.get(`${API_URL}/schedules`);
      setSchedules(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setSchedules([]);
    }
  };

  const handleEnrollmentChange = (programId, yearLevel, value) => {
    setEnrollmentData(prev => prev.map(item =>
      item.program_id === programId && item.year_level === yearLevel
        ? { ...item, total_students: parseInt(value) || 0 }
        : item
    ));
  };

  const generateSections = async () => {
    setLoading(true);
    try {
      const enrollments = enrollmentData.filter(e => e.total_students > 0);
      const response = await axios.post(`${API_URL}/sections/generate`, { enrollments });
      setSections(response.data.sections);
      alert('Sections generated successfully!');
      await loadSections();
    } catch (error) {
      alert('Error generating sections: ' + error.message);
    }
    setLoading(false);
  };

  const addCourse = async () => {
    if (!newCourse.code || !newCourse.name || !newCourse.program_id) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const selectedProgram = programs.find(p => p.id === parseInt(newCourse.program_id));
      const isIT = selectedProgram?.code === 'BSIT';
      
      let hoursLecture = 0;
      let hoursLab = 0;
      
      if (newCourse.type === 'lecture') {
        hoursLecture = isIT ? 2 : 4;
        hoursLab = 0;
      } else if (newCourse.type === 'laboratory') {
        hoursLecture = 0;
        hoursLab = 2;
      } else if (newCourse.type === 'leclab') {
        hoursLecture = isIT ? 2 : 2.67;
        hoursLab = isIT ? 2 : 4;
      }
      
      const courseData = {
        ...newCourse,
        hours_lecture: hoursLecture,
        hours_lab: hoursLab
      };

      await axios.post(`${API_URL}/courses`, { courses: [courseData] });
      await loadCourses();
      setNewCourse({
        code: '',
        name: '',
        type: 'lecture',
        term: 'TERM 1',
        program_id: newCourse.program_id,
        year_level: newCourse.year_level
      });
      alert('Course added successfully!');
    } catch (error) {
      alert('Error adding course: ' + error.message);
    }
    setLoading(false);
  };

  const startEditCourse = (course) => {
    setEditingCourse({
      id: course.id,
      code: course.code,
      name: course.name,
      type: course.type,
      term: course.term || 'TERM 1',
      program_id: course.program_id,
      year_level: course.year_level
    });
  };

  const saveEditCourse = async () => {
    if (!editingCourse.code || !editingCourse.name || !editingCourse.program_id) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const selectedProgram = programs.find(p => p.id === parseInt(editingCourse.program_id));
      const isIT = selectedProgram?.code === 'BSIT';
      
      let hoursLecture = 0;
      let hoursLab = 0;
      
      if (editingCourse.type === 'lecture') {
        hoursLecture = isIT ? 2 : 4;
        hoursLab = 0;
      } else if (editingCourse.type === 'laboratory') {
        hoursLecture = 0;
        hoursLab = 2;
      } else if (editingCourse.type === 'leclab') {
        hoursLecture = isIT ? 2 : 2.67;
        hoursLab = isIT ? 2 : 4;
      }
      
      const courseData = {
        ...editingCourse,
        hours_lecture: hoursLecture,
        hours_lab: hoursLab
      };

      await axios.put(`${API_URL}/courses/${editingCourse.id}`, { course: courseData });
      await loadCourses();
      setEditingCourse(null);
      alert('Course updated successfully!');
    } catch (error) {
      alert('Error updating course: ' + error.message);
    }
    setLoading(false);
  };

  const cancelEditCourse = () => {
    setEditingCourse(null);
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('❌ Excel file is empty. Please add course data.');
        setLoading(false);
        return;
      }

      // Validate column headers
      const expectedColumns = ['Program', 'Year', 'Code', 'Name', 'Type', 'Term'];
      const actualColumns = Object.keys(jsonData[0] || {});
      
      // Check if required columns exist (case-insensitive)
      const normalizedActualColumns = actualColumns.map(col => col.toLowerCase());
      const normalizedExpectedColumns = expectedColumns.map(col => col.toLowerCase());
      
      const missingColumns = normalizedExpectedColumns.filter(
        col => !normalizedActualColumns.includes(col)
      );

      if (missingColumns.length > 0) {
        alert(
          `❌ Invalid Excel template!\n\nMissing columns: ${missingColumns.map(col => col.charAt(0).toUpperCase() + col.slice(1)).join(', ')}\n\n` +
          `Required columns: Program, Year, Code, Name, Type, Term\n\n` +
          `Found columns: ${actualColumns.join(', ')}\n\n` +
          `Please download the template and use the exact format.`
        );
        event.target.value = '';
        setLoading(false);
        return;
      }

      // Validate and transform the data
      const coursesToImport = [];
      const errors = [];
      const warnings = [];

      jsonData.forEach((row, index) => {
        const rowNum = index + 2; // +2 because Excel rows start at 1 and we have a header
        
        // Extract values (case-insensitive)
        const programVal = row.Program || row.program || '';
        const yearVal = row.Year || row.year || '';
        const codeVal = row.Code || row.code || '';
        const nameVal = row.Name || row.name || '';
        const typeVal = row.Type || row.type || '';
        const termVal = row.Term || row.term || '';

        // Validate Program
        const program = programs.find(p => 
          p.code.toUpperCase() === String(programVal).toUpperCase()
        );
        
        if (!program) {
          errors.push(`Row ${rowNum}: Invalid program code "${programVal}". Valid options: BSIT, BSCS, BSIS`);
          return;
        }

        // Validate Code
        const code = String(codeVal).trim();
        if (!code) {
          errors.push(`Row ${rowNum}: Course Code is required`);
          return;
        }

        // Validate Name
        const name = String(nameVal).trim();
        if (!name) {
          errors.push(`Row ${rowNum}: Course Name is required`);
          return;
        }

        // Validate Year Level
        const yearLevel = parseInt(yearVal);
        if (isNaN(yearLevel) || yearLevel < 1 || yearLevel > 4) {
          errors.push(`Row ${rowNum}: Invalid Year "${yearVal}". Must be 1, 2, 3, or 4`);
          return;
        }

        // Validate Type
        const typeStr = String(typeVal).toLowerCase().trim();
        const validTypes = ['lecture', 'laboratory', 'lab', 'leclab', 'lecture + lab'];
        if (!validTypes.some(t => typeStr.includes(t))) {
          errors.push(`Row ${rowNum}: Invalid Type "${typeVal}". Valid options: lecture, laboratory, leclab`);
          return;
        }

        // Map type variations to our type enum
        let type = 'lecture';
        if (typeStr.includes('lab') && typeStr.includes('lec')) {
          type = 'leclab';
        } else if (typeStr.includes('lab')) {
          type = 'laboratory';
        }

        // Validate Laboratory is only for BSIT
        if (type === 'laboratory' && program.code !== 'BSIT') {
          errors.push(`Row ${rowNum}: Laboratory type is only available for BSIT programs, not ${program.code}`);
          return;
        }

        // Validate Term
        const termStr = String(termVal).toUpperCase().trim();
        const validTerms = ['TERM 1', 'TERM 2', 'TERM 3', 'TERM1', 'TERM2', 'TERM3', '1', '2', '3'];
        if (!validTerms.includes(termStr)) {
          errors.push(`Row ${rowNum}: Invalid Term "${termVal}". Valid options: TERM 1, TERM 2, TERM 3`);
          return;
        }

        // Map term
        let term = 'TERM 1';
        if (termStr.includes('TERM 2') || termStr === '2') {
          term = 'TERM 2';
        } else if (termStr.includes('TERM 3') || termStr === '3') {
          term = 'TERM 3';
        } else if (termStr.includes('TERM 1') || termStr === '1') {
          term = 'TERM 1';
        }

        const isIT = program.code === 'BSIT';
        
        let hoursLecture = 0;
        let hoursLab = 0;
        
        if (type === 'lecture') {
          hoursLecture = isIT ? 2 : 4;
          hoursLab = 0;
        } else if (type === 'laboratory') {
          hoursLecture = 0;
          hoursLab = 2;
        } else if (type === 'leclab') {
          hoursLecture = isIT ? 2 : 2.67;
          hoursLab = isIT ? 2 : 4;
        }
        
        const courseData = {
          code,
          name,
          type,
          term,
          program_id: program.id,
          year_level: yearLevel,
          hours_lecture: hoursLecture,
          hours_lab: hoursLab
        };

        coursesToImport.push(courseData);
      });

      // Show validation summary
      if (errors.length > 0) {
        const errorSummary = errors.slice(0, 10).join('\n') + 
                           (errors.length > 10 ? `\n... and ${errors.length - 10} more errors` : '');
        alert(
          `❌ Excel file validation failed!\n\nErrors found (${errors.length} total):\n\n${errorSummary}\n\n` +
          `Please fix these errors and try again.`
        );
        event.target.value = '';
        setLoading(false);
        return;
      }

      if (coursesToImport.length === 0) {
        alert('❌ No valid courses found in the Excel file');
        event.target.value = '';
        setLoading(false);
        return;
      }

      // Show import summary before confirming
      const importSummary = `
✅ Excel validation passed!

Summary:
- Courses to import: ${coursesToImport.length}
- Template: Valid
- All columns: Present
- All data: Valid format

Click OK to proceed with importing.
      `.trim();

      if (!confirm(importSummary)) {
        event.target.value = '';
        setLoading(false);
        return;
      }

      // Import all courses
      console.log('Importing courses:', coursesToImport);
      const response = await axios.post(`${API_URL}/courses`, { courses: coursesToImport });
      console.log('Import response:', response.data);
      
      console.log('Reloading courses...');
      await loadCourses();
      console.log('Courses reloaded');
      
      alert(`✅ Successfully imported ${coursesToImport.length} course(s)!`);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      alert('❌ Error importing Excel file: ' + error.message);
    }
    setLoading(false);
  };

  const downloadExcelTemplate = () => {
    const templateData = [
      {
        Program: 'BSIT',
        Year: 1,
        Code: 'IT101',
        Name: 'Introduction to Computing',
        Type: 'lecture',
        Term: 'TERM 1'
      },
      {
        Program: 'BSIT',
        Year: 1,
        Code: 'IT102',
        Name: 'Programming Lab',
        Type: 'laboratory',
        Term: 'TERM 1'
      },
      {
        Program: 'BSIT',
        Year: 1,
        Code: 'IT103',
        Name: 'Programming 1',
        Type: 'leclab',
        Term: 'TERM 2'
      },
      {
        Program: 'BSCS',
        Year: 1,
        Code: 'CS101',
        Name: 'Computer Science Fundamentals',
        Type: 'leclab',
        Term: 'TERM 1'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 10 },  // Program
      { wch: 6 },   // Year
      { wch: 10 },  // Code
      { wch: 40 },  // Name
      { wch: 12 },  // Type
      { wch: 10 }   // Term
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(wb, 'Course_Import_Template.xlsx');
  };

  const deleteCourse = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/courses/${id}`);
      await loadCourses();
    } catch (error) {
      alert('Error deleting course: ' + error.message);
    }
    setLoading(false);
  };

  const addRoom = async () => {
    if (!newRoom.name) {
      alert('Please enter room name');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/rooms`, { rooms: [newRoom] });
      await loadRooms();
      setNewRoom({ name: '', type: 'lecture' });
      alert('Room added successfully!');
    } catch (error) {
      alert('Error adding room: ' + error.message);
    }
    setLoading(false);
  };

  const deleteRoom = async (id) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/rooms/${id}`);
      await loadRooms();
    } catch (error) {
      alert('Error deleting room: ' + error.message);
    }
    setLoading(false);
  };

  const generateSchedule = async () => {
    if (sections.length === 0) {
      alert('Please generate sections first');
      return;
    }
    if (courses.length === 0) {
      alert('Please add courses first');
      return;
    }
    if (rooms.length === 0) {
      alert('Please add rooms first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/schedules/generate`);
      await loadSchedules();
      setConflicts(response.data.conflicts || []);
      
      if (response.data.conflicts && response.data.conflicts.length > 0) {
        alert(`Schedule generated with ${response.data.conflicts.length} conflicts.`);
      } else {
        alert('Schedule generated successfully with no conflicts!');
      }
      
      setActivePage('view-schedules');
    } catch (error) {
      alert('Error generating schedule: ' + error.message);
    }
    setLoading(false);
  };

  const deleteSchedule = async () => {
    if (schedules.length === 0) {
      alert('No schedule to delete');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete all ${schedules.length} scheduled classes? This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/schedules`);
      await loadSchedules();
      setConflicts([]);
      alert('Schedule deleted successfully');
    } catch (error) {
      alert('Error deleting schedule: ' + error.message);
    }
    setLoading(false);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Group schedules by Program
    const programGroups = {};
    schedules.forEach(s => {
      if (!programGroups[s.program_code]) {
        programGroups[s.program_code] = [];
      }
      programGroups[s.program_code].push(s);
    });
    
    // Create a sheet for each program
    for (const [programCode, programSchedules] of Object.entries(programGroups)) {
      const scheduleData = [];
      
      // Group by term
      const termGroups = {};
      programSchedules.forEach(s => {
        const term = s.course_term || 'TERM 1';
        if (!termGroups[term]) {
          termGroups[term] = [];
        }
        termGroups[term].push(s);
      });
      
      // Add data by term
      for (const term of ['TERM 1', 'TERM 2', 'TERM 3']) {
        const termSchedules = termGroups[term] || [];
        
        if (termSchedules.length === 0) continue;
        
        // Add term header
        scheduleData.push({
          'Program': '',
          'Year': '',
          'Section': '',
          'Course Code': term,
          'Course Name': '',
          'Type': '',
          'Days': '',
          'Time': '',
          'Room': ''
        });
        
        // Group by year within term
        const yearGroups = {};
        termSchedules.forEach(s => {
          if (!yearGroups[s.year_level]) {
            yearGroups[s.year_level] = [];
          }
          yearGroups[s.year_level].push(s);
        });
        
        // Sort by year and add courses
        for (const year of [1, 2, 3, 4]) {
          const yearSchedules = yearGroups[year] || [];
          
          // Sort by section
          yearSchedules.sort((a, b) => a.section_letter.localeCompare(b.section_letter));
          
          yearSchedules.forEach(s => {
            scheduleData.push({
              'Program': s.program_code,
              'Year': s.year_level,
              'Section': s.section_letter,
              'Course Code': s.course_code,
              'Course Name': s.course_name,
              'Type': s.schedule_type,
              'Days': s.day_pattern,
              'Time': `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`,
              'Room': s.room_name
            });
          });
        }
        
        // Add blank row between terms
        scheduleData.push({
          'Program': '',
          'Year': '',
          'Section': '',
          'Course Code': '',
          'Course Name': '',
          'Type': '',
          'Days': '',
          'Time': '',
          'Room': ''
        });
      }
      
      // Create sheet for this program
      const ws = XLSX.utils.json_to_sheet(scheduleData);
      ws['!cols'] = [
        { wch: 12 },
        { wch: 8 },
        { wch: 8 },
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
        { wch: 18 },
        { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, programCode);
    }
    
    // Create summary sheet with all schedules
    const summaryData = schedules.map(s => ({
      'Program': s.program_code,
      'Term': s.course_term || 'TERM 1',
      'Year': s.year_level,
      'Section': s.section_letter,
      'Course Code': s.course_code,
      'Course Name': s.course_name,
      'Type': s.schedule_type,
      'Days': s.day_pattern,
      'Time': `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`,
      'Room': s.room_name
    }));
    
    // Sort summary by Program, Term, Year
    summaryData.sort((a, b) => {
      if (a.Program !== b.Program) {
        return a.Program.localeCompare(b.Program);
      }
      const termOrder = { 'TERM 1': 0, 'TERM 2': 1, 'TERM 3': 2 };
      if ((termOrder[a.Term] ?? 0) !== (termOrder[b.Term] ?? 0)) {
        return (termOrder[a.Term] ?? 0) - (termOrder[b.Term] ?? 0);
      }
      if (a.Year !== b.Year) {
        return a.Year - b.Year;
      }
      return a['Course Code'].localeCompare(b['Course Code']);
    });
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 8 },
      { wch: 8 },
      { wch: 15 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary', 0);
    
    XLSX.writeFile(wb, `NU_Schedule_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupSchedulesBySection = () => {
    const grouped = {};
    schedules.forEach(schedule => {
      const key = `${schedule.program_code}${schedule.year_level}${schedule.section_letter}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(schedule);
    });
    return grouped;
  };

  const groupSchedulesByRoom = () => {
    const grouped = {};
    schedules.forEach(schedule => {
      if (!grouped[schedule.room_name]) {
        grouped[schedule.room_name] = [];
      }
      grouped[schedule.room_name].push(schedule);
    });
    return grouped;
  };

  const lectureRoomsCount = rooms.filter(r => r.type === 'lecture').length;
  const labRoomsCount = rooms.filter(r => r.type === 'laboratory').length;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
            <img src={nuLogo} alt="NU Laguna Logo"/>
            </div>
            <div className="logo-text">
              <div className="logo-title">NU Laguna</div>
              <div className="logo-subtitle">Scheduling System</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Navigation</div>
          <button 
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'enrollment' ? 'active' : ''}`} onClick={() => setActivePage('enrollment')}>
            <span>Enrollment</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'courses' ? 'active' : ''}`} onClick={() => setActivePage('courses')}>
            <span>Courses</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'rooms' ? 'active' : ''}`} onClick={() => setActivePage('rooms')}>
            <span>Rooms</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'generate' ? 'active' : ''}`} onClick={() => setActivePage('generate')}>
            <span>Generate Schedule</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'view-schedules' ? 'active' : ''}`} onClick={() => setActivePage('view-schedules')}>
            <span>View Schedules</span>
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>
        
        {activePage === 'dashboard' && (
          <div className="page">
            <div className="page-header">
              <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome to the NU Laguna Academic Scheduling System</p>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Sections</div>
                <div className="stat-value">{sections.length}</div>
                <div className="stat-description">Across all programs and year levels</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Available Rooms</div>
                <div className="stat-value">{rooms.length}</div>
                <div className="stat-description">{lectureRoomsCount} Lecture · {labRoomsCount} Laboratory</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Schedules Generated</div>
                <div className="stat-value">{schedules.length > 0 ? 'Yes' : 'No'}</div>
                <div className="stat-description">{schedules.length} schedule entries</div>
              </div>

              <div className="dashboard-card">
                <h2 className="card-title">Getting Started</h2>
                <p className="card-subtitle">Follow these steps to create a schedule</p>
                
                <div className="getting-started">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <div className="step-title">Input Enrollment</div>
                      <div className="step-description">Enter number of student per year Level to generate sections</div>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <div className="step-title">Add Courses</div>
                      <div className="step-description">Define lecture and lab courses</div>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <div className="step-title">Setup Rooms</div>
                      <div className="step-description">Add available lecture and lab rooms</div>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <div className="step-title">Generate Schedule</div>
                      <div className="step-description">Run the algorithm to create schedules</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!dbConnected && programs.length === 0 && (
              <div className="alert alert-warning">
                <strong> Database not connected</strong>
                <p>Please set up MySQL in XAMPP and run the database.sql file. See SETUP.md for instructions.</p>
              </div>
            )}
          </div>
        )}

        {activePage === 'enrollment' && (
          <div className="page">
            <div className="page-header">
              <h1 className="page-title">Enrollment</h1>
            </div>

            {Array.isArray(programs) && programs.length > 0 ? (
              <div className="content-grid">
                {programs.map(program => (
                  <div key={program.id} className="card">
                    <h3 className="card-header">{program.code} - {program.name}</h3>
                    <div className="enrollment-grid">
                      {[1, 2, 3, 4].map(year => {
                        const enrollment = enrollmentData.find(
                          e => e.program_id === program.id && e.year_level === year
                        );
                        return (
                          <div key={year} className="form-group">
                            <label>Year {year}</label>
                            <input
                              type="number"
                              min="0"
                              value={enrollment?.total_students || 0}
                              onChange={(e) => handleEnrollmentChange(program.id, year, e.target.value)}
                              placeholder="Number of students"
                              className="input"/>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-warning">
                <p>Database not connected. Please set up MySQL and run the database schema.</p>
              </div>
            )}

            <div className="page-actions">
              <button 
                className="btn btn-primary" 
                onClick={generateSections}
                disabled={loading}>
                {loading ? 'Generating...' : 'Generate Sections'}
              </button>
            </div>

            {Array.isArray(sections) && sections.length > 0 && (
              <div className="card">
                <h3 className="card-header">Generated Sections ({sections.length})</h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Section</th>
                        <th>Program</th>
                        <th>Year</th>
                        <th>Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map(section => (
                        <tr key={section.id}>
                          <td><strong>{section.program_code}{section.year_level}{section.letter}</strong></td>
                          <td>{section.program_name}</td>
                          <td>Year {section.year_level}</td>
                          <td>{section.student_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activePage === 'courses' && (
          <div className="page">
            <div className="page-header">
              <h1 className="page-title">Courses</h1>
            </div>

            <div className="card">
              <h3 className="card-header">Add New Course</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Program</label>
                  <select
                    value={newCourse.program_id} onChange={(e) => setNewCourse({...newCourse, program_id: e.target.value})} className="input">
                    <option value="">Select Program</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.code}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year Level</label>
                  <select
                    value={newCourse.year_level} onChange={(e) => setNewCourse({...newCourse, year_level: parseInt(e.target.value)})} className="input">
                    {[1, 2, 3, 4].map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Course Code</label>
                  <input
                    type="text" value={newCourse.code} onChange={(e) => setNewCourse({...newCourse, code: e.target.value})} placeholder="e.g., IT101" className="input"/>
                </div>
                <div className="form-group">
                  <label>Course Name</label>
                  <input
                    type="text" value={newCourse.name} onChange={(e) => setNewCourse({...newCourse, name: e.target.value})} placeholder="e.g., Programming 1" className="input"/>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newCourse.type} onChange={(e) => setNewCourse({...newCourse, type: e.target.value})} className="input">
                    {programs.find(p => p.id === parseInt(newCourse.program_id))?.code === 'BSIT' ? (<>
                        <option value="lecture">Lecture (2 hrs)</option>
                        <option value="laboratory">Laboratory (2 hrs)</option>
                        <option value="leclab">Lecture + Lab (2 + 2 hrs)</option></>
                    ) : (<>
                        <option value="lecture">Lecture (4 hrs)</option>
                        <option value="leclab">Lecture + Lab (2.67 + 4 hrs)</option></>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Term</label>
                  <select
                    value={newCourse.term} onChange={(e) => setNewCourse({...newCourse, term: e.target.value})} className="input">
                    <option value="TERM 1">TERM 1</option>
                    <option value="TERM 2">TERM 2</option>
                    <option value="TERM 3">TERM 3</option>
                  </select>
                </div>
              </div>
              <div className="card-actions">
                <button className="btn btn-primary" onClick={addCourse} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Course'}
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="card-header">Import Courses from Excel</h3>
              <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
                Import multiple courses at once using an Excel file. Download the template to see the required format.
              </p>
              <div className="card-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={downloadExcelTemplate}
                  disabled={loading}>
                  Download Template
                </button>
                <label className="btn btn-success" style={{ cursor: 'pointer', margin: 0 }}>
                  {loading ? 'Importing...' : 'Import Excel File'}
                  <input 
                    type="file" 
                    accept=".xlsx,.xls" 
                    onChange={handleImportExcel}
                    style={{ display: 'none' }}
                    disabled={loading}
                  />
                </label>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>Excel Format:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li><strong>Program:</strong> BSIT, BSCS, or BSIS</li>
                  <li><strong>Year:</strong> 1, 2, 3, or 4</li>
                  <li><strong>Code:</strong> Course code (e.g., IT101)</li>
                  <li><strong>Name:</strong> Course name</li>
                  <li><strong>Type:</strong> lecture, laboratory, or leclab</li>
                  <li><strong>Term:</strong> TERM 1, TERM 2, or TERM 3</li>
                </ul>
              </div>
            </div>

            <div className="card">
              <h3 className="card-header">All Courses ({courses.length})</h3>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Program</th>
                      <th>Year</th>
                      <th>Term</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(courses) && courses.map(course => (
                      <tr key={course.id}>
                        <td><strong>{course.code}</strong></td>
                        <td>{course.name}</td>
                        <td>{course.program_code}</td>
                        <td>Year {course.year_level}</td>
                        <td>{course.term || 'TERM 1'}</td>
                        <td>
                          <span className={`badge badge-${course.type}`}>
                            {course.type === 'lecture' ? 'Lecture' : course.type === 'laboratory' ? 'Laboratory' : 'Lec+Lab'}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            onClick={() => startEditCourse(course)}>
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => deleteCourse(course.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {editingCourse && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Edit Course</h2>
              
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Program</label>
                  <select
                    value={editingCourse.program_id}
                    onChange={(e) => setEditingCourse({...editingCourse, program_id: e.target.value})}
                    className="input">
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.code}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Year Level</label>
                  <select
                    value={editingCourse.year_level}
                    onChange={(e) => setEditingCourse({...editingCourse, year_level: parseInt(e.target.value)})}
                    className="input">
                    {[1, 2, 3, 4].map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Course Code</label>
                  <input
                    type="text"
                    value={editingCourse.code}
                    onChange={(e) => setEditingCourse({...editingCourse, code: e.target.value})}
                    placeholder="e.g., IT101"
                    className="input"/>
                </div>

                <div className="form-group">
                  <label>Course Name</label>
                  <input
                    type="text"
                    value={editingCourse.name}
                    onChange={(e) => setEditingCourse({...editingCourse, name: e.target.value})}
                    placeholder="e.g., Programming 1"
                    className="input"/>
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={editingCourse.type}
                    onChange={(e) => setEditingCourse({...editingCourse, type: e.target.value})}
                    className="input">
                    {programs.find(p => p.id === parseInt(editingCourse.program_id))?.code === 'BSIT' ? (<>
                        <option value="lecture">Lecture (2 hrs)</option>
                        <option value="laboratory">Laboratory (2 hrs)</option>
                        <option value="leclab">Lecture + Lab (2 + 2 hrs)</option></>
                    ) : (<>
                        <option value="lecture">Lecture (4 hrs)</option>
                        <option value="leclab">Lecture + Lab (2.67 + 4 hrs)</option></>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Term</label>
                  <select
                    value={editingCourse.term}
                    onChange={(e) => setEditingCourse({...editingCourse, term: e.target.value})}
                    className="input">
                    <option value="TERM 1">TERM 1</option>
                    <option value="TERM 2">TERM 2</option>
                    <option value="TERM 3">TERM 3</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={cancelEditCourse}
                  disabled={loading}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={saveEditCourse}
                  disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activePage === 'rooms' && (
          <div className="page">
            <div className="page-header">
              <h1 className="page-title">Rooms</h1>
            </div>

            <div className="card">
              <h3 className="card-header">Add New Room</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Room Name</label>
                  <input
                    type="text" value={newRoom.name} onChange={(e) => setNewRoom({...newRoom, name: e.target.value})} placeholder="e.g., CompLab 1" className="input"/>
                </div>
                <div className="form-group">
                  <label>Room Type</label>
                  <select
                    value={newRoom.type} onChange={(e) => setNewRoom({...newRoom, type: e.target.value})} className="input">
                    <option value="lecture">Lecture Room</option>
                    <option value="laboratory">Laboratory</option>
                  </select>
                </div>
              </div>
              <div className="card-actions">
                <button className="btn btn-primary" onClick={addRoom} disabled={loading}> {loading ? 'Adding...' : 'Add Room'}
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="card-header">All Rooms ({rooms.length})</h3>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Room Name</th>
                      <th>Type</th>
                      <th>Operating Hours</th>
                      <th>Available Days</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(rooms) && rooms.map(room => (
                      <tr key={room.id}>
                        <td><strong>{room.name}</strong></td>
                        <td>
                          <span className={`badge badge-${room.type}`}>
                            {room.type === 'lecture' ? 'Lecture' : 'Laboratory'}
                          </span>
                        </td>
                        <td>{formatTime(room.start_time)} - {formatTime(room.end_time)}</td>
                        <td>{room.available_days}</td>
                        <td>
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => deleteRoom(room.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activePage === 'generate' && (
          <div className="page">
            <div className="page-header">
              <h1 className="page-title">Generate Schedule</h1>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Sections</div>
                <div className="stat-value">{sections.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Courses</div>
                <div className="stat-value">{courses.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Lecture Rooms</div>
                <div className="stat-value">{lectureRoomsCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Lab Rooms</div>
                <div className="stat-value">{labRoomsCount}</div>
              </div>
            </div>

            <div className="page-actions">
              <button 
                className="btn btn-primary btn-lg"  onClick={generateSchedule} disabled={loading || sections.length === 0 || courses.length === 0 || rooms.length === 0}>
                {loading ? 'Generating Schedule...' : 'Generate Complete Schedule'}
              </button>
              <button 
                className="btn btn-danger" 
                onClick={deleteSchedule} 
                disabled={loading || schedules.length === 0}>
                {loading ? 'Deleting...' : 'Delete All Generated Schedules'}
              </button>
            </div>

            {conflicts.length > 0 && (
              <div className="card">
                <h3 className="card-header">Conflicts ({conflicts.length})</h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Section</th>
                        <th>Term</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conflicts.map((conflict, idx) => (
                        <tr key={idx}>
                          <td>{conflict.course}</td>
                          <td>{conflict.section}</td>
                          <td><span className="badge badge-info">{conflict.term || 'N/A'}</span></td>
                          <td className="text-danger">{conflict.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activePage === 'view-schedules' && (
          <div className="page">
            <div className="page-header">
              <div>
                <h1 className="page-title">View Schedules</h1>
                <p className="page-subtitle">Browse schedules by section or room</p>
              </div>
              <button className="btn btn-success" onClick={exportToExcel}>
                Export to Excel
              </button>
            </div>

            <div className="tabs">
              <button 
                className={`tab ${scheduleView === 'section' ? 'active' : ''}`} onClick={() => setScheduleView('section')}>
               By Section
              </button>
              <button 
                className={`tab ${scheduleView === 'room' ? 'active' : ''}`} onClick={() => setScheduleView('room')}> 
                By Room
              </button>
              <button 
                className={`tab ${scheduleView === 'mastergrid' ? 'active' : ''}`} onClick={() => setScheduleView('mastergrid')}>
                By Term
              </button>
            </div>

            {scheduleView === 'section' && (
              <>
                {['TERM 1', 'TERM 2', 'TERM 3'].map(term => {
                  const termSchedules = schedules.filter(s => (s.course_term || 'TERM 1') === term);
                  const groupedBySection = {};
                  
                  termSchedules.forEach(schedule => {
                    const key = `${schedule.program_code}${schedule.year_level}${schedule.section_letter}`;
                    if (!groupedBySection[key]) {
                      groupedBySection[key] = [];
                    }
                    groupedBySection[key].push(schedule);
                  });
                  
                  return termSchedules.length > 0 ? (
                    <div key={term}>
                      <h2 className="card-header" style={{ marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', backgroundColor: '#007bff', color: 'white', padding: '10px 15px', borderRadius: '4px' }}>
                        {term}
                      </h2>
                      {Object.entries(groupedBySection).map(([sectionCode, sectionSchedules]) => (
                        <div key={sectionCode} className="card">
                          <h3 className="card-header">{sectionCode}</h3>
                          <div className="table-responsive">
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>Course Code</th>
                                  <th>Course Name</th>
                                  <th>Type</th>
                                  <th>Days</th>
                                  <th>Time</th>
                                  <th>Room</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sectionSchedules.map(schedule => (
                                  <tr key={schedule.id}>
                                    <td><strong>{schedule.course_code}</strong></td>
                                    <td>{schedule.course_name}</td>
                                    <td>
                                      <span className={`badge badge-${schedule.schedule_type}`}>
                                        {schedule.schedule_type}
                                      </span>
                                    </td>
                                    <td>{schedule.day_pattern}</td>
                                    <td>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</td>
                                    <td>{schedule.room_name}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })}
              </>
            )}

            {scheduleView === 'room' && (
              <>
                {['TERM 1', 'TERM 2', 'TERM 3'].map(term => {
                  const termSchedules = schedules.filter(s => (s.course_term || 'TERM 1') === term);
                  const groupedByRoom = {};
                  
                  termSchedules.forEach(schedule => {
                    if (!groupedByRoom[schedule.room_name]) {
                      groupedByRoom[schedule.room_name] = [];
                    }
                    groupedByRoom[schedule.room_name].push(schedule);
                  });
                  
                  return termSchedules.length > 0 ? (
                    <div key={term}>
                      <h2 className="card-header" style={{ marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', backgroundColor: '#007bff', color: 'white', padding: '10px 15px', borderRadius: '4px' }}>
                        {term}
                      </h2>
                      {Object.entries(groupedByRoom).map(([roomName, roomSchedules]) => (
                        <div key={roomName} className="card">
                          <h3 className="card-header">{roomName}</h3>
                          <div className="table-responsive">
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>Section</th>
                                  <th>Course</th>
                                  <th>Type</th>
                                  <th>Days</th>
                                  <th>Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {roomSchedules.map(schedule => (
                                  <tr key={schedule.id}>
                                    <td>
                                      <strong>
                                        {schedule.program_code}{schedule.year_level}{schedule.section_letter}
                                      </strong>
                                    </td>
                                    <td>{schedule.course_code} - {schedule.course_name}</td>
                                    <td>
                                      <span className={`badge badge-${schedule.schedule_type}`}>
                                        {schedule.schedule_type}
                                      </span>
                                    </td>
                                    <td>{schedule.day_pattern}</td>
                                    <td>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })}
              </>
            )}
            {scheduleView === 'mastergrid' && (
              <>
                {['TERM 1', 'TERM 2', 'TERM 3'].map(term => {
                  const termSchedules = schedules.filter(s => (s.course_term || 'TERM 1') === term);
                  
                  if (termSchedules.length === 0) return null;
                  
                  // Group by program and year level
                  const groupedByProgram = {};
                  termSchedules.forEach(schedule => {
                    const programKey = `${schedule.program_code}`;
                    if (!groupedByProgram[programKey]) {
                      groupedByProgram[programKey] = {};
                    }
                    
                    const yearKey = schedule.year_level;
                    if (!groupedByProgram[programKey][yearKey]) {
                      groupedByProgram[programKey][yearKey] = [];
                    }
                    
                    groupedByProgram[programKey][yearKey].push(schedule);
                  });
                  
                  return (
                    <div key={term}>
                      <h2 className="card-header" style={{ marginTop: '30px', marginBottom: '20px', fontSize: '1.8em', backgroundColor: '#007bff', color: 'white', padding: '15px', borderRadius: '4px', fontWeight: 'bold' }}>
                        📅 {term}
                      </h2>
                      
                      {Object.entries(groupedByProgram).map(([program, years]) => (
                        <div key={program} style={{ marginBottom: '30px' }}>
                          <h3 style={{ fontSize: '1.3em', color: '#333', borderBottom: '3px solid #007bff', paddingBottom: '8px', marginBottom: '15px' }}>
                            {program} Program
                          </h3>
                          
                          {Object.entries(years).sort((a, b) => a[0] - b[0]).map(([year, yearSchedules]) => (
                            <div key={`${program}-${year}`} style={{ marginBottom: '20px' }}>
                              <div className="card">
                                <h4 className="card-header" style={{ backgroundColor: '#e9ecef', color: '#333', marginBottom: '0' }}>
                                  Year {year} Level
                                </h4>
                                <div className="table-responsive">
                                  <table className="table" style={{ marginBottom: '0' }}>
                                    <thead>
                                      <tr>
                                        <th>Section</th>
                                        <th>Course Code</th>
                                        <th>Course Name</th>
                                        <th>Type</th>
                                        <th>Days</th>
                                        <th>Time</th>
                                        <th>Room</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {yearSchedules.sort((a, b) => 
                                        a.section_letter.localeCompare(b.section_letter)
                                      ).map(schedule => (
                                        <tr key={schedule.id}>
                                          <td><strong>{schedule.section_letter}</strong></td>
                                          <td><strong>{schedule.course_code}</strong></td>
                                          <td>{schedule.course_name}</td>
                                          <td>
                                            <span className={`badge badge-${schedule.schedule_type}`}>
                                              {schedule.schedule_type}
                                            </span>
                                          </td>
                                          <td>{schedule.day_pattern}</td>
                                          <td>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</td>
                                          <td><strong>{schedule.room_name}</strong></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
            {schedules.length === 0 && (
              <div className="alert alert-info">
                <p>No schedules generated yet. Go to Generate Schedule to create one.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
