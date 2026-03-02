import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { api } from '../hooks/useApi';
import { Appointment, Patient, Dentist, Treatment } from '../types';

const emptyForm = {
  patientId: '', dentistId: '', date: '', time: '', duration: 30,
  treatment: '', status: 'scheduled', notes: '',
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Appointment[]>('/appointments'),
      api.get<Patient[]>('/patients'),
      api.get<Dentist[]>('/dentists'),
      api.get<Treatment[]>('/treatments'),
    ]).then(([a, p, d, t]) => {
      setAppointments(a.data);
      setPatients(p.data);
      setDentists(d.data);
      setTreatments(t.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (a: Appointment) => {
    setEditing(a);
    setForm({ patientId: String(a.patientId), dentistId: String(a.dentistId), date: a.date, time: a.time, duration: a.duration, treatment: a.treatment, status: a.status, notes: a.notes ?? '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, patientId: Number(form.patientId), dentistId: Number(form.dentistId) };
    if (editing) {
      await api.put(`/appointments/${editing.id}`, payload);
    } else {
      await api.post('/appointments', payload);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this appointment?')) return;
    await api.delete(`/appointments/${id}`);
    load();
  };

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' };
  const labelStyle = { fontSize: '13px', fontWeight: 500 as const, color: '#374151', marginBottom: '4px', display: 'block' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Appointments</h1>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0ea5e9', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>
          <Plus size={18} /> Schedule Appointment
        </button>
      </div>

      <Card>
        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                {['Patient', 'Dentist', 'Date', 'Time', 'Treatment', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{a.patientName}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{a.dentistName}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{a.date}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{a.time}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{a.treatment}</td>
                  <td style={{ padding: '12px' }}><StatusBadge status={a.status} /></td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(a)} style={{ background: '#f0f9ff', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#0ea5e9', fontSize: '12px', fontWeight: 600 }}>Edit</button>
                      <button onClick={() => handleDelete(a.id)} style={{ background: '#fff0f0', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No appointments found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Appointment' : 'Schedule Appointment'} size="lg">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Patient *</label>
              <select required style={inputStyle} value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Dentist *</label>
              <select required style={inputStyle} value={form.dentistId} onChange={e => setForm(f => ({ ...f, dentistId: e.target.value }))}>
                <option value="">Select dentist</option>
                {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Date *</label>
              <input type="date" required style={inputStyle} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Time *</label>
              <input type="time" required style={inputStyle} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Duration (min)</label>
              <input type="number" style={inputStyle} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} min={15} step={15} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Treatment *</label>
              <select style={inputStyle} value={form.treatment} onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))}>
                <option value="">Select treatment</option>
                {treatments.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                <option value="General Checkup">General Checkup</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', fontWeight: 600 }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600 }}>Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
