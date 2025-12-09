export const formatDate = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

export const formatCurrency = (amount?: number | null) => {
  if (amount === null || amount === undefined) return '—';
  return Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};
