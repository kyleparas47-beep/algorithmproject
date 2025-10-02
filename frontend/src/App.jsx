import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './App.css';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : `https://${window.location.hostname.replace('5000', '3000')}/api`;

function App() {
  const [activeTab, setActiveTab] = useState('enrollment');
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
        console.error('Invalid programs data received');
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
      console.error('Error loading sections:', error);
      setSections([]);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses`);
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      setRooms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setRooms([]);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await axios.get(`${API_URL}/schedules`);
      setSchedules(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading schedules:', error);
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
      setActiveTab('courses');
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
        alert(`Schedule generated with ${response.data.conflicts.length} conflicts. Check the conflicts tab.`);
      } else {
        alert('Schedule generated successfully with no conflicts!');
      }
      
      setActiveTab('view-section');
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

  return (
    <div className="app">
      <header className="header">
        <h1>NU LAGUNA Academic Scheduling System</h1>
        <p>Automatic Schedule Generation for BSIT, BSCS, BSIS Programs</p>
        {!dbConnected && programs.length === 0 && (
          <div style={{
            background: '#fff3cd',
            color: '#856404',
            padding: '10px',
            marginTop: '10px',
            borderRadius: '5px',
            fontSize: '0.9rem'
          }}>
            ⚠️ Database not connected. Please set up MySQL in XAMPP and run the database.sql file. See SETUP.md for instructions.
          </div>
        )}
      </header>

      <nav className="tabs">
        <button 
          className={activeTab === 'enrollment' ? 'active' : ''} 
          onClick={() => setActiveTab('enrollment')}
        >
          1. Enrollment
        </button>
        <button 
          className={activeTab === 'courses' ? 'active' : ''} 
          onClick={() => setActiveTab('courses')}
        >
          2. Courses
        </button>
        <button 
          className={activeTab === 'rooms' ? 'active' : ''} 
          onClick={() => setActiveTab('rooms')}
        >
          3. Rooms
        </button>
        <button 
          className={activeTab === 'generate' ? 'active' : ''} 
          onClick={() => setActiveTab('generate')}
        >
          4. Generate
        </button>
        <button 
          className={activeTab === 'view-section' ? 'active' : ''} 
          onClick={() => setActiveTab('view-section')}
        >
          View by Section
        </button>
        <button 
          className={activeTab === 'view-room' ? 'active' : ''} 
          onClick={() => setActiveTab('view-room')}
        >
          View by Room
        </button>
      </nav>

      <main className="content">
        {activeTab === 'enrollment' && (
          <div className="tab-content">
            <h2>Step 1: Input Enrollment Data</h2>
            <p>Enter the number of students enrolled for each program and year level.</p>
            
            {Array.isArray(programs) && programs.length > 0 ? (
              programs.map(program => (
                <div key={program.id} className="program-section">
                  <h3>{program.code} - {program.name}</h3>
                  <div className="enrollment-grid">
                    {[1, 2, 3, 4].map(year => {
                      const enrollment = enrollmentData.find(
                        e => e.program_id === program.id && e.year_level === year
                      );
                      return (
                        <div key={year} className="enrollment-input">
                          <label>Year {year}:</label>
                          <input
                            type="number"
                            min="0"
                            value={enrollment?.total_students || 0}
                            onChange={(e) => handleEnrollmentChange(program.id, year, e.target.value)}
                            placeholder="Number of students"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="info-box warning">
                <p>Database not connected. Please set up MySQL and run the database schema.</p>
                <p>See SETUP.md for complete instructions.</p>
              </div>
            )}

            <button 
              className="btn-primary" 
              onClick={generateSections}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Sections'}
            </button>

            {Array.isArray(sections) && sections.length > 0 && (
              <div className="sections-list">
                <h3>Generated Sections ({sections.length} total)</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Section Code</th>
                        <th>Program</th>
                        <th>Year Level</th>
                        <th>Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map(section => (
                        <tr key={section.id}>
                          <td><strong>{section.program_code}{section.year_level}{section.letter}</strong></td>
                          <td>{section.program_name}</td>
                          <td>{section.year_level}</td>
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

        {activeTab === 'courses' && (
          <div className="tab-content">
            <h2>Step 2: Manage Courses</h2>
            
            <div className="form-card">
              <h3>Add New Course</h3>
              <div className="form-grid">
                <div>
                  <label>Program:</label>
                  <select
                    value={newCourse.program_id}
                    onChange={(e) => setNewCourse({...newCourse, program_id: e.target.value})}
                  >
                    <option value="">Select Program</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Year Level:</label>
                  <select
                    value={newCourse.year_level}
                    onChange={(e) => setNewCourse({...newCourse, year_level: parseInt(e.target.value)})}
                  >
                    {[1, 2, 3, 4].map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Course Code:</label>
                  <input
                    type="text"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                    placeholder="e.g., IT101"
                  />
                </div>
                <div>
                  <label>Course Name:</label>
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                    placeholder="e.g., Introduction to Programming"
                  />
                </div>
                <div>
                  <label>Type:</label>
                  <select
                    value={newCourse.type}
                    onChange={(e) => setNewCourse({...newCourse, type: e.target.value})}
                  >
                    <option value="lecture">Pure Lecture (4 hrs)</option>
                    <option value="leclab">Lecture + Lab (2.67 + 4 hrs)</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary" onClick={addCourse} disabled={loading}>
                {loading ? 'Adding...' : 'Add Course'}
              </button>
            </div>

            <div className="courses-list">
              <h3>All Courses ({courses.length} total)</h3>
              <div className="table-container">
                <table>
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
                        <td>{course.year_level}</td>
                        <td>
                          <span className={`badge ${course.type}`}>
                            {course.type === 'lecture' ? 'Lecture' : 'Lec+Lab'}
                          </span>
                        </td>
                        <td>
                          {course.type === 'lecture' 
                            ? '4 hrs' 
                            : '2.67 hrs (lec) + 4 hrs (lab)'}
                        </td>
                        <td>
                          <button 
                            className="btn-delete" 
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

        {activeTab === 'rooms' && (
          <div className="tab-content">
            <h2>Step 3: Manage Rooms</h2>
            
            <div className="form-card">
              <h3>Add New Room</h3>
              <div className="form-grid">
                <div>
                  <label>Room Name:</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                    placeholder="e.g., CompLab 1, Lecture Hall A"
                  />
                </div>
                <div>
                  <label>Room Type:</label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
                  >
                    <option value="lecture">Lecture Room</option>
                    <option value="laboratory">Laboratory</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary" onClick={addRoom} disabled={loading}>
                {loading ? 'Adding...' : 'Add Room'}
              </button>
            </div>

            <div className="rooms-list">
              <h3>All Rooms ({rooms.length} total)</h3>
              <div className="table-container">
                <table>
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
                          <span className={`badge ${room.type}`}>
                            {room.type === 'lecture' ? 'Lecture' : 'Laboratory'}
                          </span>
                        </td>
                        <td>{formatTime(room.start_time)} - {formatTime(room.end_time)}</td>
                        <td>{room.available_days}</td>
                        <td>
                          <button 
                            className="btn-delete" 
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

        {activeTab === 'generate' && (
          <div className="tab-content">
            <h2>Step 4: Generate Schedule</h2>
            
            <div className="summary-card">
              <h3>Data Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-label">Sections</div>
                  <div className="summary-value">{sections.length}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Courses</div>
                  <div className="summary-value">{courses.length}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Lecture Rooms</div>
                  <div className="summary-value">
                    {rooms.filter(r => r.type === 'lecture').length}
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Lab Rooms</div>
                  <div className="summary-value">
                    {rooms.filter(r => r.type === 'laboratory').length}
                  </div>
                </div>
              </div>
            </div>

            <div className="info-box">
              <h4>Scheduling Algorithm:</h4>
              <ul>
                <li>Prioritizes Lecture+Lab courses (harder to schedule)</li>
                <li>Handles two time slot options for flexibility</li>
                <li>Ensures no room or section conflicts</li>
                <li>Respects room types (lecture vs laboratory)</li>
                <li>Operates within 7:00 AM - 9:00 PM, Monday-Saturday</li>
              </ul>
            </div>

            <button 
              className="btn-primary btn-large" 
              onClick={generateSchedule}
              disabled={loading || sections.length === 0 || courses.length === 0 || rooms.length === 0}
            >
              {loading ? 'Generating Schedule...' : 'Generate Complete Schedule'}
            </button>

            {conflicts.length > 0 && (
              <div className="conflicts-section">
                <h3>Scheduling Conflicts ({conflicts.length})</h3>
                <div className="table-container">
                  <table>
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
                          <td className="conflict-reason">{conflict.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="info-box warning">
                  <strong>Resolution Suggestions:</strong>
                  <ul>
                    <li>Add more rooms (especially laboratories if lab courses failed)</li>
                    <li>Extend operating hours for some rooms</li>
                    <li>Reduce number of sections or courses</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'view-section' && (
          <div className="tab-content">
            <h2>Schedule by Section</h2>
            
            <div className="actions-bar">
              <button className="btn-export" onClick={exportToExcel}>
                Export to Excel
              </button>
            </div>

            {Object.entries(groupSchedulesBySection()).map(([sectionCode, sectionSchedules]) => (
              <div key={sectionCode} className="schedule-section">
                <h3>{sectionCode}</h3>
                <div className="table-container">
                  <table>
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
                            <span className={`badge ${schedule.schedule_type}`}>
                              {schedule.schedule_type}
                            </span>
                          </td>
                          <td>{schedule.day_pattern}</td>
                          <td>
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </td>
                          <td>{schedule.room_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'view-room' && (
          <div className="tab-content">
            <h2>Schedule by Room (Room Utilization)</h2>
            
            <div className="actions-bar">
              <button className="btn-export" onClick={exportToExcel}>
                Export to Excel
              </button>
            </div>

            {Object.entries(groupSchedulesByRoom()).map(([roomName, roomSchedules]) => (
              <div key={roomName} className="schedule-section">
                <h3>{roomName}</h3>
                <div className="table-container">
                  <table>
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
                            <span className={`badge ${schedule.schedule_type}`}>
                              {schedule.schedule_type}
                            </span>
                          </td>
                          <td>{schedule.day_pattern}</td>
                          <td>
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
