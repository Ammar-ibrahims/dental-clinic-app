import { useEffect, useState } from 'react';
import { Users, CalendarDays, Receipt, TrendingUp } from 'lucide-react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { api } from '../hooks/useApi';
import { DashboardStats, Appointment } from '../types';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{label}</p>
          <p style={{ fontSize: '28px', fontWeight: 700 }}>{value}</p>
        </div>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
        }}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon={Users} label="Total Patients" value={stats?.totalPatients ?? 0} color="#0ea5e9" />
        <StatCard icon={CalendarDays} label="Today's Appointments" value={stats?.todayAppointments ?? 0} color="#8b5cf6" />
        <StatCard icon={Receipt} label="Pending Invoices" value={stats?.pendingInvoices ?? 0} color="#f59e0b" />
        <StatCard icon={TrendingUp} label="Monthly Revenue" value={`$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`} color="#22c55e" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Recent Appointments</h2>
          {(stats?.recentAppointments ?? []).length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No recent appointments</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(stats?.recentAppointments ?? []).map((apt: Appointment) => (
                <div key={apt.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px', background: '#f8fafc', borderRadius: '8px',
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{apt.patientName}</p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>{apt.treatment} · {apt.date}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Upcoming Appointments</h2>
          {(stats?.upcomingAppointments ?? []).length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No upcoming appointments</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(stats?.upcomingAppointments ?? []).map((apt: Appointment) => (
                <div key={apt.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px', background: '#f0f9ff', borderRadius: '8px',
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{apt.patientName}</p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>{apt.treatment} · {apt.date} {apt.time}</p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: 600 }}>{apt.dentistName}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
