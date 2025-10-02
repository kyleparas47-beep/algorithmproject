class ScheduleGenerator {
    constructor() {
        this.dayPatterns = {
            twoDay: [
                ['Mon', 'Thu'],
                ['Tue', 'Fri'],
                ['Wed', 'Sat']
            ],
            oneDay: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
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
        
        if (course.type === 'lecture') {
            const hours = course.hours_lecture || 4;
            const result = this.scheduleLecture(course, section, rooms, roomOccupancy, sectionOccupancy, hours);
            if (!result.success) return result;
            schedules.push(result.schedule);
        } else if (course.type === 'leclab') {
            const lectureHours = course.hours_lecture || 2.67;
            const lectureResult = this.scheduleLecture(course, section, rooms, roomOccupancy, sectionOccupancy, lectureHours);
            if (!lectureResult.success) return lectureResult;
            schedules.push(lectureResult.schedule);

            const labHours = course.hours_lab || 4;
            const labResult = this.scheduleLab(course, section, rooms, roomOccupancy, sectionOccupancy, labHours);
            if (!labResult.success) {
                this.releaseTimeSlot(lectureResult.schedule, roomOccupancy, sectionOccupancy);
                return labResult;
            }
            schedules.push(labResult.schedule);
        }

        return { success: true, schedules };
    }

    scheduleLecture(course, section, rooms, roomOccupancy, sectionOccupancy, hours) {
        const lectureRooms = rooms.filter(r => r.type === 'lecture');
        
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
                return { success: true, schedule };
            }
        }

        return { 
            success: false, 
            reason: 'No available lecture room slot found' 
        };
    }

    scheduleLab(course, section, rooms, roomOccupancy, sectionOccupancy, hours) {
        const labRooms = rooms.filter(r => r.type === 'laboratory');
        
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
                return { success: true, schedule };
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
        
        if (hours === 4) {
            for (const dayPattern of this.dayPatterns.twoDay) {
                if (dayPattern.every(d => availableDays.includes(d))) {
                    const slot = this.tryTimeSlot(room, section, dayPattern, 2, roomOccupancy, sectionOccupancy, roomStartHour, roomEndHour);
                    if (slot) return slot;
                }
            }

            for (const day of this.dayPatterns.oneDay) {
                if (availableDays.includes(day)) {
                    const slot = this.tryTimeSlot(room, section, [day], 4, roomOccupancy, sectionOccupancy, roomStartHour, roomEndHour);
                    if (slot) return slot;
                }
            }
        } else if (hours >= 2.5 && hours <= 2.7) {
            for (const day of this.dayPatterns.oneDay) {
                if (availableDays.includes(day)) {
                    const slot = this.tryTimeSlot(room, section, [day], 2.67, roomOccupancy, sectionOccupancy, roomStartHour, roomEndHour);
                    if (slot) return slot;
                }
            }

            for (const dayPattern of this.dayPatterns.twoDay) {
                if (dayPattern.every(d => availableDays.includes(d))) {
                    const slot = this.tryTimeSlot(room, section, dayPattern, 1.34, roomOccupancy, sectionOccupancy, roomStartHour, roomEndHour);
                    if (slot) return slot;
                }
            }
        } else {
            for (const day of this.dayPatterns.oneDay) {
                if (availableDays.includes(day)) {
                    const slot = this.tryTimeSlot(room, section, [day], hours, roomOccupancy, sectionOccupancy, roomStartHour, roomEndHour);
                    if (slot) return slot;
                }
            }
        }

        return null;
    }

    parseTimeToHours(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours + minutes / 60;
    }

    tryTimeSlot(room, section, days, hoursPerDay, roomOccupancy, sectionOccupancy, roomStartHour, roomEndHour) {
        const minutes = Math.round(hoursPerDay * 60);
        
        const startHour = Math.floor(roomStartHour);
        const startMinute = Math.round((roomStartHour - startHour) * 60);
        const endHour = Math.floor(roomEndHour);
        
        for (let hour = startHour; hour < endHour; hour++) {
            const minuteStart = (hour === startHour) ? startMinute : 0;
            
            for (let minute = minuteStart; minute < 60; minute += 20) {
                const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
                const endHourCalc = hour + Math.floor((minute + minutes) / 60);
                const endMinuteCalc = (minute + minutes) % 60;
                
                if (endHourCalc > roomEndHour) continue;
                if (endHourCalc === Math.floor(roomEndHour) && endMinuteCalc > (roomEndHour - Math.floor(roomEndHour)) * 60) continue;

                const endTime = `${String(endHourCalc).padStart(2, '0')}:${String(endMinuteCalc).padStart(2, '0')}:00`;

                if (this.isSlotAvailable(room.id, section.id, days, startTime, endTime, roomOccupancy, sectionOccupancy)) {
                    return {
                        dayPattern: days.join(''),
                        startTime,
                        endTime
                    };
                }
            }
        }

        return null;
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
        const days = this.parseDayPattern(schedule.day_pattern);
        
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
        const days = this.parseDayPattern(schedule.day_pattern);
        
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

    parseDayPattern(pattern) {
        if (pattern.length === 3) {
            return [pattern];
        }
        
        const days = [];
        for (let i = 0; i < pattern.length; i += 3) {
            days.push(pattern.substr(i, 3));
        }
        return days;
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
