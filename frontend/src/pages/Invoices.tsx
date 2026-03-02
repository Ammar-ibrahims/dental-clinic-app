import { useEffect, useState } from 'react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { api } from '../hooks/useApi';
import { Invoice } from '../types';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get<Invoice[]>('/invoices').then(r => setInvoices(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (id: number) => {
    await api.patch(`/invoices/${id}/pay`);
    load();
  };

  const totalPending = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Invoices</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total Pending</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>${totalPending.toLocaleString()}</p>
        </Card>
        <Card>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total Collected</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>${totalPaid.toLocaleString()}</p>
        </Card>
        <Card>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total Invoices</p>
          <p style={{ fontSize: '24px', fontWeight: 700 }}>{invoices.length}</p>
        </Card>
      </div>

      <Card>
        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                {['Invoice #', 'Patient', 'Amount', 'Status', 'Issued', 'Due Date', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#0ea5e9' }}>#{inv.id.toString().padStart(4, '0')}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{inv.patientName}</td>
                  <td style={{ padding: '12px', fontWeight: 700 }}>${inv.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}><StatusBadge status={inv.status} /></td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{inv.issuedAt?.slice(0, 10)}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{inv.dueDate}</td>
                  <td style={{ padding: '12px' }}>
                    {inv.status !== 'paid' && (
                      <button onClick={() => markPaid(inv.id)} style={{ background: '#dcfce7', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#15803d', fontSize: '12px', fontWeight: 600 }}>
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No invoices found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
