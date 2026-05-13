import { useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import InventoryPage from './components/InventoryPage';
import CalculatorPage from './components/CalculatorPage';
import CategoryPage from './components/CategoryPage';

const pageMap = {
  inventory: 'ระบบคลังยา',
  category: 'หมวดหมู่ยา',
  calculator: 'คำนวณรายได้/กำไร'
};

export default function App() {
  const [activePage, setActivePage] = useState('inventory');
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = useMemo(() => pageMap[activePage] || 'ระบบคลังยา', [activePage]);

  const onSelectPage = (page) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onSelectPage={onSelectPage} mobileOpen={mobileOpen} />
      <main className="content-shell">
        <header className="page-header">
          <button className="menu-btn" onClick={() => setMobileOpen((v) => !v)} aria-label="toggle sidebar">
            ☰
          </button>
          <h1>{pageTitle}</h1>
        </header>
        <section className="page-body">
          {activePage === 'inventory' && <InventoryPage />}
          {activePage === 'category' && <CategoryPage />}
          {activePage === 'calculator' && <CalculatorPage />}
        </section>
      </main>
    </div>
  );
}