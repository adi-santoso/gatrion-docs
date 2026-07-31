// Project configuration
export interface ProjectConfig {
  id: string;
  name: string;
  version: string;
  status: 'stable' | 'beta' | 'draft';
  icon: string;
  color: string;
  firstDocPath: string;
}

export const projects: ProjectConfig[] = [
  {
    id: 'core-api',
    name: 'Core API',
    version: 'v2.4.0',
    status: 'stable',
    icon: 'server',
    color: 'violet',
    firstDocPath: '/docs/core-api/getting-started/',
  },
  {
    id: 'web-dashboard',
    name: 'Web Dashboard',
    version: 'v1.9.2',
    status: 'stable',
    icon: 'monitor',
    color: 'cyan',
    firstDocPath: '/docs/web-dashboard/overview/',
  },
  {
    id: 'mobile-sdk',
    name: 'Mobile SDK',
    version: 'v1.2.0',
    status: 'stable',
    icon: 'smartphone',
    color: 'fuchsia',
    firstDocPath: '/docs/mobile-sdk/getting-started/',
  },
  {
    id: 'payment-service',
    name: 'Payment Service',
    version: 'v3.1.0',
    status: 'stable',
    icon: 'credit-card',
    color: 'emerald',
    firstDocPath: '#',
  },
  {
    id: 'cli-tools',
    name: 'CLI Tools',
    version: 'v0.3.0',
    status: 'beta',
    icon: 'terminal',
    color: 'orange',
    firstDocPath: '#',
  },
  {
    id: 'design-system',
    name: 'Design System',
    version: 'v2.0.0',
    status: 'stable',
    icon: 'palette',
    color: 'rose',
    firstDocPath: '#',
  },
];

export function getProjectByName(name: string): ProjectConfig | undefined {
  return projects.find(p => p.name === name);
}

export function getProjectById(id: string): ProjectConfig | undefined {
  return projects.find(p => p.id === id);
}

export const projectColors = {
  violet: {
    dot: 'bg-violet-500',
    ring: 'ring-violet-500/20',
    gradient: 'from-violet-500/15 to-fuchsia-500/15',
    text: 'text-violet-500',
  },
  cyan: {
    dot: 'bg-cyan-500',
    ring: 'ring-cyan-500/20',
    gradient: 'from-cyan-500/15 to-blue-500/15',
    text: 'text-cyan-500',
  },
  fuchsia: {
    dot: 'bg-fuchsia-500',
    ring: 'ring-fuchsia-500/20',
    gradient: 'from-fuchsia-500/15 to-pink-500/15',
    text: 'text-fuchsia-500',
  },
  emerald: {
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/20',
    gradient: 'from-emerald-500/15 to-teal-500/15',
    text: 'text-emerald-500',
  },
  orange: {
    dot: 'bg-orange-500',
    ring: 'ring-orange-500/20',
    gradient: 'from-orange-500/15 to-amber-500/15',
    text: 'text-orange-500',
  },
  rose: {
    dot: 'bg-rose-500',
    ring: 'ring-rose-500/20',
    gradient: 'from-rose-500/15 to-pink-500/15',
    text: 'text-rose-500',
  },
};
