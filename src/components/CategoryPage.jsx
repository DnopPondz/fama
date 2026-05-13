import { useEffect, useMemo, useState } from 'react';

export default function CategoryPage() {
  const [groups, setGroups] = useState({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/drugs')
      .then((r) => r.json())
      .then((raw) => setGroups(raw || {}))
      .catch(() => alert('โหลดข้อมูลหมวดไม่สำเร็จ'));
  }, []);

  const normalized = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(groups)
      .map(([cat, items]) => {
        const safeItems = Array.isArray(items) ? items.filter((i) => i?.name) : [];
        const filteredItems = q
          ? safeItems.filter((i) => String(i.name).toLowerCase().includes(q) || String(cat).toLowerCase().includes(q))
          : safeItems;
        return { category: cat, items: filteredItems, allCount: safeItems.length };
      })
      .filter((g) => g.items.length > 0 || (!q && g.allCount >= 0))
      .sort((a, b) => a.category.localeCompare(b.category, 'th'));
  }, [groups, query]);

  const totalCategories = normalized.length;
  const totalItems = normalized.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="card-stack">
      <div className="toolbar-grid">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาหมวดหรือชื่อยา"
        />
      </div>

      <div className="stats-grid">
        <div className="stat pad">จำนวนหมวด: <strong>{totalCategories}</strong></div>
        <div className="stat pad">จำนวนรายการที่แสดง: <strong>{totalItems}</strong></div>
      </div>

      <div className="category-grid">
        {normalized.map((group) => (
          <details key={group.category} className="category-card" open>
            <summary>
              <span>{group.category}</span>
              <span className="badge">{group.items.length} รายการ</span>
            </summary>
            <ul>
              {group.items.map((item, idx) => (
                <li key={`${group.category}-${item.name}-${idx}`}>
                  <span>{item.name}</span>
                  <span className="muted">ทุน: {item.want || '-'} | กำไร: {Number(item.profit || 0).toLocaleString('th-TH')}</span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}