import { useEffect, useMemo, useState } from 'react';

function parseNum(v) {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function CalculatorPage() {
  const [catalog, setCatalog] = useState([]);
  const [rows, setRows] = useState([{ drug: 0, cost: 0, sell: 0, qty: 1 }]);

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
        setCatalog(items);
      });
  }, []);

  const totals = useMemo(() => {
    return rows.reduce((acc, r) => {
      const rev = parseNum(r.sell) * parseNum(r.qty);
      const cost = parseNum(r.cost) * parseNum(r.qty);
      acc.revenue += rev;
      acc.cost += cost;
      acc.profit += rev - cost;
      return acc;
    }, { revenue: 0, cost: 0, profit: 0 });
  }, [rows]);

  const updateRow = (index, patch) => setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const addRow = () => setRows((prev) => [...prev, { drug: 0, cost: 0, sell: 0, qty: 1 }]);
  const removeRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="card-stack">
      <button className="primary" onClick={addRow}>+ เพิ่มบรรทัด</button>
      <div className="stats-grid">
        <div className="stat">ยอดขายรวม: {totals.revenue.toFixed(2)} ฿</div>
        <div className="stat">ทุนรวม: {totals.cost.toFixed(2)} ฿</div>
        <div className="stat">กำไรรวม: {totals.profit.toFixed(2)} ฿</div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ชื่อยา</th><th>หมวด</th><th>ทุน/หน่วย</th><th>ขาย/หน่วย</th><th>จำนวน</th><th>กำไร</th><th></th></tr></thead>
          <tbody>
            {rows.map((row, i) => {
              const drug = catalog[row.drug];
              const profit = parseNum(row.sell) * parseNum(row.qty) - parseNum(row.cost) * parseNum(row.qty);
              return (
                <tr key={i}>
                  <td>
                    <select value={row.drug} onChange={(e) => {
                      const idx = Number(e.target.value);
                      const d = catalog[idx];
                      updateRow(i, { drug: idx, cost: parseNum(d?.want), sell: parseNum(d?.want) + parseNum(d?.profit) });
                    }}>
                      {catalog.map((d, idx) => <option key={`${d.name}-${idx}`} value={idx}>{d.name}</option>)}
                    </select>
                  </td>
                  <td>{drug?.category || '-'}</td>
                  <td><input type="number" value={row.cost} onChange={(e) => updateRow(i, { cost: e.target.value })} /></td>
                  <td><input type="number" value={row.sell} onChange={(e) => updateRow(i, { sell: e.target.value })} /></td>
                  <td><input type="number" min="1" value={row.qty} onChange={(e) => updateRow(i, { qty: Math.max(1, Number(e.target.value) || 1) })} /></td>
                  <td>{profit.toFixed(2)} ฿</td>
                  <td><button className="mini danger" onClick={() => removeRow(i)}>ลบ</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}