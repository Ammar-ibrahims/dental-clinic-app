import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { api } from '../hooks/useApi';
import { Dentist } from '../types';

const emptyForm = { name: '', email: '', phone: '', specialization: '', schedule: '' };

export default function Dentists() {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dentist | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    api.get<Dentist[]>('/dentists').then(r => setDentists(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (d: Dentist) => { setEditing(d); setForm({ name: d.name, email: d.email, phone: d.phone, specialization: d.specialization, schedule: d.schedule ?? '' }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/dentists/${editing.id}`, form);
    } else {
      await api.post('/dentists', form);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this dentist?')) return;
    await api.delete(`/dentists/${id}`);
    load();
  };

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' };
  const labelStyle = { fontSize: '13px', fontWeight: 500 as const, color: '#374151', marginBottom: '4px', display: 'block' as const };

  const specializations = ['General Dentistry', 'Orthodontics', 'Periodontics', 'Oral Surgery', 'Endodontics', 'Prosthodontics', 'Pediatric Dentistry', 'Cosmetic Dentistry'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Dentists</h1>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0ea5e9', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>
          <Plus size={18} /> Add Dentist
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {loading ? (
          <p style={{ color: '#94a3b8' }}>Loading...</p>
        ) : dentists.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No dentists added yet</p>
        ) : dentists.map(d => (
          <Card key={d.id}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🦷</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, fontSize: '15px' }}>{d.name}</h3>
                <p style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: 600, marginBottom: '6px' }}>{d.specialization}</p>
                <p style={{ fontSize: '13px', color: '#64748b' }}>{d.email}</p>
                <p style={{ fontSize: '13px', color: '#64748b' }}>{d.phone}</p>
                {d.schedule && <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{d.schedule}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => openEdit(d)} style={{ flex: 1, padding: '6px', background: '#f0f9ff', border: 'none', borderRadius: '6px', color: '#0ea5e9', fontWeight: 600, fontSize: '13px' }}>Edit</button>
              <button onClick={() => handleDelete(d.id)} style={{ flex: 1, padding: '6px', background: '#fff0f0', border: 'none', borderRadius: '6px', color: '#ef4444', fontWeight: 600, fontSize: '13px' }}>Delete</button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Dentist' : 'Add Dentist'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Specialization *</label>
            <select required style={inputStyle} value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}>
              <option value="">Select specialization</option>
              {specializations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
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
          <div>
            <label style={labelStyle}>Schedule</label>
            <input style={inputStyle} value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} placeholder="e.g. Mon-Fri 9am-5pm" />
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
