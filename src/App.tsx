import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import {
  Monitor, Users, Cpu, MemoryStick, Wifi,
  Power, RotateCcw, MessageSquare, Brain, ChevronRight,
  Server, Activity, Clock, Shield, Zap, AlertTriangle,
  CheckCircle2, Info, TrendingUp,
} from 'lucide-react';
import type { Session, Insight, ServerNode } from './data';
import {
  generateSessions, generateMetricsHistory, advanceMetrics,
  generateInsights, generateServers,
} from './data';

// ── Loading Skeleton ───────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-mesh text-slate-300 font-sans">
      {/* Header skeleton */}
      <header className="header-glass border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center gap-3">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div>
            <div className="skeleton w-28 h-3.5 mb-1.5" />
            <div className="skeleton w-36 h-2.5" />
          </div>
        </div>
      </header>
      <div className="max-w-[1600px] mx-auto px-6 py-5">
        {/* Stat card skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card border border-slate-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <div className="skeleton w-20 h-2.5 mb-2" />
                  <div className="skeleton w-16 h-6 mb-1.5" />
                  <div className="skeleton w-24 h-2.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Chart skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="glass-card border border-slate-800 rounded-xl p-4">
              <div className="skeleton w-40 h-4 mb-4" />
              <div className="skeleton w-full h-[180px]" />
            </div>
          ))}
        </div>
        {/* Table skeleton */}
        <div className="glass-card border border-slate-800 rounded-xl p-4">
          <div className="skeleton w-32 h-4 mb-4" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton w-full h-10 mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Cpu; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="glass-card border border-slate-800 rounded-xl p-4 flex items-start gap-3 card-glow animate-fade-in-up opacity-0">
      <div className={`p-2.5 rounded-lg ${color} shadow-lg`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5 tracking-tight flash-update">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }: { status: Session['status'] }) {
  const cfg = {
    active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', ring: 'shadow-emerald-500/20', label: 'Active' },
    idle: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400', ring: 'shadow-amber-500/20', label: 'Idle' },
    disconnected: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400', ring: 'shadow-red-500/20', label: 'Disconnected' },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} shadow-sm ${cfg.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'active' ? 'animate-pulse-dot' : ''} shadow-sm`} />
      {cfg.label}
    </span>
  );
}

// ── Server Row ─────────────────────────────────────────────
function ServerRow({ server }: { server: ServerNode }) {
  const statusColor = server.status === 'healthy' ? 'text-emerald-400' :
                      server.status === 'warning' ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0 transition-all duration-200 hover:bg-slate-800/20 rounded px-1 -mx-1">
      <div className="flex items-center gap-2.5">
        <Server size={14} className={`${statusColor} transition-colors duration-300`} />
        <span className="text-sm font-medium text-slate-200">{server.name}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
        <span>CPU {server.cpu}%</span>
        <span>RAM {server.memory}%</span>
        <span>{server.sessions} sess</span>
      </div>
    </div>
  );
}

// ── Insight Card ───────────────────────────────────────────
function InsightCard({ insight, onAction }: { insight: Insight; onAction: () => void }) {
  const icon = insight.severity === 'critical' ? <AlertTriangle size={16} className="text-red-400" /> :
               insight.severity === 'warning' ? <AlertTriangle size={16} className="text-amber-400" /> :
               <Info size={16} className="text-blue-400" />;

  const borderColor = insight.severity === 'critical' ? 'border-l-red-500' :
                      insight.severity === 'warning' ? 'border-l-amber-500' : 'border-l-blue-500';

  const glowColor = insight.severity === 'critical' ? 'hover:shadow-red-500/5' :
                    insight.severity === 'warning' ? 'hover:shadow-amber-500/5' : 'hover:shadow-blue-500/5';

  return (
    <div className={`glass-card border border-slate-800 border-l-2 ${borderColor} rounded-lg p-3.5 mb-2.5 transition-all duration-300 hover:shadow-lg ${glowColor}`}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-200 leading-snug">{insight.title}</p>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{insight.description}</p>
          <div className="flex items-center justify-between mt-2.5">
            <button
              onClick={onAction}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-all duration-200 hover:gap-2"
            >
              {insight.action} <ChevronRight size={12} />
            </button>
            <span className="text-[10px] text-slate-600">{insight.timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Usage Bar ──────────────────────────────────────────────
function UsageBar({ value, color }: { value: number; color: string }) {
  const pct = Math.min(value, 100);
  return (
    <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [metrics, setMetrics] = useState(() => generateMetricsHistory());
  const [insights, setInsights] = useState<Insight[]>([]);
  const [servers, setServers] = useState<ServerNode[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'idle' | 'disconnected'>('all');

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      const s = generateSessions();
      setSessions(s);
      setInsights(generateInsights(s));
      setServers(generateServers());
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Live metric updates every 5s
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setMetrics(prev => advanceMetrics(prev));
    }, 5000);
    return () => clearInterval(interval);
  }, [loading]);

  // Session refresh every 12s
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      const newSessions = generateSessions();
      setSessions(newSessions);
      setInsights(generateInsights(newSessions));
      setServers(generateServers());
    }, 12000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleAction = useCallback((action: string, session: Session) => {
    const messages: Record<string, string> = {
      disconnect: `Session ${session.id} (${session.user}) disconnected`,
      restart: `Restarting session ${session.id} on ${session.hostname}...`,
      message: `Notification sent to ${session.user}`,
    };
    toast.success(messages[action] || 'Action completed', {
      style: {
        background: 'rgba(30, 36, 51, 0.95)',
        color: '#e2e8f0',
        border: '1px solid #334155',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      iconTheme: { primary: '#22d3ee', secondary: '#0b0e14' },
    });
  }, []);

  const handleInsightAction = useCallback((insight: Insight) => {
    toast.success(`${insight.action}: processing...`, {
      style: {
        background: 'rgba(30, 36, 51, 0.95)',
        color: '#e2e8f0',
        border: '1px solid #334155',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      iconTheme: { primary: '#22d3ee', secondary: '#0b0e14' },
    });
  }, []);

  if (loading) return <DashboardSkeleton />;

  const filteredSessions = selectedTab === 'all' ? sessions :
    sessions.filter(s => s.status === selectedTab);

  const activeCount = sessions.filter(s => s.status === 'active').length;
  const idleCount = sessions.filter(s => s.status === 'idle').length;
  const disconnectedCount = sessions.filter(s => s.status === 'disconnected').length;
  const connectedSessions = sessions.filter(s => s.status !== 'disconnected');
  const avgCpu = connectedSessions.length > 0
    ? connectedSessions.reduce((a, b) => a + b.cpu, 0) / connectedSessions.length : 0;
  const avgMem = connectedSessions.length > 0
    ? connectedSessions.reduce((a, b) => a + b.memory, 0) / connectedSessions.length : 0;

  const latestMetric = metrics[metrics.length - 1];

  return (
    <div className="min-h-screen bg-gradient-mesh text-slate-300 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{ duration: 3000 }}
      />

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="header-glass border-b border-slate-800/80 sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Monitor size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none tracking-tight">OVD Enterprise</h1>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5 font-medium tracking-wide">Administration Console</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot shadow-sm shadow-emerald-400/50" />
              Live
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {' '}{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-cyan-500/20">
              AS
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-5 flex gap-5">

        {/* ── Main Content ─────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 stagger-children">
            <StatCard icon={Users} label="Total Sessions" value={sessions.length} sub={`${activeCount} active`} color="bg-cyan-500/15 text-cyan-400" />
            <StatCard icon={Cpu} label="Avg CPU" value={`${avgCpu.toFixed(1)}%`} sub="across active hosts" color="bg-violet-500/15 text-violet-400" />
            <StatCard icon={MemoryStick} label="Avg Memory" value={`${avgMem.toFixed(1)}%`} sub={`${(avgMem * 0.32).toFixed(1)} GB used`} color="bg-amber-500/15 text-amber-400" />
            <StatCard icon={Activity} label="Network I/O" value={`${latestMetric.network} Mbps`} sub="total throughput" color="bg-emerald-500/15 text-emerald-400" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
            {/* CPU & Memory Chart */}
            <div className="glass-card border border-slate-800 rounded-xl p-4 card-glow animate-fade-in-up opacity-0" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <TrendingUp size={14} className="text-cyan-400" /> Resource Utilization
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">Last 30 min</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={metrics} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569' }} interval={4} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(30,36,51,0.95)', border: '1px solid #334155', borderRadius: 8, fontSize: 12, backdropFilter: 'blur(12px)' }}
                    cursor={{ stroke: '#334155', strokeDasharray: '3 3' }}
                  />
                  <Area type="monotone" dataKey="cpu" stroke="#22d3ee" fill="url(#cpuGrad)" strokeWidth={2} name="CPU %" dot={false} animationDuration={800} />
                  <Area type="monotone" dataKey="memory" stroke="#a78bfa" fill="url(#memGrad)" strokeWidth={2} name="Memory %" dot={false} animationDuration={800} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center">
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium"><span className="w-2.5 h-0.5 bg-cyan-400 rounded" /> CPU</span>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium"><span className="w-2.5 h-0.5 bg-violet-400 rounded" /> Memory</span>
              </div>
            </div>

            {/* Sessions Over Time */}
            <div className="glass-card border border-slate-800 rounded-xl p-4 card-glow animate-fade-in-up opacity-0" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Users size={14} className="text-cyan-400" /> Active Sessions
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">Last 30 min</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={metrics} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569' }} interval={4} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} domain={[0, 30]} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(30,36,51,0.95)', border: '1px solid #334155', borderRadius: 8, fontSize: 12, backdropFilter: 'blur(12px)' }}
                    cursor={{ fill: 'rgba(34, 211, 238, 0.05)' }}
                  />
                  <Bar dataKey="sessions" fill="#22d3ee" radius={[3, 3, 0, 0]} name="Sessions" opacity={0.8} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Session Table */}
          <div className="glass-card border border-slate-800 rounded-xl overflow-hidden card-glow animate-fade-in-up opacity-0" style={{ animationDelay: '400ms' }}>
            {/* Table header with tabs */}
            <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Monitor size={14} className="text-cyan-400" /> VDI Sessions
              </h3>
              <div className="flex gap-1">
                {([
                  ['all', `All (${sessions.length})`],
                  ['active', `Active (${activeCount})`],
                  ['idle', `Idle (${idleCount})`],
                  ['disconnected', `Disc. (${disconnectedCount})`],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTab(key)}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-200
                      ${selectedTab === key
                        ? 'bg-cyan-500/15 text-cyan-400 shadow-sm shadow-cyan-500/10'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800/60">
                    <th className="px-4 py-2.5 font-semibold">User</th>
                    <th className="px-4 py-2.5 font-semibold">Host</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">CPU</th>
                    <th className="px-4 py-2.5 font-semibold">Memory</th>
                    <th className="px-4 py-2.5 font-semibold">Duration</th>
                    <th className="px-4 py-2.5 font-semibold">Last Activity</th>
                    <th className="px-4 py-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map(session => (
                    <tr key={session.id} className="border-b border-slate-800/30 session-row">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 shadow-inner">
                            {session.user.split('.').map(n => n[0].toUpperCase()).join('')}
                          </div>
                          <div>
                            <p className="text-sm text-slate-200 font-medium">{session.user}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{session.ip}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-sm text-slate-300 font-medium">{session.hostname}</p>
                        <p className="text-[10px] text-slate-500">{session.os}</p>
                      </td>
                      <td className="px-4 py-2.5"><StatusBadge status={session.status} /></td>
                      <td className="px-4 py-2.5">
                        <div className="w-20">
                          <p className="text-sm text-slate-300 mb-1 font-mono font-medium">{session.cpu}%</p>
                          <UsageBar value={session.cpu} color={session.cpu > 80 ? 'bg-red-500' : session.cpu > 50 ? 'bg-amber-500' : 'bg-cyan-500'} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="w-20">
                          <p className="text-sm text-slate-300 mb-1 font-mono font-medium">{session.memory}%</p>
                          <UsageBar value={session.memory} color={session.memory > 75 ? 'bg-red-500' : session.memory > 50 ? 'bg-violet-500' : 'bg-cyan-500'} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm text-slate-300 flex items-center gap-1.5 font-medium">
                          <Clock size={12} className="text-slate-500" /> {session.duration}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-400">{session.lastActivity}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleAction('disconnect', session)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:shadow-sm hover:shadow-red-500/10"
                            title="Disconnect session"
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => handleAction('restart', session)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-200 hover:shadow-sm hover:shadow-amber-500/10"
                            title="Restart session"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            onClick={() => handleAction('message', session)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-200 hover:shadow-sm hover:shadow-cyan-500/10"
                            title="Send message"
                          >
                            <MessageSquare size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ────────────────────────────────── */}
        <aside className="w-[320px] shrink-0 hidden xl:block space-y-4 animate-slide-in-right opacity-0">

          {/* AI Insights */}
          <div className="glass-card border border-slate-800 rounded-xl p-4 card-glow">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
              <div className="p-1 rounded bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                <Brain size={14} className="text-cyan-400" />
              </div>
              AI Insights
              <span className="ml-auto text-[10px] text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full font-semibold shadow-sm shadow-cyan-500/10">
                {insights.filter(i => i.severity !== 'info').length} alerts
              </span>
            </h3>
            <div className="space-y-0">
              {insights.map(insight => (
                <InsightCard key={insight.id} insight={insight} onAction={() => handleInsightAction(insight)} />
              ))}
            </div>
          </div>

          {/* Server Fleet */}
          <div className="glass-card border border-slate-800 rounded-xl p-4 card-glow">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
              <Server size={14} className="text-cyan-400" /> Server Fleet
            </h3>
            {servers.map(server => (
              <ServerRow key={server.name} server={server} />
            ))}
          </div>

          {/* System Status */}
          <div className="glass-card border border-slate-800 rounded-xl p-4 card-glow">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
              <Shield size={14} className="text-cyan-400" /> System Status
            </h3>
            <div className="space-y-2.5">
              {[
                { icon: CheckCircle2, label: 'Session Manager', value: 'Healthy', color: 'text-emerald-400' },
                { icon: CheckCircle2, label: 'File Server', value: 'Healthy', color: 'text-emerald-400' },
                { icon: CheckCircle2, label: 'Web Gateway', value: 'Healthy', color: 'text-emerald-400' },
                { icon: Zap, label: 'Avg Latency', value: '12ms', color: 'text-cyan-400' },
                { icon: Wifi, label: 'Bandwidth', value: `${latestMetric.network} Mbps`, color: 'text-violet-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs py-1 transition-colors duration-200 hover:bg-slate-800/20 rounded px-1 -mx-1">
                  <span className="text-slate-400 flex items-center gap-2 font-medium">
                    <item.icon size={12} className={item.color} /> {item.label}
                  </span>
                  <span className={`font-semibold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 mt-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between text-[10px] text-slate-600 font-medium">
          <span>OVD Enterprise v4.8.2 | Inuvika Inc.</span>
          <span>Demo Console | Simulated Data</span>
        </div>
      </footer>
    </div>
  );
}
