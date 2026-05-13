const navItems = [
  { key: 'inventory', label: 'คลังยา' },
  { key: 'category', label: 'หมวดหมู่ยา' },
  { key: 'calculator', label: 'คำนวณกำไร' }
];

export default function Sidebar({ activePage, onSelectPage, mobileOpen }) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="brand">Fama Dashboard</div>
      <nav>
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${activePage === item.key ? 'active' : ''}`}
            onClick={() => onSelectPage(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}