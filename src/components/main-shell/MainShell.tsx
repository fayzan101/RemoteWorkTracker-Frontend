'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './main-shell.module.css';
import { useOrganizationLogout } from '@/services/organization/useOrganization';
import { getRefreshToken } from '@/services/organization/organization.service';
import { useRouter } from 'next/navigation';
import { useGetOrganizationById  } from '@/services/organization/useOrganization';
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
  { label: 'Learning', href: '/learning', iconHref: '/icons/learning.svg' ,  exact: true},
  { label: 'Enrollments', href: '/learning/enrollments', iconHref: '/icons/learning.svg' },
  { label: 'Attendance', href: '/attendance', iconHref: '/icons/dashboard.svg' },
  { label: 'Payroll', href: '/payroll', iconHref: '/icons/goals.svg' },
];

const secondaryNavItems = [
  // { label: 'Settings', href: '/settings', iconHref: '/icons/settings.svg' },
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
  items: { label?: string; href?: string; iconHref?: string; showIndicator?: boolean; deleteAction?: boolean; exact?: boolean}[];
  pathname: string;
}) {
  const router = useRouter();
  const logoutMutation = useOrganizationLogout();

  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await logoutMutation.mutateAsync(refreshToken);
      // removeRefreshToken();
      useOrganizationLogout() 
    }
    router.push('/sign-in');
  };

  return (
    <ul className={styles.navList}>
      {items.map((item) => {
        const active = isActivePath(pathname, item.href, item.exact);
        if (item.deleteAction) {
          return (
            <li key={item.href}>
              <a
                href="#"
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`.trim()}
                onClick={handleLogout}
              >
                <span
                  className={styles.navIcon}
                  style={item.iconHref ? ({ '--nav-icon-url': `url(${item.iconHref})` } as React.CSSProperties) : undefined}
                  aria-hidden="true"
                />
                <span className={styles.deleteLabel}>{item.label}</span>
              </a>
            </li>
          );
        }
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
              <span className={item.deleteAction ? styles.deleteLabel : styles.navLabel}>
                {item.label}
              </span>
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
    // Get organization ID from localStorage on mount
    const id = getOrganizationId();
    setOrgId(id);
  }, []);

  useEffect(() => {
    // Store previous path when navigating away from notification or profile pages
    if (pathname !== '/notifications' && pathname !== '/profile' && pathname !== '/organization') {
      setPreviousPath(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    // Close sidebar when pathname changes (navigation)
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Close sidebar when clicking outside on mobile
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
    // Close profile dropdown when clicking outside
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
    if (refreshToken) {
      await logoutMutation.mutateAsync(refreshToken);
    }
    router.push('/sign-in');
  };

  const handleOrganizationClick = () => {
    router.push('/organization');
  };

  const handleBackClick = () => {
    router.back();
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
            {isMobileSidebarOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
          <label className={styles.searchWrap}>
            <Image src="/icons/search.svg" alt="" width={16} height={16} className={styles.searchIconImage} aria-hidden="true" />
            <input className={styles.searchInput} type="search" placeholder="Search resources or tasks..." />
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
                  {data?.data?.name ? data.data.name.slice(0,2).toUpperCase() : 'AR'}
                </span>
                <ChevronDown 
                  className={styles.profileChevron}
                  size={16} 
                  style={{ transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} 
                />
              </button>

              {/* Profile Dropdown Menu */}
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