import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { api } from '../hooks/useApi';
import { Patient } from '../types';

const emptyPatient: Omit<Patient, 'id' | 'createdAt'> = {
  name: '', email: '', phone: '', dateOfBirth: '', address: '', medicalHistory: '',
};

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState(emptyPatient);

  const load = () => {
    setLoading(true);
    api.get<Patient[]>('/patients').then(r => setPatients(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyPatient); setModalOpen(true); };
  const openEdit = (p: Patient) => { setEditing(p); setForm({ name: p.name, email: p.email, phone: p.phone, dateOfBirth: p.dateOfBirth, address: p.address, medicalHistory: p.medicalHistory }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/patients/${editing.id}`, form);
    } else {
      await api.post('/patients', form);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this patient?')) return;
    await api.delete(`/patients/${id}`);
    load();
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', outline: 'none',
  };
  const labelStyle = { fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px', display: 'block' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Patients</h1>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: '#0ea5e9', color: 'white', border: 'none',
          padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
        }}>
          <Plus size={18} /> Add Patient
        </button>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: '#f8fafc', borderRadius: '8px', padding: '8px 12px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patients..."
            style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '14px' }}
          />
        </div>
        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                {['Name', 'Email', 'Phone', 'Date of Birth', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{p.email}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{p.phone}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{p.dateOfBirth}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(p)} style={{ background: '#f0f9ff', border: 'none', padding: '6px', borderRadius: '6px', color: '#0ea5e9' }}><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: '#fff0f0', border: 'none', padding: '6px', borderRadius: '6px', color: '#ef4444' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No patients found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Patient' : 'Add Patient'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" style={inputStyle} value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <input style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Medical History</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.medicalHistory} onChange={e => setForm(f => ({ ...f, medicalHistory: e.target.value }))} />
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
