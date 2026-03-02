import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { api } from '../hooks/useApi';
import { Treatment } from '../types';

const emptyForm = { name: '', description: '', duration: 30, cost: 0, category: '' };
const categories = ['Preventive', 'Restorative', 'Cosmetic', 'Orthodontic', 'Surgical', 'Emergency'];

export default function Treatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Treatment | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    api.get<Treatment[]>('/treatments').then(r => setTreatments(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (t: Treatment) => { setEditing(t); setForm({ name: t.name, description: t.description, duration: t.duration, cost: t.cost, category: t.category }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/treatments/${editing.id}`, form);
    } else {
      await api.post('/treatments', form);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this treatment?')) return;
    await api.delete(`/treatments/${id}`);
    load();
  };

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' };
  const labelStyle = { fontSize: '13px', fontWeight: 500 as const, color: '#374151', marginBottom: '4px', display: 'block' as const };

  const catColors: Record<string, string> = {
    Preventive: '#dbeafe', Restorative: '#dcfce7', Cosmetic: '#fce7f3',
    Orthodontic: '#e0e7ff', Surgical: '#fee2e2', Emergency: '#fef3c7',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Treatments</h1>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0ea5e9', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>
          <Plus size={18} /> Add Treatment
        </button>
      </div>

      <Card>
        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                {['Name', 'Category', 'Duration', 'Cost', 'Description', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {treatments.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{t.name}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: catColors[t.category] ?? '#f1f5f9' }}>{t.category}</span>
                  </td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{t.duration} min</td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#22c55e' }}>${t.cost}</td>
                  <td style={{ padding: '12px', color: '#64748b', maxWidth: '200px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{t.description}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(t)} style={{ background: '#f0f9ff', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#0ea5e9', fontSize: '12px', fontWeight: 600 }}>Edit</button>
                      <button onClick={() => handleDelete(t.id)} style={{ background: '#fff0f0', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {treatments.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No treatments found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Treatment' : 'Add Treatment'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Treatment Name *</label>
            <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Category *</label>
              <select required style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Duration (min)</label>
              <input type="number" style={inputStyle} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} min={5} />
            </div>
            <div>
              <label style={labelStyle}>Cost ($)</label>
              <input type="number" style={inputStyle} value={form.cost} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} min={0} step={0.01} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
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
