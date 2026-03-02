interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: '#dbeafe', color: '#1d4ed8' },
  completed: { bg: '#dcfce7', color: '#15803d' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c' },
  'no-show': { bg: '#fef3c7', color: '#b45309' },
  pending: { bg: '#fef3c7', color: '#b45309' },
  paid: { bg: '#dcfce7', color: '#15803d' },
  overdue: { bg: '#fee2e2', color: '#b91c1c' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors = statusColors[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'capitalize',
      background: colors.bg,
      color: colors.color,
    }}>
      {status}
    </span>
  );
}
