/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Search, Filter, ChevronDown, Download, Wrench, AlertTriangle, 
  CheckCircle, HelpCircle, LayoutDashboard, Database, MapPin,
  Menu, X
} from 'lucide-react';
import { fetchToolData } from './services/dataService';
import { ToolData, JobsiteStats } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [data, setData] = useState<ToolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJobsite, setFilterJobsite] = useState<string>('All Jobsites');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'dashboard' | 'table'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const result = await fetchToolData();
      setData(result);
      setLoading(false);
    }
    loadData();
  }, []);

  // Close sidebar when clicking outside or switching sites on mobile
  const selectSite = (site: string) => {
    setFilterJobsite(site);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const jobsites = useMemo(() => {
    const sites = Array.from(new Set(data.map(item => item.jobsite))).filter(Boolean);
    return ['All Jobsites', ...sites.sort()];
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchJobsite = filterJobsite === 'All Jobsites' || item.jobsite === filterJobsite;
      const matchSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchJobsite && matchSearch;
    });
  }, [data, filterJobsite, searchTerm]);

  const stats = useMemo(() => {
    const total = filteredData.reduce((acc, curr) => acc + curr.quantity, 0);
    const baik = filteredData.filter(i => i.condition === 'BAIK').reduce((acc, curr) => acc + curr.quantity, 0);
    const rusak = filteredData.filter(i => i.condition === 'RUSAK').reduce((acc, curr) => acc + curr.quantity, 0);
    const hilang = filteredData.filter(i => i.condition === 'HILANG').reduce((acc, curr) => acc + curr.quantity, 0);
    
    return { total, baik, rusak, hilang };
  }, [filteredData]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredData.forEach(item => {
      cats[item.category] = (cats[item.category] || 0) + item.quantity;
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredData]);

  const conditionData = [
    { name: 'Baik', value: stats.baik, color: '#10b981' },
    { name: 'Rusak', value: stats.rusak, color: '#f59e0b' },
    { name: 'Hilang', value: stats.hilang, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-900 font-sans p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Database className="animate-spin text-accent" size={40} />
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Loading Tool Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative w-[240px] bg-slate-800 text-white p-6 flex flex-col flex-shrink-0 h-full transition-transform duration-300 z-50",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
              <LayoutDashboard size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight">EquipTrack</span>
          </div>
          <button 
            className="lg:hidden p-1 hover:bg-white/10 rounded-md transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          <span className="text-[0.75rem] uppercase font-semibold text-slate-400 tracking-wider mb-4 block">
            Jobsite Locations
          </span>
          <ul className="space-y-1">
            {jobsites.map(site => (
              <li 
                key={site}
                onClick={() => selectSite(site)}
                className={cn(
                  "px-3 py-2 rounded-md cursor-pointer text-sm transition-all",
                  filterJobsite === site 
                    ? "bg-white/10 text-white font-semibold" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {site}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-6 border-t border-slate-700 mt-6 shrink-0">
           <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg">
             <button
                onClick={() => setView('dashboard')}
                className={cn(
                  "py-1.5 text-xs font-medium rounded-md transition-all",
                  view === 'dashboard' ? "bg-accent text-white" : "text-slate-400 hover:text-white"
                )}
             >
               Charts
             </button>
             <button
                onClick={() => setView('table')}
                className={cn(
                  "py-1.5 text-xs font-medium rounded-md transition-all",
                  view === 'table' ? "bg-accent text-white" : "text-slate-400 hover:text-white"
                )}
             >
               Table
             </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col h-full overflow-hidden">
        <header className="p-4 sm:p-6 lg:p-8 flex items-center gap-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 md:static">
          <button 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-grow">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
              Monitoring Tools
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-widest truncate">
              {filterJobsite} • G-Sheets Sync
            </p>
          </div>

          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search tools..."
              className="bg-slate-100/50 border border-slate-200 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent w-48 lg:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
          {/* Mobile Search - Visible only on small screens */}
          <div className="relative sm:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari kode tool atau model..."
              className="bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-sm w-full shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
            <StatCard label="Total Population" value={stats.total} icon={<Database size={20} />} trend="+0 unit" />
            <StatCard label="Active Units" value={stats.baik} icon={<CheckCircle size={20} />} status="success" />
            <StatCard label="Maintenance" value={stats.rusak} icon={<AlertTriangle size={20} />} status="warning" />
            <StatCard label="Idle / Hilang" value={stats.hilang} icon={<HelpCircle size={20} />} status="danger" />
          </section>

          {/* Data Section */}
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Detail Asset: {filterJobsite}</h2>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hidden sm:block">
                Mode: {view === 'dashboard' ? 'Insight' : 'Database'}
              </div>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8 overflow-auto">
              <AnimatePresence mode="wait">
                {view === 'dashboard' ? (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12"
                  >
                    <div className="h-[300px] sm:h-[400px]">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Top Tool Categories</h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={categoryData} layout="vertical" margin={{ left: 60, right: 30 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} width={60} />
                          <Tooltip 
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ fontSize: '11px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                          />
                          <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-[300px] sm:h-[400px]">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Condition Distribution</h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                          <Pie
                            data={conditionData}
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {conditionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '30px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="table-container"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8"
                  >
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-slate-50/80 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Tool ID</th>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Category</th>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Tool Name</th>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Location</th>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Condition</th>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredData.map((item, idx) => (
                          <tr key={`${item.no}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 font-bold text-slate-900 text-sm">{item.no || idx + 1}</td>
                            <td className="px-6 py-4 text-slate-500 text-xs font-semibold">{item.category}</td>
                            <td className="px-6 py-4 text-slate-900 font-bold text-sm">{item.name}</td>
                            <td className="px-6 py-4 text-slate-500 text-xs font-medium">{item.location}</td>
                            <td className="px-6 py-4">
                              <StatusBadge condition={item.condition} />
                            </td>
                            <td className="px-6 py-4 text-right text-slate-900 font-mono text-xs font-bold bg-slate-50/30">
                              {item.quantity} {item.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, status, trend }: { label: string, value: number, icon: ReactNode, status?: string, trend?: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={cn(
          "p-2 rounded-lg",
          status === 'success' ? "bg-emerald-50 text-emerald-600" :
          status === 'warning' ? "bg-amber-50 text-amber-600" :
          status === 'danger' ? "bg-red-50 text-red-600" :
          "bg-slate-50 text-slate-400"
        )}>
          {icon}
        </div>
      </div>
      <div className="text-[1.75rem] font-bold text-slate-900 leading-tight">
        {value.toLocaleString()}
      </div>
      {trend && (
        <div className="text-[0.75rem] mt-1 text-emerald-500 font-medium">
          {trend}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ condition }: { condition: ToolData['condition'] }) {
  const styles = {
    'BAIK': 'bg-emerald-100 text-emerald-700',
    'RUSAK': 'bg-amber-100 text-amber-700',
    'HILANG': 'bg-red-100 text-red-700',
    'UNKNOWN': 'bg-slate-100 text-slate-700'
  };

  return (
    <span className={cn("px-2 py-1 rounded-full text-[0.75rem] font-bold uppercase tracking-tight", styles[condition])}>
      {condition}
    </span>
  );
}
