export type Seat = {
  _id?: string;
  seatNumber: number;
  floor?: number;
  floorId?: string;
  students?: Student[];
  notes?: string;
  status?: 'active' | 'maintenance' | 'reserved';
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
  fatherName?: string;
  address?: string;
  aadhaarNumber?: string;
  preparationFor?: string;
  floor?: number | string;
  allocations?: string[] | Shift[];
  statusHistory?: {
    status: 'Active' | 'Inactive' | 'Joined';
    date: string;
    comment?: string;
    _id?: string;
  }[];
  dueAmount?: number;
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
  dueAmount: number;
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
  duesCount?: number;
  paidCount?: number;
  trialCount?: number;
  defaulterCount?: number;
};

export type Shift = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  price: number;
  isFullDay?: boolean;
  isActive?: boolean;
};
