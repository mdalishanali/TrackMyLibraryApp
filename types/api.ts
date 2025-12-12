export type Seat = {
  _id?: string;
  seatNumber: number;
  floor?: number;
  floorId?: string;
};

export type Student = {
  _id: string;
  id?: number;
  name: string;
  number: string;
  seat?: string;
  seatNumber?: number;
  shift?: string;
  time?: { start: string; end: string }[];
  fees?: number;
  joiningDate?: string;
  status?: string;
  notes?: string;
  lastPayment?: Payment | null;
  lastPaymentDate?: string;
  nextDueDate?: string;
  paymentStatus?: string;
  profilePicture?: string;
  gender?: string;
};

export type Payment = {
  _id: string;
  student: Student | string;
  user?: unknown;
  rupees: number;
  startDate: string;
  endDate: string;
  paymentMode: 'cash' | 'upi';
  notes?: string;
  paymentDate: string;
  createdAt?: string;
};

export type DashboardResponse = {
  recentStudents: Student[];
  duesStudents: Student[];
  latestPayments: Payment[];
  earnings: number;
  activeStudentsCount: number;
  totalStudents: number;
  studentsEnrolledThisMonth: number;
};
