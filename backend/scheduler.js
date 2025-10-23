class ScheduleGenerator {
    constructor() {
        this.dayPatterns = {
            twoDay: [
                ['Mon', 'Wed'],
                ['Tue', 'Thu'],
                ['Mon', 'Thu'],
                ['Tue', 'Fri'],
                ['Wed', 'Sat']
            ]
        };
    }
    
    // CONFIG: Smart session allocation based on year level
    // Year 1-2: 2 sessions per course (full coverage for foundational courses)
    // Year 3-4: 1 session per course (to free up capacity)
    getSessionsForYearLevel(yearLevel) {
        if (yearLevel <= 2) {
            return 2;  // Year 1-2: Full 2 sessions
        } else {
            return 1;  // Year 3-4: Single session to save capacity
        }
    }

    generateSchedules(sections, courses, rooms) {
        const schedules = [];
        const conflicts = [];
        
        // Group courses by program and term
        const coursesByProgramTerm = this.groupCoursesByProgramAndTerm(courses, sections);
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`SCHEDULE GENERATION - PER PROGRAM, PER TERM WITH ROOM RESETS`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Total Courses: ${courses.length}`);
        console.log(`Total Sections: ${sections.length}`);
        console.log(`Total Rooms Available: ${rooms.length}`);
        console.log(`Lecture Rooms: ${rooms.filter(r => r.type === 'lecture').length}`);
        console.log(`Lab Rooms: ${rooms.filter(r => r.type === 'laboratory').length}`);
        console.log(`${'='.repeat(80)}\n`);
        
        const programOrder = ['BSCS', 'BSIS', 'BSIT'];
        const termOrder = ['TERM 1', 'TERM 2', 'TERM 3'];
        
        let totalScheduled = 0;
        let totalConflicts = 0;
        
        // For each program
        for (const program of programOrder) {
            if (!coursesByProgramTerm[program] || Object.keys(coursesByProgramTerm[program]).length === 0) {
                continue;
            }
            
            console.log(`\n${'█'.repeat(80)}`);
            console.log(`PROGRAM: ${program}`);
            console.log(`${'█'.repeat(80)}`);
            
            // For each term within the program
            for (const term of termOrder) {
                const termCourses = coursesByProgramTerm[program][term] || [];
                
                if (termCourses.length === 0) {
                    continue;
                }
                
                // RESET ROOMS FOR THIS TERM - Fresh occupancy tracking
                const roomOccupancy = this.initializeOccupancy(rooms);
                const programSections = sections.filter(s => {
                    const sectionProgram = courses.find(c => c.program_id === s.program_id)?.program_code;
                    return sectionProgram === program;
                });
                const sectionOccupancy = this.initializeSectionOccupancyForProgram(programSections);
                
                console.log(`\n${'─'.repeat(80)}`);
                console.log(`${program} - ${term}`);
                console.log(`${'─'.repeat(80)}`);
                
                // Analyze room capacity for this program-term
                const lectureRooms = rooms.filter(r => r.type === 'lecture');
                const labRooms = rooms.filter(r => r.type === 'laboratory');
                
                // Count sessions needed
                let lectureSessionsNeeded = 0;
                let labSessionsNeeded = 0;
                
                termCourses.forEach(course => {
                    if (course.type === 'lecture' || course.type === 'leclab') {
                        lectureSessionsNeeded += this.getSessionsForYearLevel(course.year_level);
                    }
                    if (course.type === 'laboratory' || course.type === 'leclab') {
                        labSessionsNeeded += this.getSessionsForYearLevel(course.year_level);
                    }
                });
                
                const lectureCapacity = lectureRooms.length * 50;
                const labCapacity = labRooms.length * 50;
                
                console.log(`Courses to schedule: ${termCourses.length}`);
                console.log(`Lecture sessions needed: ${lectureSessionsNeeded} (capacity: ${lectureCapacity})`);
                console.log(`Lab sessions needed: ${labSessionsNeeded} (capacity: ${labCapacity})`);
                
                if (lectureSessionsNeeded > lectureCapacity) {
                    console.log(`⚠️ WARNING: Not enough lecture room capacity!`);
                }
                if (labSessionsNeeded > labCapacity) {
                    console.log(`⚠️ WARNING: Not enough lab room capacity!`);
                }
                
                const sortedCourses = this.sortCoursesByPriority(termCourses, programSections);
                
                // Log sorted order (first 10)
                console.log(`\nCourses sorted order:`);
                sortedCourses.slice(0, 10).forEach((course, index) => {
                    console.log(`${index + 1}. [${course.program_code}] Y${course.year_level} - ${course.code} (${course.name}) [${course.type}]`);
                });
                if (sortedCourses.length > 10) {
                    console.log(`... and ${sortedCourses.length - 10} more courses`);
                }
                
                console.log(`\nScheduling ${sortedCourses.length} courses...`);
                
                let successCount = 0;
                let conflictCount = 0;
                const termConflicts = [];
                
                // Schedule courses for this program-term
                for (const course of sortedCourses) {
                    const courseSections = programSections.filter(s => 
                        s.year_level === course.year_level
                    );
                    
                    // Schedule each section separately
                    // They will all take the same COURSE (because we iterate through same courses)
                    // But each section gets a DIFFERENT TIME SLOT (scheduled independently)
                    for (const section of courseSections) {
                        const result = this.scheduleCourseForSection(
                            course, 
                            section,
                            rooms, 
                            roomOccupancy,
                            sectionOccupancy
                        );
                        
                        if (result.success) {
                            schedules.push(...result.schedules);
                            successCount++;
                        } else {
                            const conflictInfo = {
                                course: course.code,
                                section: `${course.program_code}${section.year_level}${section.letter}`,
                                reason: result.reason,
                                program: program,
                                term: term,
                                courseType: course.type,
                                courseName: course.name
                            };
                            conflicts.push(conflictInfo);
                            termConflicts.push(conflictInfo);
                            conflictCount++;
                        }
                    }
                }
                
                totalScheduled += successCount;
                totalConflicts += conflictCount;
                
                console.log(`✅ Scheduled: ${successCount}`);
                console.log(`❌ Conflicts: ${conflictCount}`);
                console.log(`🔄 ROOMS RESET - Clearing occupancy for next term`);
                
                // Show conflict details
                if (termConflicts.length > 0 && termConflicts.length <= 5) {
                    console.log(`\nConflicts for ${program} ${term}:`);
                    termConflicts.forEach((c, i) => {
                        console.log(`  ${i + 1}. ${c.course} [${c.section}] - ${c.reason}`);
                    });
                } else if (termConflicts.length > 5) {
                    console.log(`\nTop 5 conflicts for ${program} ${term}:`);
                    termConflicts.slice(0, 5).forEach((c, i) => {
                        console.log(`  ${i + 1}. ${c.course} [${c.section}] - ${c.reason}`);
                    });
                    console.log(`  ... and ${termConflicts.length - 5} more`);
                }
            }
        }
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`FINAL SUMMARY`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Total Schedules Created: ${schedules.length}`);
        console.log(`Total Conflicts: ${conflicts.length}`);
        const successRate = schedules.length + conflicts.length > 0 
            ? Math.round(schedules.length / (schedules.length + conflicts.length) * 100)
            : 0;
        console.log(`Success Rate: ${successRate}%`);
        console.log(`${'='.repeat(80)}\n`);
        
        return { schedules, conflicts };
    }

    groupCoursesByProgramAndTerm(courses, sections) {
        const grouped = {
            'BSCS': { 'TERM 1': [], 'TERM 2': [], 'TERM 3': [] },
            'BSIS': { 'TERM 1': [], 'TERM 2': [], 'TERM 3': [] },
            'BSIT': { 'TERM 1': [], 'TERM 2': [], 'TERM 3': [] }
        };
        
        for (const course of courses) {
            const program = course.program_code;
            const term = course.term || 'TERM 1';
            
            if (grouped[program] && grouped[program][term] !== undefined) {
                grouped[program][term].push(course);
            }
        }
        
        return grouped;
    }

    sortCoursesByPriority(courses, sections) {
        return courses.sort((a, b) => {
            // 1. Sort by Program (already grouped, so constant)
            const programOrder = { 'BSCS': 0, 'BSIS': 1, 'BSIT': 2 };
            const aProgramOrder = programOrder[a.program_code] ?? 999;
            const bProgramOrder = programOrder[b.program_code] ?? 999;
            
            if (aProgramOrder !== bProgramOrder) {
                return aProgramOrder - bProgramOrder;
            }
            
            // 2. Sort by Term (already grouped, so constant)
            const termOrder = { 'TERM 1': 0, 'TERM 2': 1, 'TERM 3': 2 };
            const aTermOrder = termOrder[a.term] ?? 0;
            const bTermOrder = termOrder[b.term] ?? 0;
            
            if (aTermOrder !== bTermOrder) {
                return aTermOrder - bTermOrder;
            }
            
            // 3. Sort by Year Level (1, 2, 3, 4)
            if (a.year_level !== b.year_level) {
                return a.year_level - b.year_level;
            }
            
            // 4. Sort by Course Type (leclab first, then lecture, then laboratory)
            const typeOrder = { 'leclab': 0, 'lecture': 1, 'laboratory': 2 };
            const aTypeOrder = typeOrder[a.type] ?? 999;
            const bTypeOrder = typeOrder[b.type] ?? 999;
            
            if (aTypeOrder !== bTypeOrder) {
                return aTypeOrder - bTypeOrder;
            }
            
            // 5. Sort by Course Name (Alphabetically)
            if (a.name !== b.name) {
                return a.name.localeCompare(b.name);
            }
            
            // 6. Final fallback: sort by course ID
            return a.id - b.id;
        });
    }

    scheduleCourseForSection(course, section, rooms, roomOccupancy, sectionOccupancy) {
        const schedules = [];
        const programCode = course.program_code;
        const isIT = programCode === 'BSIT';
        
        if (course.type === 'lecture') {
            const hours = course.hours_lecture || 2;
            const result = this.scheduleLecture(course, section, rooms, roomOccupancy, sectionOccupancy, hours, programCode);
            if (!result.success) return result;
            schedules.push(...result.schedules);
        } else if (course.type === 'laboratory') {
            const hours = course.hours_lab || 2;
            const result = this.scheduleLaboratory(course, section, rooms, roomOccupancy, sectionOccupancy, hours, programCode);
            if (!result.success) return result;
            schedules.push(...result.schedules);
        } else if (course.type === 'leclab') {
            const lectureHours = isIT ? 2 : (course.hours_lecture || 2.67);
            const labHours = isIT ? 2 : (course.hours_lab || 4);
            
            const result = this.scheduleLecLab(course, section, rooms, roomOccupancy, sectionOccupancy, lectureHours, labHours, programCode);
            
            if (!result.success) return result;
            schedules.push(...result.schedules);
        }
        
        return { success: true, schedules };
    }

    scheduleLecture(course, section, rooms, roomOccupancy, sectionOccupancy, hours, programCode) {
        const lectureRooms = rooms.filter(r => r.type === 'lecture');
        
        for (const room of lectureRooms) {
            const slots = this.findFlexibleSlots(room, section, hours, this.getSessionsForYearLevel(course.year_level), roomOccupancy, sectionOccupancy);
            
            if (slots && slots.length >= this.getSessionsForYearLevel(course.year_level)) {
                const schedules = slots.slice(0, this.getSessionsForYearLevel(course.year_level)).map((slot) => ({
                    section_id: section.id,
                    course_id: course.id,
                    room_id: room.id,
                    day_pattern: slot.day,
                    start_time: slot.startTime,
                    end_time: slot.endTime,
                    schedule_type: 'lecture'
                }));
                
                schedules.forEach(schedule => {
                    this.markTimeSlot(schedule, roomOccupancy, sectionOccupancy);
                });
                
                return { success: true, schedules };
            }
        }
        
        return { success: false, reason: 'No available lecture room slots' };
    }

    scheduleLaboratory(course, section, rooms, roomOccupancy, sectionOccupancy, hours, programCode) {
        const labRooms = rooms.filter(r => r.type === 'laboratory');
        
        for (const room of labRooms) {
            const slots = this.findFlexibleSlots(room, section, hours, this.getSessionsForYearLevel(course.year_level), roomOccupancy, sectionOccupancy);
            
            if (slots && slots.length >= this.getSessionsForYearLevel(course.year_level)) {
                const schedules = slots.slice(0, this.getSessionsForYearLevel(course.year_level)).map((slot) => ({
                    section_id: section.id,
                    course_id: course.id,
                    room_id: room.id,
                    day_pattern: slot.day,
                    start_time: slot.startTime,
                    end_time: slot.endTime,
                    schedule_type: 'laboratory'
                }));
                
                schedules.forEach(schedule => {
                    this.markTimeSlot(schedule, roomOccupancy, sectionOccupancy);
                });
                
                return { success: true, schedules };
            }
        }
        
        return { success: false, reason: 'No available lab room slots' };
    }

    scheduleLecLab(course, section, rooms, roomOccupancy, sectionOccupancy, lectureHours, labHours, programCode) {
        const lectureRooms = rooms.filter(r => r.type === 'lecture');
        const labRooms = rooms.filter(r => r.type === 'laboratory');
        
        // Find lecture slots - try all lecture rooms
        let lectureSlots = null;
        for (const lectureRoom of lectureRooms) {
            lectureSlots = this.findFlexibleSlots(lectureRoom, section, lectureHours, this.getSessionsForYearLevel(course.year_level), roomOccupancy, sectionOccupancy);
            if (lectureSlots && lectureSlots.length >= this.getSessionsForYearLevel(course.year_level)) {
                break;  // Found lecture slots, move on to labs
            }
        }
        
        if (!lectureSlots || lectureSlots.length < this.getSessionsForYearLevel(course.year_level)) {
            return { success: false, reason: 'No available lecture room slots for leclab' };
        }
        
        // Create temporary copies of occupancy to test lab scheduling
        // This way we can schedule labs without affecting the main occupancy tracking
        const tempRoomOccupancy = JSON.parse(JSON.stringify(roomOccupancy));
        const tempSectionOccupancy = JSON.parse(JSON.stringify(sectionOccupancy));
        
        // Mark lecture slots in temporary occupancy
        lectureSlots.slice(0, this.getSessionsForYearLevel(course.year_level)).forEach(slot => {
            const tempSchedule = {
                room_id: lectureRooms[0].id,  // Assuming we got slots from first room
                day_pattern: slot.day,
                start_time: slot.startTime,
                end_time: slot.endTime,
                section_id: section.id
            };
            const roomKey = `${tempSchedule.room_id}-${tempSchedule.day_pattern}`;
            const sectionKey = `${section.id}-${tempSchedule.day_pattern}`;
            if (!tempRoomOccupancy[roomKey]) tempRoomOccupancy[roomKey] = [];
            if (!tempSectionOccupancy[sectionKey]) tempSectionOccupancy[sectionKey] = [];
            tempRoomOccupancy[roomKey].push({
                start: tempSchedule.start_time,
                end: tempSchedule.end_time
            });
            tempSectionOccupancy[sectionKey].push({
                start: tempSchedule.start_time,
                end: tempSchedule.end_time
            });
        });
        
        // Find lab slots independently - they don't need to be at same times as lectures
        let labSlots = null;
        for (const labRoom of labRooms) {
            labSlots = this.findFlexibleSlots(labRoom, section, labHours, this.getSessionsForYearLevel(course.year_level), tempRoomOccupancy, tempSectionOccupancy);
            if (labSlots && labSlots.length >= this.getSessionsForYearLevel(course.year_level)) {
                break;  // Found lab slots
            }
        }
        
        if (!labSlots || labSlots.length < this.getSessionsForYearLevel(course.year_level)) {
            return { success: false, reason: 'No available lab room slots for leclab' };
        }
        
        // If both lecture and lab slots found, mark them in real occupancy and create schedules
        const schedules = [];
        let lectureRoomUsed = null;
        let labRoomUsed = null;
        
        // Find which room was used for lectures
        for (const lectureRoom of lectureRooms) {
            const testSlots = this.findFlexibleSlots(lectureRoom, section, lectureHours, this.getSessionsForYearLevel(course.year_level), roomOccupancy, sectionOccupancy);
            if (testSlots && testSlots.length >= this.getSessionsForYearLevel(course.year_level) && 
                testSlots[0].day === lectureSlots[0].day && 
                testSlots[0].startTime === lectureSlots[0].startTime) {
                lectureRoomUsed = lectureRoom;
                break;
            }
        }
        
        // Find which room was used for labs
        for (const labRoom of labRooms) {
            const testSlots = this.findFlexibleSlots(labRoom, section, labHours, this.getSessionsForYearLevel(course.year_level), tempRoomOccupancy, tempSectionOccupancy);
            if (testSlots && testSlots.length >= this.getSessionsForYearLevel(course.year_level) &&
                testSlots[0].day === labSlots[0].day &&
                testSlots[0].startTime === labSlots[0].startTime) {
                labRoomUsed = labRoom;
                break;
            }
        }
        
        if (!lectureRoomUsed) lectureRoomUsed = lectureRooms[0];
        if (!labRoomUsed) labRoomUsed = labRooms[0];
        
        // Create lecture schedules
        lectureSlots.slice(0, this.getSessionsForYearLevel(course.year_level)).forEach(slot => {
            schedules.push({
                section_id: section.id,
                course_id: course.id,
                room_id: lectureRoomUsed.id,
                day_pattern: slot.day,
                start_time: slot.startTime,
                end_time: slot.endTime,
                schedule_type: 'lecture'
            });
        });
        
        // Create lab schedules
        labSlots.slice(0, this.getSessionsForYearLevel(course.year_level)).forEach(slot => {
            schedules.push({
                section_id: section.id,
                course_id: course.id,
                room_id: labRoomUsed.id,
                day_pattern: slot.day,
                start_time: slot.startTime,
                end_time: slot.endTime,
                schedule_type: 'lab'
            });
        });
        
        // Mark all schedules in real occupancy
        schedules.forEach(schedule => {
            this.markTimeSlot(schedule, roomOccupancy, sectionOccupancy);
        });
        
        return { success: true, schedules };
    }

    findFlexibleSlots(room, section, hoursPerSession, numSlotsNeeded, roomOccupancy, sectionOccupancy) {
        const availableSlots = [];
        const usedDays = new Set();  // Track which days we've used
        const minutes = Math.round(hoursPerSession * 60);
        
        const startTime = room.start_time || '08:00:00';
        const endTime = room.end_time || '18:00:00';
        
        const roomStartHour = this.parseTimeToHours(startTime);
        const roomEndHour = this.parseTimeToHours(endTime);
        const startHour = Math.floor(roomStartHour);
        const endHour = Math.floor(roomEndHour);
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // IMPORTANT: Find slots on DIFFERENT DAYS to spread course sessions across the week
        // This prevents students from having multiple sessions of same course on same day
        for (const day of days) {
            // Skip this day if we already found a slot on it
            if (usedDays.has(day) && availableSlots.length > 0) {
                continue;  // Move to next day to ensure different days
            }
            
            for (let hour = startHour; hour < endHour; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const slotStartTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
                    const endHourCalc = hour + Math.floor((minute + minutes) / 60);
                    const endMinuteCalc = (minute + minutes) % 60;
                    
                    if (endHourCalc > endHour) continue;
                    if (endHourCalc === endHour && endMinuteCalc > 0) continue;
                    
                    const slotEndTime = `${String(endHourCalc).padStart(2, '0')}:${String(endMinuteCalc).padStart(2, '0')}:00`;
                    
                    // Check if this slot is available in existing occupancy
                    if (this.isSlotAvailable(room.id, section.id, [day], slotStartTime, slotEndTime, roomOccupancy, sectionOccupancy)) {
                        // Found an available slot on this day
                        availableSlots.push({
                            day,
                            startTime: slotStartTime,
                            endTime: slotEndTime
                        });
                        
                        usedDays.add(day);  // Mark this day as used
                        
                        // Stop searching this day, move to next day
                        break;
                    }
                }
                
                // If we found a slot on this day, stop searching hours and move to next day
                if (usedDays.has(day)) {
                    break;
                }
            }
            
            // Check if we have enough slots on different days
            if (availableSlots.length >= numSlotsNeeded) {
                return availableSlots;
            }
        }
        
        return availableSlots.length > 0 ? availableSlots : null;
    }

    findTwoDaySlots(room, section, dayPattern, hoursPerDay, roomOccupancy, sectionOccupancy, preferAfter = null) {
        const availableDays = room.available_days.split(',');
        
        if (!dayPattern.every(d => availableDays.includes(d))) {
            return null;
        }
        
        const roomStartHour = this.parseTimeToHours(room.start_time);
        const roomEndHour = this.parseTimeToHours(room.end_time);
        const slots = [];
        
        for (let dayIndex = 0; dayIndex < dayPattern.length; dayIndex++) {
            const day = dayPattern[dayIndex];
            const preferAfterTime = preferAfter && preferAfter[dayIndex] ? preferAfter[dayIndex].end_time : null;
            
            const slot = this.findSlotForDay(
                room, 
                section, 
                day, 
                hoursPerDay, 
                roomOccupancy, 
                sectionOccupancy, 
                roomStartHour, 
                roomEndHour,
                preferAfterTime
            );
            
            if (!slot) {
                return null;
            }
            
            slots.push(slot);
        }
        
        return slots;
    }

    findSlotForDay(room, section, day, hours, roomOccupancy, sectionOccupancy, roomStartHour, roomEndHour, preferAfter = null) {
        const minutes = Math.round(hours * 60);
        const startHour = Math.floor(roomStartHour);
        const startMinute = Math.round((roomStartHour - startHour) * 60);
        const endHour = Math.floor(roomEndHour);
        
        const timesToTry = [];
        
        for (let hour = startHour; hour < endHour; hour++) {
            const minuteStart = (hour === startHour) ? startMinute : 0;
            
            for (let minute = minuteStart; minute < 60; minute += 20) {
                const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
                const endHourCalc = hour + Math.floor((minute + minutes) / 60);
                const endMinuteCalc = (minute + minutes) % 60;
                
                if (endHourCalc > roomEndHour) continue;
                if (endHourCalc === Math.floor(roomEndHour) && endMinuteCalc > (roomEndHour - Math.floor(roomEndHour)) * 60) continue;
                
                const endTime = `${String(endHourCalc).padStart(2, '0')}:${String(endMinuteCalc).padStart(2, '0')}:00`;
                
                if (preferAfter && startTime <= preferAfter) {
                    timesToTry.push({ startTime, endTime, priority: 1 });
                } else {
                    timesToTry.unshift({ startTime, endTime, priority: 0 });
                }
            }
        }
        
        timesToTry.sort((a, b) => a.priority - b.priority);
        
        for (const { startTime, endTime } of timesToTry) {
            if (this.isSlotAvailable(room.id, section.id, [day], startTime, endTime, roomOccupancy, sectionOccupancy)) {
                return { startTime, endTime };
            }
        }
        
        return null;
    }

    parseTimeToHours(timeString) {
        if (!timeString) {
            return 8;
        }
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            return hours + (minutes || 0) / 60;
        } catch (error) {
            console.error(`Error parsing time: ${timeString}`, error);
            return 8;
        }
    }

    isSlotAvailable(roomId, sectionId, days, startTime, endTime, roomOccupancy, sectionOccupancy) {
        for (const day of days) {
            const roomKey = `${roomId}-${day}`;
            // Check room occupancy - if ANY slot overlaps, this slot is NOT available
            if (roomOccupancy[roomKey]) {
                for (const slot of roomOccupancy[roomKey]) {
                    if (this.timesOverlap(startTime, endTime, slot.start, slot.end)) {
                        return false;  // Room is occupied during this time
                    }
                }
            }
            
            // Also check section occupancy (section can't have conflicting classes)
            const sectionKey = `${sectionId}-${day}`;
            if (sectionOccupancy[sectionKey]) {
                for (const slot of sectionOccupancy[sectionKey]) {
                    if (this.timesOverlap(startTime, endTime, slot.start, slot.end)) {
                        return false;  // Section already has class at this time
                    }
                }
            }
        }
        
        return true;
    }

    timesOverlap(start1, end1, start2, end2) {
        // Convert time strings (HH:MM:SS) to minutes for accurate comparison
        const start1Min = this.timeToMinutes(start1);
        const end1Min = this.timeToMinutes(end1);
        const start2Min = this.timeToMinutes(start2);
        const end2Min = this.timeToMinutes(end2);
        
        return start1Min < end2Min && start2Min < end1Min;
    }

    timeToMinutes(timeString) {
        // Convert HH:MM:SS or HH:MM format to minutes since midnight
        if (!timeString) return 0;
        const parts = timeString.split(':');
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        return hours * 60 + minutes;
    }

    markTimeSlot(schedule, roomOccupancy, sectionOccupancy) {
        const days = [schedule.day_pattern];
        
        for (const day of days) {
            const roomKey = `${schedule.room_id}-${day}`;
            if (!roomOccupancy[roomKey]) {
                roomOccupancy[roomKey] = [];
            }
            roomOccupancy[roomKey].push({
                start: schedule.start_time,
                end: schedule.end_time
            });
            
            const sectionKey = `${schedule.section_id}-${day}`;
            if (!sectionOccupancy[sectionKey]) {
                sectionOccupancy[sectionKey] = [];
            }
            sectionOccupancy[sectionKey].push({
                start: schedule.start_time,
                end: schedule.end_time
            });
        }
    }

    releaseTimeSlot(schedule, roomOccupancy, sectionOccupancy) {
        const days = [schedule.day_pattern];
        
        for (const day of days) {
            const roomKey = `${schedule.room_id}-${day}`;
            if (roomOccupancy[roomKey]) {
                roomOccupancy[roomKey] = roomOccupancy[roomKey].filter(slot =>
                    !(slot.start === schedule.start_time && slot.end === schedule.end_time)
                );
            }
            
            const sectionKey = `${schedule.section_id}-${day}`;
            if (sectionOccupancy[sectionKey]) {
                sectionOccupancy[sectionKey] = sectionOccupancy[sectionKey].filter(slot =>
                    !(slot.start === schedule.start_time && slot.end === schedule.end_time)
                );
            }
        }
    }

    initializeOccupancy(rooms) {
        const occupancy = {};
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (const room of rooms) {
            for (const day of days) {
                occupancy[`${room.id}-${day}`] = [];
            }
        }
        
        return occupancy;
    }

    initializeSectionOccupancyForProgram(sections) {
        const occupancy = {};
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (const section of sections) {
            for (const day of days) {
                occupancy[`${section.id}-${day}`] = [];
            }
        }
        
        return occupancy;
    }

    initializeSectionOccupancy(sections) {
        const occupancy = {};
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (const section of sections) {
            for (const day of days) {
                occupancy[`${section.id}-${day}`] = [];
            }
        }
        
        return occupancy;
    }

    groupCoursesByTerm(courses) {
        const grouped = {
            'TERM 1': [],
            'TERM 2': [],
            'TERM 3': []
        };
        
        for (const course of courses) {
            const term = course.term || 'TERM 1';
            if (grouped[term]) {
                grouped[term].push(course);
            } else {
                grouped[term].push(course);
            }
        }
        
        return grouped;
    }
}

module.exports = ScheduleGenerator;
