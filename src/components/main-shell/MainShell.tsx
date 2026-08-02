'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './main-shell.module.css';
import { useOrganizationLogout, useGetOrganizationById } from '@/services/organization/useOrganization';
import { getRefreshToken, removeTokens } from '@/services/organization/organization.service';
import { getOrganizationId } from '@/lib/api-client';
import React, { useEffect, useState, useRef, type ComponentType } from 'react';
import {
  Menu,
  X,
  ChevronDown,
  Bell,
  LayoutDashboard,
  Shield,
  Users,
  Building2,
  FolderKanban,
  ListTodo,
  Target,
  TrendingUp,
  BarChart3,
  GraduationCap,
  ClipboardList,
  CalendarCheck,
  Wallet,
  HeartPulse,
  Scale,
  Award,
  Settings,
  Search,
  type LucideProps,
} from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import LoadingIndicator from '@/components/LoadingIndicator';

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<LucideProps>;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Organization',
    items: [
      { label: 'Roles', href: '/roles', icon: Shield },
      { label: 'Users', href: '/users', icon: Users },
      { label: 'Departments', href: '/departments', icon: Building2 },
    ],
  },
  {
    label: 'Work',
    items: [
      { label: 'Projects', href: '/projects', icon: FolderKanban },
      { label: 'Tasks', href: '/tasks', icon: ListTodo },
      { label: 'Goals', href: '/goals', icon: Target },
      { label: 'Progress', href: '/progress-tracking', icon: TrendingUp },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Performance', href: '/performance', icon: Award },
      { label: 'Attendance', href: '/attendance', icon: CalendarCheck },
      { label: 'Wellness', href: '/wellness', icon: HeartPulse },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Payroll', href: '/payroll', icon: Wallet },
      { label: 'Compliance', href: '/compliance', icon: Scale },
      { label: 'Learning', href: '/learning', icon: GraduationCap, exact: true },
      { label: 'Enrollments', href: '/learning/enrollments', icon: ClipboardList },
    ],
  },
];

const secondaryNavItems: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

type MainShellProps = {
  children: React.ReactNode;
};

function isActivePath(currentPath: string, targetPath: string, exact?: boolean) {
  if (exact) return currentPath === targetPath;
  if (targetPath === '/dashboard') return currentPath === '/dashboard';
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function NavLinks({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className={styles.navList}>
      {items.map((item) => {
        const active = isActivePath(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`.trim()}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={17} className={styles.navIconLucide} strokeWidth={active ? 2.25 : 1.85} aria-hidden />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function MainShell({ children }: MainShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const logoutMutation = useOrganizationLogout();

  const allJumpItems = [...navGroups.flatMap((g) => g.items), ...secondaryNavItems];

  useEffect(() => {
    setOrgId(getOrganizationId());
  }, []);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsMobileSidebarOpen(false);
      }
    };
    if (isMobileSidebarOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileDropdownOpen]);

  const { data, isLoading } = useGetOrganizationById(orgId || '');

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await logoutMutation.mutateAsync(refreshToken);
    } catch {
      // Tokens cleared in mutation finally / onError
    } finally {
      removeTokens();
      router.push('/sign-in');
    }
  };

  const orgName = data?.data?.name || 'Organization';
  const orgInitials = orgName
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'OR';

  return (
    <div className={styles.pageShell}>
      {isMobileSidebarOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      ) : null}

      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.sidebarOpen : ''}`}
      >
        <div className={styles.sidebarTop}>
          <div className={styles.brandWrap}>
            <Link href="/dashboard" className={styles.brandLink} aria-label="Work Pulse AI — Dashboard">
              <span className={styles.brandMark} aria-hidden>
                <span className={styles.brandCore} />
              </span>
              <span className={styles.brandWordmark}>
                <span className={styles.brandName}>Work Pulse</span>
                <span className={styles.brandAi}>AI</span>
              </span>
            </Link>
          </div>

          <nav className={styles.sidebarNav} aria-label="Main">
            {navGroups.map((group) => (
              <div key={group.label} className={styles.navGroup}>
                <p className={styles.navGroupLabel}>{group.label}</p>
                <NavLinks items={group.items} pathname={pathname} />
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <nav aria-label="Secondary">
            <NavLinks items={secondaryNavItems} pathname={pathname} />
          </nav>
        </div>
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.topbar}>
          <button
            className={styles.hamburgerButton}
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="Toggle sidebar"
            type="button"
          >
            {isMobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <label className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} aria-hidden />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Jump to a page…"
              list="main-nav-jump"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const q = (e.target as HTMLInputElement).value.trim().toLowerCase();
                const match = allJumpItems.find(
                  (item) =>
                    item.label.toLowerCase().includes(q) || item.href.toLowerCase().includes(q)
                );
                if (match) {
                  router.push(match.href);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <datalist id="main-nav-jump">
              {allJumpItems.map((item) => (
                <option key={item.href} value={item.label} />
              ))}
            </datalist>
          </label>

          <div className={styles.topbarRight}>
            <ThemeSwitcher />
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => router.push('/notifications')}
              aria-label="Notifications"
            >
              <Bell size={18} aria-hidden />
            </button>

            <div className={styles.userWrap} ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className={styles.profileTrigger}
                type="button"
                aria-haspopup="menu"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className={styles.profileMeta}>
                  <p className={styles.userName}>
                    {isLoading ? (
                      <LoadingIndicator label="Loading" variant="inline" />
                    ) : (
                      orgName
                    )}
                  </p>
                  <p className={styles.userRole}>
                    {isLoading ? '' : data?.data?.organization_type || 'Workspace'}
                  </p>
                </div>
                <span className={styles.avatar} aria-hidden>
                  {orgInitials}
                </span>
                <ChevronDown
                  className={styles.profileChevron}
                  size={16}
                  style={{ transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {isProfileDropdownOpen && (
                <div className={styles.profileDropdown} role="menu">
                  <button
                    type="button"
                    className={styles.profileMenuItem}
                    onClick={() => {
                      router.push('/organization');
                      setIsProfileDropdownOpen(false);
                    }}
                  >
                    Organization
                  </button>
                  <button
                    type="button"
                    className={styles.profileMenuItem}
                    onClick={() => {
                      router.push('/settings');
                      setIsProfileDropdownOpen(false);
                    }}
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    className={`${styles.profileMenuItem} ${styles.profileMenuItemDanger}`}
                    onClick={() => {
                      handleLogout();
                      setIsProfileDropdownOpen(false);
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
