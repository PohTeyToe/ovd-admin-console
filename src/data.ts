// Simulated VDI session data with realistic values

export interface Session {
  id: string;
  user: string;
  hostname: string;
  status: 'active' | 'idle' | 'disconnected';
  cpu: number;
  memory: number;
  duration: string;
  lastActivity: string;
  os: string;
  ip: string;
}

export interface MetricPoint {
  time: string;
  cpu: number;
  memory: number;
  sessions: number;
  network: number;
}

export interface Insight {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  action: string;
  timestamp: string;
}

const USERS = [
  'j.morrison', 'd.chen', 's.patel', 'm.kowalski', 'a.thompson',
  'r.nakamura', 'l.dubois', 'k.okonkwo', 'e.martinez', 'p.andersson',
  'c.williams', 'n.bergström', 'h.watanabe', 'f.rossi', 'b.kumar',
  't.nguyen', 'v.popov', 'g.silva', 'w.zhang', 'i.schmidt',
];

const HOSTNAMES = [
  'VDI-PC-001', 'VDI-PC-002', 'VDI-PC-003', 'VDI-PC-004', 'VDI-PC-005',
  'VDI-PC-006', 'VDI-PC-007', 'VDI-PC-008', 'VDI-PC-009', 'VDI-PC-010',
  'VDI-PC-011', 'VDI-PC-012', 'VDI-PC-013', 'VDI-PC-014', 'VDI-PC-015',
];

const OS_TYPES = [
  'Windows 11 Pro', 'Windows 11 Pro', 'Windows 11 Pro',
  'Windows 10 Enterprise', 'Windows 10 Enterprise',
  'Ubuntu 22.04 LTS', 'Windows Server 2022',
];

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function timeAgo(minutes: number): string {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  return `${h}h ${minutes % 60}m ago`;
}

export function generateSessions(): Session[] {
  const count = 12 + Math.floor(Math.random() * 4);
  const used = new Set<number>();

  return Array.from({ length: count }, (_, i) => {
    let idx: number;
    do { idx = Math.floor(Math.random() * USERS.length); } while (used.has(idx));
    used.add(idx);

    const statusRoll = Math.random();
    const status: Session['status'] =
      statusRoll < 0.55 ? 'active' :
      statusRoll < 0.82 ? 'idle' : 'disconnected';

    const cpu = status === 'active' ? randomBetween(15, 85) :
                status === 'idle' ? randomBetween(1, 12) : 0;
    const memory = status === 'disconnected' ? 0 :
                   randomBetween(30, 78);

    const durationMin = Math.floor(Math.random() * 480) + 10;
    const lastActivityMin = status === 'active' ? Math.floor(Math.random() * 3) :
                            status === 'idle' ? Math.floor(Math.random() * 90) + 15 :
                            Math.floor(Math.random() * 180) + 30;

    return {
      id: `SES-${String(1000 + i).slice(1)}`,
      user: USERS[idx],
      hostname: HOSTNAMES[i % HOSTNAMES.length],
      status,
      cpu,
      memory,
      duration: formatDuration(durationMin),
      lastActivity: timeAgo(lastActivityMin),
      os: OS_TYPES[Math.floor(Math.random() * OS_TYPES.length)],
      ip: `10.0.${Math.floor(Math.random() * 4) + 1}.${Math.floor(Math.random() * 200) + 10}`,
    };
  });
}

export function generateMetricsHistory(): MetricPoint[] {
  const points: MetricPoint[] = [];
  let cpu = 45;
  let memory = 58;
  let sessions = 14;
  let network = 320;

  for (let i = 29; i >= 0; i--) {
    const t = new Date(Date.now() - i * 60000);
    const label = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    cpu = Math.max(10, Math.min(95, cpu + (Math.random() - 0.48) * 8));
    memory = Math.max(30, Math.min(90, memory + (Math.random() - 0.5) * 4));
    sessions = Math.max(5, Math.min(25, sessions + Math.round((Math.random() - 0.5) * 3)));
    network = Math.max(100, Math.min(800, network + (Math.random() - 0.5) * 80));

    points.push({
      time: label,
      cpu: Math.round(cpu * 10) / 10,
      memory: Math.round(memory * 10) / 10,
      sessions,
      network: Math.round(network),
    });
  }
  return points;
}

export function advanceMetrics(prev: MetricPoint[]): MetricPoint[] {
  const last = prev[prev.length - 1];
  const t = new Date();
  const label = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const cpu = Math.max(10, Math.min(95, last.cpu + (Math.random() - 0.48) * 8));
  const memory = Math.max(30, Math.min(90, last.memory + (Math.random() - 0.5) * 4));
  const sessions = Math.max(5, Math.min(25, last.sessions + Math.round((Math.random() - 0.5) * 3)));
  const network = Math.max(100, Math.min(800, last.network + (Math.random() - 0.5) * 80));

  return [
    ...prev.slice(1),
    {
      time: label,
      cpu: Math.round(cpu * 10) / 10,
      memory: Math.round(memory * 10) / 10,
      sessions,
      network: Math.round(network),
    },
  ];
}

export function generateInsights(sessions: Session[]): Insight[] {
  const idle = sessions.filter(s => s.status === 'idle');
  const disconnected = sessions.filter(s => s.status === 'disconnected');
  const highCpu = sessions.filter(s => s.cpu > 70);
  const highMem = sessions.filter(s => s.memory > 70);
  const active = sessions.filter(s => s.status === 'active');

  const insights: Insight[] = [];
  const now = new Date();
  const ts = (min: number) => new Date(now.getTime() - min * 60000)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (idle.length >= 2) {
    insights.push({
      id: 'idle-sessions',
      severity: 'warning',
      title: `${idle.length} sessions idle > 15 min`,
      description: `Users ${idle.slice(0, 3).map(s => s.user).join(', ')}${idle.length > 3 ? ` +${idle.length - 3} more` : ''} have been idle. Releasing these sessions would free ~${(idle.length * 2.1).toFixed(1)} GB RAM.`,
      action: 'Send idle warning',
      timestamp: ts(2),
    });
  }

  if (disconnected.length >= 1) {
    insights.push({
      id: 'disconnected',
      severity: 'info',
      title: `${disconnected.length} disconnected session${disconnected.length > 1 ? 's' : ''} pending cleanup`,
      description: `Orphaned sessions on ${disconnected.map(s => s.hostname).join(', ')} are consuming host resources. Auto-cleanup recommended.`,
      action: 'Clean up sessions',
      timestamp: ts(5),
    });
  }

  if (highCpu.length >= 1) {
    const worst = highCpu.reduce((a, b) => a.cpu > b.cpu ? a : b);
    insights.push({
      id: 'cpu-spike',
      severity: 'critical',
      title: `${worst.hostname} at ${worst.cpu}% CPU`,
      description: `User ${worst.user} is driving heavy compute load. Predicted to reach 92% within 12 minutes based on trend analysis. Consider load-balancing or throttling.`,
      action: 'View process details',
      timestamp: ts(1),
    });
  }

  if (highMem.length >= 2) {
    insights.push({
      id: 'memory-pressure',
      severity: 'warning',
      title: `Memory pressure on ${highMem.length} sessions`,
      description: `Average memory at ${(highMem.reduce((a, b) => a + b.memory, 0) / highMem.length).toFixed(0)}% across affected sessions. Consider increasing allocation or migrating to higher-spec hosts.`,
      action: 'Review allocations',
      timestamp: ts(8),
    });
  }

  insights.push({
    id: 'capacity',
    severity: 'info',
    title: 'Capacity forecast: healthy',
    description: `Current ${active.length} active sessions represent ${Math.round(active.length / 25 * 100)}% of peak capacity. No scaling action needed for the next 2 hours.`,
    action: 'View forecast',
    timestamp: ts(15),
  });

  insights.push({
    id: 'licensing',
    severity: 'info',
    title: `License utilization: ${sessions.length}/50 seats`,
    description: `${Math.round(sessions.length / 50 * 100)}% of OVD Enterprise licenses in use. ${50 - sessions.length} seats available for new connections.`,
    action: 'View license report',
    timestamp: ts(30),
  });

  insights.push({
    id: 'login-pattern',
    severity: 'info',
    title: 'Login pattern: 09:00 surge expected',
    description: `Historical telemetry shows a 42% spike in concurrent sessions between 08:55 and 09:15. Pre-warming ${Math.min(6, Math.max(2, Math.round(sessions.length / 4)))} hosts would cut median login time by 3.1s.`,
    action: 'Schedule pre-warm',
    timestamp: ts(18),
  });

  insights.push({
    id: 'gpu-candidate',
    severity: 'info',
    title: 'GPU acceleration candidates detected',
    description: `3 sessions show sustained 60%+ CPU on graphics workloads. Migrating ${active.slice(0, 3).map(s => s.user).join(', ') || 'top users'} to vGPU pool would reduce render latency by ~38%.`,
    action: 'Review vGPU fit',
    timestamp: ts(22),
  });

  insights.push({
    id: 'security-scan',
    severity: 'warning',
    title: 'Unusual after-hours connection attempt',
    description: `2 failed logins from 10.0.4.87 at 03:14 UTC outside normal pattern. Source IP not in trusted range. Recommend enabling step-up MFA for affected accounts.`,
    action: 'Review audit log',
    timestamp: ts(45),
  });

  return insights;
}

// 7-day drill-down history for chart modal
export interface HistoryPoint {
  day: string;
  cpu: number;
  memory: number;
  sessions: number;
  network: number;
}

export function generateSevenDayHistory(metric: 'cpu' | 'memory'): HistoryPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const baseCpu = [48, 62, 71, 58, 69, 34, 28];
  const baseMem = [55, 64, 72, 66, 74, 48, 42];
  const baseSessions = [18, 22, 24, 21, 23, 9, 7];
  const baseNetwork = [340, 420, 510, 460, 495, 220, 180];

  return days.map((d, i) => {
    const jitter = (Math.random() - 0.5) * 6;
    return {
      day: d,
      cpu: Math.round((baseCpu[i] + jitter) * 10) / 10,
      memory: Math.round((baseMem[i] + jitter * 0.7) * 10) / 10,
      sessions: baseSessions[i],
      network: Math.round(baseNetwork[i] + jitter * 10),
    };
  }).map((point) => {
    // Emphasize the clicked metric with slightly sharper variance
    if (metric === 'cpu') point.cpu = Math.min(95, point.cpu + 2);
    if (metric === 'memory') point.memory = Math.min(90, point.memory + 2);
    return point;
  });
}

// Server status data
export interface ServerNode {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  sessions: number;
  uptime: string;
}

export function generateServers(): ServerNode[] {
  return [
    { name: 'OVD-HV-01', status: 'healthy', cpu: randomBetween(25, 45), memory: randomBetween(40, 60), sessions: Math.floor(Math.random() * 6) + 3, uptime: '14d 7h' },
    { name: 'OVD-HV-02', status: 'healthy', cpu: randomBetween(30, 55), memory: randomBetween(45, 65), sessions: Math.floor(Math.random() * 6) + 3, uptime: '14d 7h' },
    { name: 'OVD-HV-03', status: Math.random() > 0.7 ? 'warning' : 'healthy', cpu: randomBetween(50, 82), memory: randomBetween(55, 78), sessions: Math.floor(Math.random() * 5) + 4, uptime: '6d 12h' },
    { name: 'OVD-SM-01', status: 'healthy', cpu: randomBetween(10, 30), memory: randomBetween(25, 45), sessions: 0, uptime: '14d 7h' },
  ];
}
