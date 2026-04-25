import { StudentFormValues } from '@/components/students/student-form-modal';
import { StudentPayload } from '@/hooks/use-students';

export const transformFormToPayload = (values: StudentFormValues, shifts: any[]): StudentPayload => {
  // If values.shift contains something like "First" (legacy), try to find a shift with that name
  const processedShiftIds = (values.shift || []).map(idOrName => {
    // If it's a valid ObjectId hex string (24 chars), it's likely already an ID
    if (/^[0-9a-fA-F]{24}$/.test(idOrName)) return idOrName;

    // Otherwise try to find a shift with that name (case insensitive)
    const found = shifts.find(s => s.name?.trim().toLowerCase() === idOrName.trim().toLowerCase());
    return found?._id || null;
  }).filter(Boolean);

  // Map shift IDs back to names for the 'shift' string field the server expects (legacy compat)
  const selectedShifts = shifts.filter(s => processedShiftIds.includes(s._id));
  
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
    allocations: processedShiftIds, // Use the resolved IDs
    time: timeSlots.length > 0 ? timeSlots : [{ start: values.startTime || '09:00', end: values.endTime || '18:00' }],
    fees: Number(values.fees) || 0,
    notes: values.notes,
    gender: values.gender,
    fatherName: values.fatherName,
    address: values.address,
    aadhaarNumber: values.aadhaarNumber,
    preparationFor: values.preparationFor,
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
    aadhaarNumber: '',
    preparationFor: ''
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
    aadhaarNumber: s.aadhaarNumber || '',
    preparationFor: s.preparationFor || '',
    profilePicture: s.profilePicture || ''
  };
};
