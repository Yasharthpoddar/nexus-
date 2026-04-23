export function safeDate(val: any) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  
  return d.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

export function safeID(id: string | undefined | null) {
  if (!id) return 'N/A';
  // Audit C1: Never use parseInt on a UUID.
  return id.toString().slice(0, 8).toUpperCase();
}
