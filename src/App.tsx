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
  CheckCircle, HelpCircle, LayoutDashboard, Database, MapPin
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

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const result = await fetchToolData();
      setData(result);
      setLoading(false);
    }
    loadData();
  }, []);

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
      <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-900 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Database className="animate-spin text-accent" size={40} />
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Loading Tool Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-[240px] bg-slate-800 text-white p-6 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
            <LayoutDashboard size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight">EquipTrack</span>
        </div>

        <div className="flex-grow">
          <span className="text-[0.75rem] uppercase font-semibold text-slate-400 tracking-wider mb-4 block">
            Jobsite Locations
          </span>
          <ul className="space-y-1">
            {jobsites.map(site => (
              <li 
                key={site}
                onClick={() => setFilterJobsite(site)}
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

        <div className="pt-6 border-t border-slate-700">
           <div className="flex gap-2 p-1 bg-slate-900 rounded-lg">
             <button
                onClick={() => setView('dashboard')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                  view === 'dashboard' ? "bg-accent text-white" : "text-slate-400 hover:text-white"
                )}
             >
               Charts
             </button>
             <button
                onClick={() => setView('table')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                  view === 'table' ? "bg-accent text-white" : "text-slate-400 hover:text-white"
                )}
             >
               Table
             </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 flex flex-col gap-6 overflow-hidden">
        <header className="flex justify-between items-end flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tool Population Monitoring</h1>
            <p className="text-sm text-slate-500">Data Source: docs.google.com (Real-time Sync)</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari kode tool atau model..."
              className="bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-4 gap-5 flex-shrink-0">
          <StatCard label="Total Population" value={stats.total} icon={<Database size={20} />} trend="+0 unit" />
          <StatCard label="Active Units" value={stats.baik} icon={<CheckCircle size={20} />} status="success" />
          <StatCard label="Maintenance" value={stats.rusak} icon={<AlertTriangle size={20} />} status="warning" />
          <StatCard label="Idle / Hilang" value={stats.hilang} icon={<HelpCircle size={20} />} status="danger" />
        </section>

        {/* Data Section */}
        <section className="flex-grow bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-700">Tool Detail - {filterJobsite}</h2>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              Table View
            </div>
          </div>
          
          <div className="flex-grow overflow-auto">
            <AnimatePresence mode="wait">
              {view === 'dashboard' ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 gap-8 p-8 h-full items-start"
                >
                  <div className="h-[400px]">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Top Categories</h3>
                    <ResponsiveContainer width="100%" height="80%">
                      <BarChart data={categoryData} layout="vertical" margin={{ left: 60, right: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={60} />
                        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-[400px]">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Condition Summary</h3>
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={conditionData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {conditionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              ) : (
                <motion.table
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-left border-collapse"
                >
                  <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider">Tool ID</th>
                      <th className="px-6 py-3 text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.map((item, idx) => (
                      <tr key={`${item.no}-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-semibold text-slate-900 border-b border-slate-100">{item.no || '-'}</td>
                        <td className="px-6 py-3 text-slate-600 border-b border-slate-100">{item.category}</td>
                        <td className="px-6 py-3 text-slate-900 font-medium border-b border-slate-100">{item.name}</td>
                        <td className="px-6 py-3 text-slate-500 border-b border-slate-100">{item.location}</td>
                        <td className="px-6 py-3 border-b border-slate-100">
                          <StatusBadge condition={item.condition} />
                        </td>
                        <td className="px-6 py-3 text-right text-slate-900 font-mono border-b border-slate-100">{item.quantity} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </motion.table>
              )}
            </AnimatePresence>
          </div>
        </section>
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
