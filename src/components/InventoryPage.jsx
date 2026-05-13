import { useEffect, useMemo, useState } from 'react';

const emptyForm = { name: '', category: '', want: '', profit: 0 };

export default function InventoryPage() {
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingIndex, setEditingIndex] = useState(-1);

  const categories = useMemo(() => [...new Set(drugs.map((d) => d.category))].sort((a, b) => a.localeCompare(b, 'th')), [drugs]);

  const filtered = useMemo(() => {
    return drugs.filter((d) => {
      const q = search.trim().toLowerCase();
      const matchQuery = !q || String(d.name).toLowerCase().includes(q) || String(d.category).toLowerCase().includes(q);
      const matchCat = !category || d.category === category;
      return matchQuery && matchCat;
    });
  }, [drugs, search, category]);

  useEffect(() => {
    fetch('/api/drugs')
      .then((r) => r.json())
      .then((raw) => {
        const items = [];
        Object.keys(raw || {}).forEach((cat) => {
          (raw[cat] || []).forEach((item) => {
            if (item?.name) items.push({ ...item, category: cat });
          });
        });
        setDrugs(items);
      })
      .catch(() => alert('โหลดข้อมูลไม่สำเร็จ'));
  }, []);

  const saveAll = async (next) => {
    const grouped = next.reduce((acc, curr) => {
      if (!acc[curr.category]) acc[curr.category] = [];
      acc[curr.category].push({ name: curr.name, want: curr.want, profit: Number(curr.profit) || 0 });
      return acc;
    }, {});

    const res = await fetch('/api/drugs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grouped)
    });
    if (!res.ok) throw new Error('save failed');
    setDrugs(next);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) return alert('กรอกชื่อยาและหมวดหมู่');
    const next = [...drugs];
    const payload = { ...form, name: form.name.trim(), category: form.category.trim(), profit: Number(form.profit) || 0 };
    if (editingIndex >= 0) next[editingIndex] = payload;
    else next.unshift(payload);
    await saveAll(next);
    setEditingIndex(-1);
    setForm(emptyForm);
  };

  const onEdit = (index) => {
    setEditingIndex(index);
    setForm(drugs[index]);
  };

  const onDelete = async (index) => {
    if (!confirm('ยืนยันการลบ?')) return;
    const next = drugs.filter((_, i) => i !== index);
    await saveAll(next);
  };

  return (
    <div className="card-stack">
      <div className="toolbar-grid">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">ทุกหมวด</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <form className="form-grid" onSubmit={onSubmit}>
        <input value={form.name} placeholder="ชื่อยา" onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
        <input value={form.category} placeholder="หมวด" onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))} />
        <input value={form.want} placeholder="ต้นทุน" onChange={(e) => setForm((v) => ({ ...v, want: e.target.value }))} />
        <input type="number" value={form.profit} placeholder="กำไร" onChange={(e) => setForm((v) => ({ ...v, profit: e.target.value }))} />
        <button className="submit-btn" type="submit">{editingIndex >= 0 ? 'อัปเดตยา' : 'เพิ่มยา'}</button>
      </form>

      <div className="mobile-list">
        {filtered.map((item) => {
          const index = drugs.indexOf(item);
          return (
            <article className="drug-card" key={`m-${item.name}-${index}`}>
              <h3>{item.name}</h3>
              <p><strong>หมวด:</strong> {item.category}</p>
              <p><strong>ทุน:</strong> {item.want || '-'}</p>
              <p><strong>กำไร:</strong> {Number(item.profit || 0).toLocaleString('th-TH')}</p>
              <div className="card-actions">
                <button className="mini" onClick={() => onEdit(index)}>แก้ไข</button>
                <button className="mini danger" onClick={() => onDelete(index)}>ลบ</button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>ชื่อยา</th><th>หมวด</th><th>ทุน</th><th>กำไร</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const index = drugs.indexOf(item);
              return (
                <tr key={`${item.name}-${index}`}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.want || '-'}</td>
                  <td>{Number(item.profit || 0).toLocaleString('th-TH')}</td>
                  <td>
                    <button className="mini" onClick={() => onEdit(index)}>แก้ไข</button>
                    <button className="mini danger" onClick={() => onDelete(index)}>ลบ</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
