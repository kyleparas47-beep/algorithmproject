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

    generateSchedules(sections, courses, rooms) {
        const schedules = [];
        const conflicts = [];
        const roomOccupancy = this.initializeOccupancy(rooms);
        const sectionOccupancy = this.initializeSectionOccupancy(sections);

        const sortedCourses = this.sortCoursesByPriority(courses, sections);

        for (const course of sortedCourses) {
            const courseSections = sections.filter(s => 
                s.program_id === course.program_id && 
                s.year_level === course.year_level
            );

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
                } else {
                    conflicts.push({
                        course: course.code,
                        section: `${course.program_code}${section.year_level}${section.letter}`,
                        reason: result.reason
                    });
                }
            }
        }

        return { schedules, conflicts };
    }

    sortCoursesByPriority(courses, sections) {
        return courses.sort((a, b) => {
            if (a.type === 'leclab' && b.type !== 'leclab') return -1;
            if (a.type !== 'leclab' && b.type === 'leclab') return 1;

            const aSections = sections.filter(s => 
                s.program_id === a.program_id && s.year_level === a.year_level
            ).length;
            const bSections = sections.filter(s => 
                s.program_id === b.program_id && s.year_level === b.year_level
            ).length;

            return bSections - aSections;
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
            // For IT laboratory courses (2 hours lab only)
            const hours = course.hours_lab || 2;
            const result = this.scheduleLaboratory(course, section, rooms, roomOccupancy, sectionOccupancy, hours, programCode);
            if (!result.success) return result;
            schedules.push(...result.schedules);
        } else if (course.type === 'leclab') {
            // For IT: 2 hours lecture, 2 hours lab - split into 2 days
            // For IS/CS: 2.67 hours lecture, 4 hours lab
            const lectureHours = isIT ? 2 : (course.hours_lecture || 2.67);
            const labHours = isIT ? 2 : (course.hours_lab || 4);

            // Try to schedule lecture and lab on the same days
            const result = this.scheduleLecLab(course, section, rooms, roomOccupancy, sectionOccupancy, lectureHours, labHours, programCode);
            
            if (!result.success) return result;
            schedules.push(...result.schedules);
        }

        return { success: true, schedules };
    }

    scheduleLecLab(course, section, rooms, roomOccupancy, sectionOccupancy, lectureHours, labHours, programCode) {
        const isIT = programCode === 'BSIT';
        const lectureRooms = rooms.filter(r => r.type === 'lecture');
        const labRooms = rooms.filter(r => r.type === 'laboratory');

        // For IT: 2 hours per session, 2 days
        // For IS/CS: lecture split, lab split into 2-hour sessions
        
        for (const dayPattern of this.dayPatterns.twoDay) {
            // Try to find lecture rooms for both days
            const lectureSchedules = [];
            const labSchedules = [];
            const hoursPerLectureSession = isIT ? 2 : (lectureHours / 2); // IT: 2 hours, IS/CS: 1.34 hours
            const hoursPerLabSession = 2; // Always 2 hours per lab session

            let lectureRoomFound = null;
            let labRoomFound = null;

            // Find lecture room slots
            for (const lectureRoom of lectureRooms) {
                const lectureSlots = this.findTwoDaySlots(
                    lectureRoom, 
                    section, 
                    dayPattern, 
                    hoursPerLectureSession, 
                    roomOccupancy, 
                    sectionOccupancy
                );
                
                if (lectureSlots) {
                    lectureRoomFound = lectureRoom;
                    
                    // Create lecture schedules for both days
                    lectureSlots.forEach((slot, index) => {
                        lectureSchedules.push({
                            section_id: section.id,
                            course_id: course.id,
                            room_id: lectureRoom.id,
                            day_pattern: dayPattern[index],
                            start_time: slot.startTime,
                            end_time: slot.endTime,
                            schedule_type: 'lecture'
                        });
                    });
                    break;
                }
            }

            if (!lectureRoomFound) continue;

            // Find lab room slots on the same days, preferably after lecture
            for (const labRoom of labRooms) {
                const labSlots = this.findTwoDaySlots(
                    labRoom, 
                    section, 
                    dayPattern, 
                    hoursPerLabSession, 
                    roomOccupancy, 
                    sectionOccupancy,
                    lectureSchedules // Pass lecture schedules to prefer scheduling after them
                );
                
                if (labSlots) {
                    labRoomFound = labRoom;
                    
                    // Create lab schedules for both days
                    labSlots.forEach((slot, index) => {
                        labSchedules.push({
                            section_id: section.id,
                            course_id: course.id,
                            room_id: labRoom.id,
                            day_pattern: dayPattern[index],
                            start_time: slot.startTime,
                            end_time: slot.endTime,
                            schedule_type: 'lab'
                        });
                    });
                    break;
                }
            }

            if (lectureRoomFound && labRoomFound) {
                // Mark all time slots
                [...lectureSchedules, ...labSchedules].forEach(schedule => {
                    this.markTimeSlot(schedule, roomOccupancy, sectionOccupancy);
                });
                
                return { success: true, schedules: [...lectureSchedules, ...labSchedules] };
            } else if (lectureRoomFound) {
                // Release lecture slots if lab couldn't be scheduled
                lectureSchedules.forEach(schedule => {
                    this.releaseTimeSlot(schedule, roomOccupancy, sectionOccupancy);
                });
            }
        }

        return { 
            success: false, 
            reason: 'No available slots for lecture and lab on same days' 
        };
    }

    findTwoDaySlots(room, section, dayPattern, hoursPerDay, roomOccupancy, sectionOccupancy, preferAfter = null) {
        const availableDays = room.available_days.split(',');
        
        // Check if both days are available
        if (!dayPattern.every(d => availableDays.includes(d))) {
            return null;
        }

        const roomStartHour = this.parseTimeToHours(room.start_time);
        const roomEndHour = this.parseTimeToHours(room.end_time);
        const slots = [];

        // Try to find slots for both days
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
                return null; // If we can't find a slot for any day, fail
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

        // If preferAfter is set, try slots after that time first
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
                    // Add to end of list if before preferred time
                    timesToTry.push({ startTime, endTime, priority: 1 });
                } else {
                    // Add to beginning if after preferred time
                    timesToTry.unshift({ startTime, endTime, priority: 0 });
                }
            }
        }

        // Sort by priority (after preferred time first)
        timesToTry.sort((a, b) => a.priority - b.priority);

        // Try each time slot
        for (const { startTime, endTime } of timesToTry) {
            if (this.isSlotAvailable(room.id, section.id, [day], startTime, endTime, roomOccupancy, sectionOccupancy)) {
                return { startTime, endTime };
            }
        }

        return null;
    }

    scheduleLecture(course, section, rooms, roomOccupancy, sectionOccupancy, hours, programCode) {
        const lectureRooms = rooms.filter(r => r.type === 'lecture');
        const isIT = programCode === 'BSIT';
        
        // For standalone lectures, if IT and 2 hours, split into 2 days
        if (isIT && hours === 2) {
            for (const dayPattern of this.dayPatterns.twoDay) {
                for (const lectureRoom of lectureRooms) {
                    const slots = this.findTwoDaySlots(
                        lectureRoom,
                        section,
                        dayPattern,
                        1, // 1 hour per session
                        roomOccupancy,
                        sectionOccupancy
                    );

                    if (slots) {
                        const schedules = slots.map((slot, index) => ({
                            section_id: section.id,
                            course_id: course.id,
                            room_id: lectureRoom.id,
                            day_pattern: dayPattern[index],
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
            }
        } else {
            // Non-IT or different hours - use single day
            for (const room of lectureRooms) {
                const slot = this.findAvailableSlot(room, section, hours, roomOccupancy, sectionOccupancy);
                if (slot) {
                    const schedule = {
                        section_id: section.id,
                        course_id: course.id,
                        room_id: room.id,
                        day_pattern: slot.dayPattern,
                        start_time: slot.startTime,
                        end_time: slot.endTime,
                        schedule_type: 'lecture'
                    };
                    this.markTimeSlot(schedule, roomOccupancy, sectionOccupancy);
                    return { success: true, schedules: [schedule] };
                }
            }
        }

        return { 
            success: false, 
            reason: 'No available lecture room slot found' 
        };
    }

    scheduleLaboratory(course, section, rooms, roomOccupancy, sectionOccupancy, hours, programCode) {
        const labRooms = rooms.filter(r => r.type === 'laboratory');
        const isIT = programCode === 'BSIT';
        
        // For IT laboratory courses, if 2 hours, split into 2 days
        if (isIT && hours === 2) {
            for (const dayPattern of this.dayPatterns.twoDay) {
                for (const labRoom of labRooms) {
                    const slots = this.findTwoDaySlots(
                        labRoom,
                        section,
                        dayPattern,
                        1, // 1 hour per session
                        roomOccupancy,
                        sectionOccupancy
                    );

                    if (slots) {
                        const schedules = slots.map((slot, index) => ({
                            section_id: section.id,
                            course_id: course.id,
                            room_id: labRoom.id,
                            day_pattern: dayPattern[index],
                            start_time: slot.startTime,
                            end_time: slot.endTime,
                            schedule_type: 'lab'
                        }));

                        schedules.forEach(schedule => {
                            this.markTimeSlot(schedule, roomOccupancy, sectionOccupancy);
                        });

                        return { success: true, schedules };
                    }
                }
            }
        } else {
            // Non-IT or different hours - use single day
            for (const room of labRooms) {
                const slot = this.findAvailableSlot(room, section, hours, roomOccupancy, sectionOccupancy);
                if (slot) {
                    const schedule = {
                        section_id: section.id,
                        course_id: course.id,
                        room_id: room.id,
                        day_pattern: slot.dayPattern,
                        start_time: slot.startTime,
                        end_time: slot.endTime,
                        schedule_type: 'lab'
                    };
                    this.markTimeSlot(schedule, roomOccupancy, sectionOccupancy);
                    return { success: true, schedules: [schedule] };
                }
            }
        }

        return { 
            success: false, 
            reason: 'No available laboratory room slot found' 
        };
    }

    findAvailableSlot(room, section, hours, roomOccupancy, sectionOccupancy) {
        const availableDays = room.available_days.split(',');
        const roomStartHour = this.parseTimeToHours(room.start_time);
        const roomEndHour = this.parseTimeToHours(room.end_time);
        
        for (const day of availableDays) {
            const slot = this.findSlotForDay(room, section, day, hours, roomOccupancy, sectionOccupancy, roomStartHour, roomEndHour);
            if (slot) {
                return {
                    dayPattern: day,
                    startTime: slot.startTime,
                    endTime: slot.endTime
                };
            }
        }

        return null;
    }

    parseTimeToHours(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours + minutes / 60;
    }

    isSlotAvailable(roomId, sectionId, days, startTime, endTime, roomOccupancy, sectionOccupancy) {
        for (const day of days) {
            const roomKey = `${roomId}-${day}`;
            if (roomOccupancy[roomKey]) {
                for (const slot of roomOccupancy[roomKey]) {
                    if (this.timesOverlap(startTime, endTime, slot.start, slot.end)) {
                        return false;
                    }
                }
            }

            const sectionKey = `${sectionId}-${day}`;
            if (sectionOccupancy[sectionKey]) {
                for (const slot of sectionOccupancy[sectionKey]) {
                    if (this.timesOverlap(startTime, endTime, slot.start, slot.end)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    timesOverlap(start1, end1, start2, end2) {
        return start1 < end2 && start2 < end1;
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
}

module.exports = ScheduleGenerator;
