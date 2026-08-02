'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './main-shell.module.css';
import { useOrganizationLogout } from '@/services/organization/useOrganization';
import { getRefreshToken, removeTokens } from '@/services/organization/organization.service';
import { useRouter } from 'next/navigation';
import { useGetOrganizationById } from '@/services/organization/useOrganization';
import { getOrganizationId } from '@/lib/api-client';
import React, { useEffect, useState, useRef } from 'react';
import { Menu, X, ChevronDown, Bell } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const mainNavItems = [
  { label: 'Dashboard', href: '/dashboard', iconHref: '/icons/dashboard.svg' },
  { label: 'Roles', href: '/roles', iconHref: '/icons/roles.svg' },
  { label: 'Users', href: '/users', iconHref: '/icons/organization.svg' },
  { label: 'Departments', href: '/departments', iconHref: '/icons/departments.svg' },
  { label: 'Projects', href: '/projects', iconHref: '/icons/projects.svg' },
  { label: 'Tasks', href: '/tasks', iconHref: '/icons/goals.svg' },
  { label: 'Goals', href: '/goals', iconHref: '/icons/goals.svg' },
  { label: 'Progress', href: '/progress-tracking', iconHref: '/icons/dashboard.svg' },
  { label: 'Analytics', href: '/analytics', iconHref: '/icons/dashboard.svg' },
  { label: 'Learning', href: '/learning', iconHref: '/icons/learning.svg', exact: true },
  { label: 'Enrollments', href: '/learning/enrollments', iconHref: '/icons/learning.svg' },
  { label: 'Attendance', href: '/attendance', iconHref: '/icons/dashboard.svg' },
  { label: 'Payroll', href: '/payroll', iconHref: '/icons/goals.svg' },
  { label: 'Wellness', href: '/wellness', iconHref: '/icons/dashboard.svg' },
  { label: 'Compliance', href: '/compliance', iconHref: '/icons/roles.svg' },
  { label: 'Performance', href: '/performance', iconHref: '/icons/goals.svg' },
];

const secondaryNavItems = [
  { label: 'Settings', href: '/settings', iconHref: '/icons/settings.svg' },
];

type MainShellProps = {
  children: React.ReactNode;
};

function isActivePath(currentPath: string, targetPath: string, exact?: boolean) {
  if (exact) {
    return currentPath === targetPath;
  }

  if (targetPath === '/dashboard') {
    return currentPath === '/dashboard';
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function NavLinks({
  items,
  pathname,
}: {
  items: { label?: string; href?: string; iconHref?: string; showIndicator?: boolean; deleteAction?: boolean; exact?: boolean }[];
  pathname: string;
}) {
  return (
    <ul className={styles.navList}>
      {items.map((item) => {
        if (!item.href) return null;
        const active = isActivePath(pathname, item.href, item.exact);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`.trim()}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={styles.navIcon}
                style={item.iconHref ? ({ '--nav-icon-url': `url(${item.iconHref})` } as React.CSSProperties) : undefined}
                aria-hidden="true"
              />
              <span className={styles.navLabel}>{item.label}</span>
              {item.showIndicator ? <span className={styles.itemIndicator} aria-hidden="true" /> : null}
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
  const [previousPath, setPreviousPath] = useState<string>('/dashboard');
  const sidebarRef = useRef<HTMLElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const logoutMutation = useOrganizationLogout();

  useEffect(() => {
    const id = getOrganizationId();
    setOrgId(id);
  }, []);

  useEffect(() => {
    if (pathname !== '/notifications' && pathname !== '/organization' && pathname !== '/settings') {
      setPreviousPath(pathname);
    }
  }, [pathname]);

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

  const handleNotificationClick = () => {
    router.push('/notifications');
  };

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await logoutMutation.mutateAsync(refreshToken);
      }
    } catch {
      // Tokens are cleared in mutation finally / onError
    } finally {
      removeTokens();
      router.push('/sign-in');
    }
  };

  const handleOrganizationClick = () => {
    router.push('/organization');
  };

  return (
    <div className={styles.pageShell}>
      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.sidebarOpen : ''}`}
      >
        <div>
          <div className={styles.brandWrap}>
            <Link href="/dashboard" className={styles.brandLink} aria-label="Work Pulse AI — Dashboard">
              <span className={styles.brandMark} aria-hidden>
                <span className={styles.brandRipple} />
                <span className={styles.brandCore} />
              </span>
              <span className={styles.brandWordmark}>
                <span className={styles.brandName}>Work Pulse</span>
                <span className={styles.brandAi}>AI</span>
              </span>
            </Link>
          </div>

          <nav aria-label="Main">
            <NavLinks items={mainNavItems} pathname={pathname} />
          </nav>
        </div>

        <nav aria-label="Secondary">
          <NavLinks items={secondaryNavItems} pathname={pathname} />
        </nav>
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.topbar}>
          <button
            className={styles.hamburgerButton}
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <label className={styles.searchWrap}>
            <Image src="/icons/search.svg" alt="" width={16} height={16} className={styles.searchIconImage} aria-hidden="true" />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Jump to page…"
              list="main-nav-jump"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const q = (e.target as HTMLInputElement).value.trim().toLowerCase();
                const match = mainNavItems.find(
                  (item) =>
                    item.label.toLowerCase().includes(q) ||
                    item.href.toLowerCase().includes(q)
                );
                if (match) {
                  router.push(match.href);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <datalist id="main-nav-jump">
              {mainNavItems.map((item) => (
                <option key={item.href} value={item.label} />
              ))}
            </datalist>
          </label>

          <div className={styles.topbarRight}>
            <ThemeSwitcher />
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleNotificationClick}
              aria-label="Notifications"
            >
              <Bell size={22} className={styles.topbarIcon} aria-hidden="true" />
            </button>

            <div className={styles.userWrap} ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className={styles.profileTrigger}
                type="button"
                aria-haspopup="true"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className={styles.profileMeta}>
                  <p className={styles.userName}>{isLoading ? 'Loading...' : data?.data?.name || 'Org Name'}</p>
                  <p className={styles.userRole}>{isLoading ? '' : data?.data?.organization_type || 'Role'}</p>
                </div>
                <span className={styles.avatar} aria-hidden="true">
                  {data?.data?.name ? data.data.name.slice(0, 2).toUpperCase() : 'AR'}
                </span>
                <ChevronDown
                  className={styles.profileChevron}
                  size={16}
                  style={{ transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {isProfileDropdownOpen && (
                <div className={styles.profileDropdown}>
                  <button
                    onClick={() => {
                      handleOrganizationClick();
                      setIsProfileDropdownOpen(false);
                    }}
                    type="button"
                    className={styles.profileMenuItem}
                  >
                    Organization
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsProfileDropdownOpen(false);
                    }}
                    type="button"
                    className={`${styles.profileMenuItem} ${styles.profileMenuItemDanger}`}
                  >
                    Logout
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
