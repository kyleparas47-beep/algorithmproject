import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './App.css';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : `https://${window.location.hostname.replace('5000', '3000')}/api`;

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

  const [enrollmentData, setEnrollmentData] = useState([]);
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    type: 'lecture',
    program_id: '',
    year_level: 1
  });
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
  }, []);

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
      const courseData = {
        ...newCourse,
        hours_lecture: newCourse.type === 'lecture' ? 4 : 2.67,
        hours_lab: newCourse.type === 'leclab' ? 4 : 0
      };

      await axios.post(`${API_URL}/courses`, { courses: [courseData] });
      await loadCourses();
      setNewCourse({
        code: '',
        name: '',
        type: 'lecture',
        program_id: newCourse.program_id,
        year_level: newCourse.year_level
      });
      alert('Course added successfully!');
    } catch (error) {
      alert('Error adding course: ' + error.message);
    }
    setLoading(false);
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

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const scheduleData = schedules.map(s => ({
      'Program': s.program_code,
      'Year': s.year_level,
      'Section': s.section_letter,
      'Course Code': s.course_code,
      'Course Name': s.course_name,
      'Type': s.schedule_type,
      'Days': s.day_pattern,
      'Time': `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`,
      'Room': s.room_name
    }));
    
    const ws = XLSX.utils.json_to_sheet(scheduleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Schedules');
    
    XLSX.writeFile(wb, 'NU_Schedule.xlsx');
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
            <div className="logo-icon">NU</div>
            <div className="logo-text">
              <div className="logo-title">NU Laguna</div>
              <div className="logo-subtitle">Scheduling System</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Navigation</div>
          <button 
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'enrollment' ? 'active' : ''}`}
            onClick={() => setActivePage('enrollment')}
          >
            <span className="nav-icon">👥</span>
            <span>Enrollment</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'courses' ? 'active' : ''}`}
            onClick={() => setActivePage('courses')}
          >
            <span className="nav-icon">📚</span>
            <span>Courses</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'rooms' ? 'active' : ''}`}
            onClick={() => setActivePage('rooms')}
          >
            <span className="nav-icon">🏛️</span>
            <span>Rooms</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'generate' ? 'active' : ''}`}
            onClick={() => setActivePage('generate')}
          >
            <span className="nav-icon">⚡</span>
            <span>Generate Schedule</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'view-schedules' ? 'active' : ''}`}
            onClick={() => setActivePage('view-schedules')}
          >
            <span className="nav-icon">📅</span>
            <span>View Schedules</span>
          </button>
        </nav>
      </aside>

      <main className="main-content">
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
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-label">Total Sections</div>
                  <div className="stat-value">{sections.length}</div>
                  <div className="stat-description">Across all programs and year levels</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏛️</div>
                <div className="stat-content">
                  <div className="stat-label">Available Rooms</div>
                  <div className="stat-value">{rooms.length}</div>
                  <div className="stat-description">{lectureRoomsCount} Lecture · {labRoomsCount} Laboratory</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-label">Schedules Generated</div>
                  <div className="stat-value">{schedules.length > 0 ? 'Yes' : 'No'}</div>
                  <div className="stat-description">{schedules.length} schedule entries</div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h2 className="card-title">Quick Actions</h2>
                <p className="card-subtitle">Get started with scheduling</p>
                
                <div className="quick-actions">
                  <button 
                    className="quick-action-btn"
                    onClick={() => setActivePage('enrollment')}
                  >
                    <span className="quick-action-icon">📝</span>
                    <span>Input Enrollment Data</span>
                  </button>
                  <button 
                    className="quick-action-btn"
                    onClick={() => setActivePage('courses')}
                  >
                    <span className="quick-action-icon">📚</span>
                    <span>Manage Courses</span>
                  </button>
                  <button 
                    className="quick-action-btn primary"
                    onClick={() => setActivePage('generate')}
                  >
                    <span className="quick-action-icon">⚡</span>
                    <span>Generate New Schedule</span>
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <h2 className="card-title">Getting Started</h2>
                <p className="card-subtitle">Follow these steps to create a schedule</p>
                
                <div className="getting-started">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <div className="step-title">Input Enrollment</div>
                      <div className="step-description">Enter student counts to generate sections</div>
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
                <strong>⚠️ Database not connected</strong>
                <p>Please set up MySQL in XAMPP and run the database.sql file. See SETUP.md for instructions.</p>
              </div>
            )}
          </div>
        )}

        {activePage === 'enrollment' && (
          <div className="page">
            <div className="page-header">
              <h1 className="page-title">Enrollment</h1>
              <p className="page-subtitle">Input student numbers to generate sections</p>
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
                              className="input"
                            />
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
                disabled={loading}
              >
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
              <p className="page-subtitle">Manage lecture and lab courses</p>
            </div>

            <div className="card">
              <h3 className="card-header">Add New Course</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Program</label>
                  <select
                    value={newCourse.program_id}
                    onChange={(e) => setNewCourse({...newCourse, program_id: e.target.value})}
                    className="input"
                  >
                    <option value="">Select Program</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.code}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year Level</label>
                  <select
                    value={newCourse.year_level}
                    onChange={(e) => setNewCourse({...newCourse, year_level: parseInt(e.target.value)})}
                    className="input"
                  >
                    {[1, 2, 3, 4].map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Course Code</label>
                  <input
                    type="text"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                    placeholder="e.g., IT101"
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label>Course Name</label>
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                    placeholder="e.g., Programming 1"
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newCourse.type}
                    onChange={(e) => setNewCourse({...newCourse, type: e.target.value})}
                    className="input"
                  >
                    <option value="lecture">Lecture (4 hrs)</option>
                    <option value="leclab">Lecture + Lab (2.67 + 4 hrs)</option>
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
              <h3 className="card-header">All Courses ({courses.length})</h3>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Program</th>
                      <th>Year</th>
                      <th>Type</th>
                      <th>Hours</th>
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
                        <td>
                          <span className={`badge badge-${course.type}`}>
                            {course.type === 'lecture' ? 'Lecture' : 'Lec+Lab'}
                          </span>
                        </td>
                        <td>
                          {course.type === 'lecture' ? '4 hrs' : '2.67 + 4 hrs'}
                        </td>
                        <td>
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => deleteCourse(course.id)}
                          >
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

        {activePage === 'rooms' && (
          <div className="page">
            <div className="page-header">
              <h1 className="page-title">Rooms</h1>
              <p className="page-subtitle">Manage lecture and laboratory rooms</p>
            </div>

            <div className="card">
              <h3 className="card-header">Add New Room</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Room Name</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                    placeholder="e.g., CompLab 1"
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label>Room Type</label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
                    className="input"
                  >
                    <option value="lecture">Lecture Room</option>
                    <option value="laboratory">Laboratory</option>
                  </select>
                </div>
              </div>
              <div className="card-actions">
                <button className="btn btn-primary" onClick={addRoom} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Room'}
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
                            onClick={() => deleteRoom(room.id)}
                          >
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
              <p className="page-subtitle">Run the greedy algorithm to create schedules</p>
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

            <div className="card">
              <h3 className="card-header">Scheduling Algorithm</h3>
              <ul className="info-list">
                <li>Prioritizes Lecture+Lab courses (harder to schedule)</li>
                <li>Handles two time slot options for flexibility</li>
                <li>Ensures no room or section conflicts</li>
                <li>Respects room types (lecture vs laboratory)</li>
                <li>Operates within 7:00 AM - 9:00 PM, Monday-Saturday</li>
              </ul>
            </div>

            <div className="page-actions">
              <button 
                className="btn btn-primary btn-lg" 
                onClick={generateSchedule}
                disabled={loading || sections.length === 0 || courses.length === 0 || rooms.length === 0}
              >
                {loading ? 'Generating Schedule...' : 'Generate Complete Schedule'}
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
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conflicts.map((conflict, idx) => (
                        <tr key={idx}>
                          <td>{conflict.course}</td>
                          <td>{conflict.section}</td>
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
                📥 Export to Excel
              </button>
            </div>

            <div className="tabs">
              <button 
                className={`tab ${scheduleView === 'section' ? 'active' : ''}`}
                onClick={() => setScheduleView('section')}
              >
                By Section
              </button>
              <button 
                className={`tab ${scheduleView === 'room' ? 'active' : ''}`}
                onClick={() => setScheduleView('room')}
              >
                By Room
              </button>
            </div>

            {scheduleView === 'section' && Object.entries(groupSchedulesBySection()).map(([sectionCode, sectionSchedules]) => (
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

            {scheduleView === 'room' && Object.entries(groupSchedulesByRoom()).map(([roomName, roomSchedules]) => (
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
