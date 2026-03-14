import { StudentFormValues } from '@/components/students/student-form-modal';
import { StudentPayload } from '@/hooks/use-students';

export const transformFormToPayload = (values: StudentFormValues, shifts: any[]): StudentPayload => {
  // Map shift IDs back to names for the 'shift' string field the server expects
  const selectedShifts = shifts.filter(s => values.shift?.includes(s._id));
  
  const shiftNames = selectedShifts.map(s => s.name).join(', ') || 'Custom';
  
  // Map to the time slots based on selected shifts
  const timeSlots = selectedShifts.map(s => ({
    start: s.startTime,
    end: s.endTime
  }));

  return {
    name: values.name,
    number: values.number,
    joiningDate: values.joiningDate,
    seat: values.seat || undefined,
    allocations: values.shift, // These are the IDs
    shift: shiftNames,
    time: timeSlots.length > 0 ? timeSlots : [{ start: values.startTime || '09:00', end: values.endTime || '18:00' }],
    fees: Number(values.fees) || 0,
    notes: values.notes,
    gender: values.gender,
    fatherName: values.fatherName,
    address: values.address,
    aadhaarNumber: values.aadharNumber,
    profilePicture: values.profilePicture,
  };
};

export const mapStudentToForm = (s: any): StudentFormValues => {
  const d = new Date().toISOString();
  if (!s) return {
    name: '',
    number: '',
    joiningDate: d,
    seat: '',
    shift: [],
    startTime: '09:00',
    endTime: '18:00',
    fees: '500',
    gender: 'Male',
    notes: '',
    profilePicture: '',
    fatherName: '',
    address: '',
    aadharNumber: ''
  };

  return {
    name: s.name || '',
    number: s.number || '',
    joiningDate: s.joiningDate || d,
    seat: s.seat || '',
    shift: (s.allocations && s.allocations.length > 0)
      ? s.allocations.map((a: any) => typeof a === 'string' ? a : a._id)
      : (s.shift ? s.shift.split(',').map((str: string) => str.trim()) : []),
    startTime: s.time?.[0]?.start || '09:00',
    endTime: s.time?.[0]?.end || '18:00',
    fees: String(s.fees || ''),
    gender: s.gender || 'Male',
    notes: s.notes || '',
    fatherName: s.fatherName || '',
    address: s.address || '',
    aadharNumber: s.aadhaarNumber || '',
    profilePicture: s.profilePicture || ''
  };
};
