
import { AttendanceLog, Shift, Employee } from '../types';

export interface AttendanceDayResult {
  date: string;
  checkIn?: string;
  delayMinutes: number;
  deduction: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_TIME';
}

export interface AttendanceStats {
  employeeId: string;
  totalDeductions: number;
  days: AttendanceDayResult[];
}

export const calculateAttendanceDeductions = (
  employeeLogs: AttendanceLog[],
  shift: Shift,
  employee: Employee,
  startDate: Date,
  endDate: Date
): AttendanceStats => {
  const stats: AttendanceStats = {
    employeeId: employee.id,
    totalDeductions: 0,
    days: []
  };

  if (!shift) return stats;

  const [startH, startM] = shift.startTime.split(':').map(Number);
  const [endH, endM] = shift.endTime.split(':').map(Number);
  
  const shiftMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  const hourlyRate = (employee.basicSalary / 30) / (shiftMinutes / 60 || 8);

  // Group logs by date
  const logsByDate: Record<string, AttendanceLog[]> = {};
  employeeLogs.forEach(log => {
    const dateStr = new Date(log.recordTime).toISOString().split('T')[0];
    if (!logsByDate[dateStr]) logsByDate[dateStr] = [];
    logsByDate[dateStr].push(log);
  });

  // Iterate through each day in range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logsByDate[dateStr] || [];
    
    // Skip Fridays (assuming it's a weekend) - optionally can be configurable
    if (d.getDay() === 5) continue; 

    if (dayLogs.length === 0) {
      // Absent - logic could be more complex (full day deduction)
      // For now, let's just mark it
      stats.days.push({
        date: dateStr,
        delayMinutes: 0,
        deduction: 0, // Should we deduct full day?
        status: 'ABSENT'
      });
      continue;
    }

    // Earliest log of the day is check-in
    const checkInLog = dayLogs.reduce((earliest, current) => 
      new Date(current.recordTime) < new Date(earliest.recordTime) ? current : earliest
    );

    const checkInTime = new Date(checkInLog.recordTime);
    const checkInH = checkInTime.getHours();
    const checkInM = checkInTime.getMinutes();
    const totalCheckInMinutes = checkInH * 60 + checkInM;
    const totalShiftStartMinutes = startH * 60 + startM;

    let delayMinutes = totalCheckInMinutes - totalShiftStartMinutes;
    let deduction = 0;
    let status: AttendanceDayResult['status'] = 'ON_TIME';

    if (delayMinutes > shift.gracePeriod) {
      status = 'LATE';
      if (shift.deductionType === 'FIXED') {
        deduction = shift.deductionRate;
      } else {
        // HOURLY_PERCENT - usually means (delay / 60) * hourlyRate * (deductionRate / 100)
        // Or if deductionRate is just a multiplier of hourly rate
        deduction = (delayMinutes / 60) * hourlyRate * (shift.deductionRate / 100);
      }
    } else {
      delayMinutes = 0;
    }

    stats.totalDeductions += deduction;
    stats.days.push({
      date: dateStr,
      checkIn: checkInTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      delayMinutes,
      deduction,
      status
    });
  }

  return stats;
};
