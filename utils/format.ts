export const formatDate = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatCurrency = (amount?: number | null) => {
  if (amount === null || amount === undefined) return '—';
  return Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const formatTime = (value?: string | null) => {
  if (!value) return '--:--';
  const [rawHours, rawMinutes = '00'] = value.split(':');
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return '--:--';

  const period = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = ((hours + 11) % 12) + 1; // converts 0 -> 12, 13 -> 1, etc.
  const hourStr = String(normalizedHours).padStart(2, '0');
  const minuteStr = String(minutes).padStart(2, '0');
  return `${hourStr}:${minuteStr} ${period}`;
};
