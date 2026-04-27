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
  Menu, X, Plus, Trash2, Save, XCircle, Pencil
} from 'lucide-react';
import { 
  fetchToolData, addTool, deleteTool,
  fetchLoanData, addLoan, deleteLoan, updateLoan
} from './services/dataService';
import { ToolData, JobsiteStats, LoanData } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [data, setData] = useState<ToolData[]>([]);
  const [loansData, setLoansData] = useState<LoanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterJobsite, setFilterJobsite] = useState<string>('All Jobsites');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'dashboard' | 'table' | 'loans'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanData | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [toolResult, loanResult] = await Promise.all([
        fetchToolData(),
        fetchLoanData()
      ]);
      setData(toolResult);
      setLoansData(loanResult);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddTool = async (newTool: any) => {
    const result = await addTool(newTool);
    if (result.success) {
      showNotification('Tool added successfully!', 'success');
      setIsAddModalOpen(false);
      loadData();
    } else {
      showNotification(result.error || 'Failed to add tool.', 'error');
    }
  };

  const handleDeleteTool = async (rowIdx: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus unit ini?')) return;
    
    const result = await deleteTool(rowIdx);
    if (result.success) {
      showNotification('Unit berhasil dihapus!', 'success');
      loadData();
    } else {
      showNotification(result.error || 'Gagal menghapus unit.', 'error');
    }
  };

  const handleAddLoan = async (newLoan: any) => {
    if (editingLoan && editingLoan.rowIdx !== undefined) {
      const result = await updateLoan(editingLoan.rowIdx, newLoan);
      if (result.success) {
        showNotification('Data peminjaman berhasil diperbarui!', 'success');
        setIsAddLoanModalOpen(false);
        setEditingLoan(null);
        loadData();
      } else {
        showNotification(result.error || 'Gagal memperbarui data peminjaman.', 'error');
      }
    } else {
      const result = await addLoan(newLoan);
      if (result.success) {
        showNotification('Data peminjaman berhasil ditambahkan!', 'success');
        setIsAddLoanModalOpen(false);
        loadData();
      } else {
        showNotification(result.error || 'Gagal menambah data peminjaman.', 'error');
      }
    }
  };

  const handleDeleteLoan = async (rowIdx: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data peminjaman ini?')) return;
    const result = await deleteLoan(rowIdx);
    if (result.success) {
      showNotification('Data peminjaman berhasil dihapus!', 'success');
      loadData();
    } else {
      showNotification(result.error || 'Gagal menghapus data peminjaman.', 'error');
    }
  };

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
      
      const safeName = (item.name || '').toLowerCase();
      const safeBrand = (item.brand || '').toLowerCase();
      const safeCategory = (item.category || '').toLowerCase();
      const safeSearch = (searchTerm || '').toLowerCase();

      const matchSearch = searchTerm === '' || 
        safeName.includes(safeSearch) ||
        safeBrand.includes(safeSearch) ||
        safeCategory.includes(safeSearch);
      return matchJobsite && matchSearch;
    });
  }, [data, filterJobsite, searchTerm]);

  const filteredLoansData = useMemo(() => {
    return loansData.filter(loan => {
      const matchJobsite = filterJobsite === 'All Jobsites' || loan.jobsite === filterJobsite;
      const safeBorrower = (loan.borrowerName || '').toLowerCase();
      const safeTool = (loan.toolName || '').toLowerCase();
      const safeReg = (loan.registerNo || '').toLowerCase();
      const safeSearch = (searchTerm || '').toLowerCase();

      const matchSearch = searchTerm === '' || 
        safeBorrower.includes(safeSearch) ||
        safeTool.includes(safeSearch) ||
        safeReg.includes(safeSearch);
        
      return matchJobsite && matchSearch;
    });
  }, [loansData, filterJobsite, searchTerm]);

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
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed lg:relative w-[240px] bg-slate-800 text-white p-6 flex flex-col flex-shrink-0 h-full transition-transform duration-300 z-50",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
              <Plus 
                size={18} 
                className="cursor-pointer hover:scale-110 transition-transform" 
                onClick={() => setIsAddModalOpen(true)}
              />
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

        <div className="mb-6">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-accent/20"
          >
            <Plus size={16} />
            Input Tool Baru
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
           <div className="flex flex-col gap-2 p-1 bg-slate-900 rounded-lg">
             <button
                onClick={() => setView('dashboard')}
                className={cn(
                  "py-2 text-xs font-medium rounded-md transition-all",
                  view === 'dashboard' ? "bg-accent text-white" : "text-slate-400 hover:text-white"
                )}
             >
               Charts Insight
             </button>
             <button
                onClick={() => setView('table')}
                className={cn(
                  "py-2 text-xs font-medium rounded-md transition-all",
                  view === 'table' ? "bg-accent text-white" : "text-slate-400 hover:text-white"
                )}
             >
               Database Tools
             </button>
             <button
                onClick={() => setView('loans')}
                className={cn(
                  "py-2 text-xs font-medium rounded-md transition-all",
                  view === 'loans' ? "bg-accent text-white" : "text-slate-400 hover:text-white"
                )}
             >
               Peminjaman Tools
             </button>
           </div>
        </div>
      </aside>

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

        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 relative">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4"
            >
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-rose-900 font-bold">Koneksi Spreadsheet Gagal</h3>
                <p className="text-rose-600 text-sm mt-1">{error}</p>
                <div className="mt-4 flex gap-3">
                  <button 
                    onClick={loadData}
                    className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          <AnimatePresence>
            {notification && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "fixed top-6 right-6 z-[60] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold border",
                  notification.type === 'success' ? "bg-emerald-500 text-white border-emerald-400" : "bg-rose-500 text-white border-rose-400"
                )}
              >
                {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                {notification.message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative sm:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search tools..."
              className="bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-sm w-full shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
            <StatCard label="Total Population" value={stats.total} icon={<Database size={20} />} trend="+0 unit" />
            <StatCard label="Active Units" value={stats.baik} icon={<CheckCircle size={20} />} status="success" />
            <StatCard label="Maintenance" value={stats.rusak} icon={<AlertTriangle size={20} />} status="warning" />
            <StatCard label="Idle / Hilang" value={stats.hilang} icon={<HelpCircle size={20} />} status="danger" />
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-tight">
                {view === 'loans' ? 'Monitoring Peminjaman Tools' : `Detail Asset: ${filterJobsite}`}
              </h2>
              <div className="flex gap-2">
                {view === 'loans' && (
                  <button 
                    onClick={() => setIsAddLoanModalOpen(true)}
                    className="px-3 py-1.5 bg-accent hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    <Plus size={12} />
                    Input Pinjaman
                  </button>
                )}
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hidden sm:flex items-center">
                  Mode: {view === 'dashboard' ? 'Insight' : view === 'table' ? 'Database' : 'Monitoring'}
                </div>
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
                    <div className="h-[300px] sm:h-[400px] min-h-0 min-w-0">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Top Tool Categories</h3>
                      <ResponsiveContainer width="100%" height="90%" minHeight={0}>
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
                    <div className="h-[300px] sm:h-[400px] min-h-0 min-w-0">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Condition Distribution</h3>
                      <ResponsiveContainer width="100%" height="90%" minHeight={0}>
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
                ) : view === 'table' ? (
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
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-center">Action</th>
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
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => item.rowIdx !== undefined && handleDeleteTool(item.rowIdx)}
                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Hapus Unit"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                ) : (
                  <motion.div
                    key="loans-container"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8"
                  >
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-slate-50/80 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Jobsite</th>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Tgl Pinjam</th>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Nama Peminjam</th>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">No Reg Tools</th>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Nama Tools</th>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Status</th>
                          <th className="px-6 py-4 text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLoansData.map((loan, idx) => (
                          <tr key={`${loan.rowIdx}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{loan.jobsite}</td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-600">{loan.loanDate}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{loan.borrowerName}</td>
                            <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">{loan.registerNo}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-800">{loan.toolName}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight",
                                loan.status === 'DIPINJAM' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                              )}>
                                {loan.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setEditingLoan(loan);
                                    setIsAddLoanModalOpen(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Edit Pinjaman"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button 
                                  onClick={() => loan.rowIdx !== undefined && handleDeleteLoan(loan.rowIdx)}
                                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Hapus Pinjaman"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredLoansData.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic text-sm">Belum ada data peminjaman tools</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Input Data Aset</h2>
                  <p className="text-xs text-slate-500 font-medium tracking-tight">Tambah unit baru ke dalam monitoring spreadsheet</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form 
                className="p-8 space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newTool = Object.fromEntries(formData.entries());
                  handleAddTool({
                    ...newTool,
                    quantity: parseFloat(newTool.quantity as string) || 1
                  });
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Jobsite</label>
                    <select name="jobsite" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent">
                      {jobsites.filter(s => s !== 'All Jobsites').map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Lokasi Details</label>
                    <input name="location" placeholder="e.g. Workshop A" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Kategori Tools</label>
                    <input name="category" required placeholder="e.g. Power Tools" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nama Alat</label>
                    <input name="name" required placeholder="e.g. Drill Machine" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Brand / Merk</label>
                    <input name="brand" placeholder="e.g. Bosch" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Quantity</label>
                    <input name="quantity" type="number" defaultValue="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unit</label>
                    <input name="unit" defaultValue="UNIT" placeholder="UNIT" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Kondisi Awal</label>
                    <select name="condition" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
                      <option value="BAIK">Kondisi Baik (Ready)</option>
                      <option value="RUSAK">Rusak (Maintenance)</option>
                      <option value="HILANG">Hilang / Idle</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-3 bg-accent hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Simpan Ke Spreadsheet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Loan Modal */}
      <AnimatePresence>
        {isAddLoanModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsAddLoanModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{editingLoan ? 'Edit Data Peminjaman' : 'Input Data Peminjaman'}</h2>
                  <p className="text-xs text-slate-500 font-medium tracking-tight">
                    {editingLoan ? 'Ubah rincian peminjaman tools' : 'Catat peminjaman tools baru'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsAddLoanModalOpen(false);
                    setEditingLoan(null);
                  }} 
                  className="p-2 text-slate-400 hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form 
                className="p-8 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleAddLoan(Object.fromEntries(formData.entries()));
                }}
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Jobsite</label>
                  <select 
                    name="jobsite" 
                    required 
                    defaultValue={editingLoan?.jobsite || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  >
                    <option value="" disabled>Pilih Jobsite</option>
                    {jobsites.filter(s => s !== 'All Jobsites').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tgl Pinjam</label>
                  <input 
                    name="loanDate" 
                    type="date" 
                    required 
                    defaultValue={editingLoan?.loanDate || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nama Peminjam</label>
                  <input 
                    name="borrowerName" 
                    required 
                    placeholder="Nama lengkap" 
                    defaultValue={editingLoan?.borrowerName || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">No Reg Tools</label>
                  <input 
                    name="registerNo" 
                    required 
                    placeholder="E.g. REG-001" 
                    defaultValue={editingLoan?.registerNo || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nama Tools</label>
                  <input 
                    name="toolName" 
                    required 
                    placeholder="E.g. Drill Machine" 
                    defaultValue={editingLoan?.toolName || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingLoan?.status || 'DIPINJAM'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="DIPINJAM">DIPINJAM</option>
                    <option value="DIKEMBALIKAN">DIKEMBALIKAN</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAddLoanModalOpen(false);
                      setEditingLoan(null);
                    }} 
                    className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button type="submit" className="flex-[2] py-3 bg-accent text-white font-bold rounded-xl shadow-lg shadow-accent/20">
                    {editingLoan ? 'Update Data' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
