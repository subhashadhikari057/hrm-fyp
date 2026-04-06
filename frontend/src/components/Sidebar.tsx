'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { usePathname, useRouter } from 'next/navigation';
import { API_BASE_URL } from '../lib/api/types';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

/** -------------------------------------------------------
 *  ICONS (same icons you already used)
 *  ----------------------------------------------------- */
const IconDashboard = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const IconUsers = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const IconCompany = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const IconBriefcase = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const IconCalendar = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3M4 11h16M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
    />
  </svg>
);

const IconClock = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const IconChat = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.94 9.94 0 01-4.255-.949L3 20l1.244-3.728C3.458 15.096 3 13.594 3 12 3 7.582 7.03 4 12 4s9 3.582 9 8z"
    />
  </svg>
);

/** -------------------------------------------------------
 *  ROLE-BASED MENU STRUCTURE (Menu + Submenu)
 *  ----------------------------------------------------- */
const roleMenuItems: Record<string, MenuGroup[]> = {
  superadmin: [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', href: '/dashboard/superadmin', icon: IconDashboard },
      ],
    },
    {
      title: 'Administration',
      items: [
        { name: 'Users', href: '/dashboard/superadmin/users', icon: IconUsers },
        {
          name: 'Company',
          href: '/dashboard/superadmin/companies',
          icon: IconCompany,
          children: [
            { name: 'Companies', href: '/dashboard/superadmin/companies', icon: IconCompany },
            { name: 'Company Admin', href: '/dashboard/superadmin/company-admins', icon: IconBriefcase },
          ],
        },
        { name: 'Subscription Plans', href: '/dashboard/superadmin/subscription-plans', icon: IconBriefcase },
      ],
    },
  ],

  companyadmin: [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', href: '/dashboard/companyadmin', icon: IconDashboard },
      ],
    },
    {
      title: 'Organization',
      items: [
        {
          name: 'People',
          href: '/dashboard/companyadmin/employees',
          icon: IconUsers,
          children: [
            { name: 'Employee', href: '/dashboard/companyadmin/employees', icon: IconUsers },
            { name: 'Users', href: '/dashboard/companyadmin/users', icon: IconUsers },
          ],
        },
        {
          name: 'Structure',
          href: '/dashboard/companyadmin/departments',
          icon: IconCompany,
          children: [
            { name: 'Department', href: '/dashboard/companyadmin/departments', icon: IconCompany },
            { name: 'Designation', href: '/dashboard/companyadmin/designations', icon: IconBriefcase },
          ],
        },
      ],
    },
        {
          title: 'Operations',
          items: [
            {
              name: 'Attendance',
              href: '/dashboard/companyadmin/attendance',
              icon: IconCalendar,
              children: [
                { name: 'Attendance', href: '/dashboard/companyadmin/attendance', icon: IconCalendar },
                { name: 'Attendance Requests', href: '/dashboard/companyadmin/regularizations', icon: IconClock },
                { name: 'Shifts', href: '/dashboard/companyadmin/shifts', icon: IconClock },
              ],
            },
            {
              name: 'Leave',
              href: '/dashboard/companyadmin/leave-requests',
              icon: IconCalendar,
              children: [
                { name: 'Leave Requests', href: '/dashboard/companyadmin/leave-requests', icon: IconCalendar },
                { name: 'Leave Types', href: '/dashboard/companyadmin/leave-types', icon: IconClock },
              ],
            },
            { name: 'Payroll', href: '/dashboard/companyadmin/payroll', icon: IconBriefcase },
            { name: 'Projects', href: '/dashboard/companyadmin/projects', icon: IconBriefcase },
            { name: 'Complaints', href: '/dashboard/companyadmin/complaints', icon: IconChat },
            { name: 'Policy Hub', href: '/dashboard/companyadmin/policies', icon: IconBriefcase },
          ],
        },
      ],

  hrmanager: [
    {
      title: 'Main',
      items: [{ name: 'Dashboard', href: '/dashboard/hrmanager', icon: IconDashboard }],
    },
    {
      title: 'HR',
      items: [
        { name: 'Employee', href: '/dashboard/hrmanager/employees', icon: IconUsers },
        { name: 'Department', href: '/dashboard/hrmanager/departments', icon: IconCompany },
        { name: 'Designation', href: '/dashboard/hrmanager/designations', icon: IconBriefcase },
        { name: 'Shifts', href: '/dashboard/hrmanager/shifts', icon: IconClock },
        {
          name: 'Leave',
          href: '/dashboard/hrmanager/leave-requests',
          icon: IconCalendar,
          children: [
            { name: 'Leave Requests', href: '/dashboard/hrmanager/leave-requests', icon: IconCalendar },
            { name: 'Leave Types', href: '/dashboard/hrmanager/leave-types', icon: IconClock },
          ],
        },
        { name: 'Payroll', href: '/dashboard/hrmanager/payroll', icon: IconBriefcase },
        { name: 'Projects', href: '/dashboard/hrmanager/projects', icon: IconBriefcase },
        { name: 'Complaints', href: '/dashboard/hrmanager/complaints', icon: IconChat },
        { name: 'Policy Hub', href: '/dashboard/hrmanager/policies', icon: IconBriefcase },
      ],
    },
  ],

  employee: [
    {
      title: 'Main',
      items: [{ name: 'Dashboard', href: '/dashboard/employee', icon: IconDashboard }],
    },
    {
      title: 'Self Service',
      items: [
        {
          name: 'Attendance',
          href: '/dashboard/employee/attendance',
          icon: IconCalendar,
          children: [
            { name: 'Attendance', href: '/dashboard/employee/attendance', icon: IconCalendar },
            { name: 'Attendance Requests', href: '/dashboard/employee/regularizations', icon: IconClock },
          ],
        },
        {
          name: 'Leave',
          href: '/dashboard/employee/leave',
          icon: IconCalendar,
          children: [
            { name: 'Leave Requests', href: '/dashboard/employee/leave', icon: IconCalendar },
            { name: 'Leave Usages', href: '/dashboard/employee/leave-usages', icon: IconClock },
          ],
        },
        { name: 'Payslips', href: '/dashboard/employee/payslips', icon: IconBriefcase },
        { name: 'Projects', href: '/dashboard/employee/projects', icon: IconBriefcase },
        { name: 'Complaints', href: '/dashboard/employee/complaints', icon: IconChat },
        { name: 'Policy', href: '/dashboard/employee/policy', icon: IconBriefcase },
      ],
    },
  ],

  manager: [
    {
      title: 'Main',
      items: [{ name: 'Dashboard', href: '/dashboard/employee', icon: IconDashboard }],
    },
  ],
};

// Export flat menu items for compatibility (if you need it elsewhere)
export function getMenuItemsForRole(role: string): MenuItem[] {
  const groups = roleMenuItems[role] || roleMenuItems.employee;
  return groups.flatMap((g) => g.items);
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar, isMobileOpen, closeMobileMenu } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Track which submenu is open
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Keyboard shortcut: Cmd/Ctrl + S to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const groups: MenuGroup[] = useMemo(() => {
    if (!user) return [];
    return roleMenuItems[user.role] || roleMenuItems.employee;
  }, [user]);

  // Flat items used by your old isActive logic (keeps behavior same)
  const flatItems: MenuItem[] = useMemo(() => {
    const flatten = (items: MenuItem[]): MenuItem[] => {
      return items.flatMap((i) => (i.children?.length ? [i, ...flatten(i.children)] : [i]));
    };

    return groups.flatMap((g) => flatten(g.items));
  }, [groups]);


  const isActive = (href: string) => {
    if (pathname === href) return true;

    if (pathname.startsWith(href + '/')) {
      const moreSpecificMatch = flatItems.find(
        (item) =>
          item.href !== href &&
          (pathname === item.href || pathname.startsWith(item.href + '/')) &&
          item.href.startsWith(href + '/')
      );
      return !moreSpecificMatch;
    }
    return false;
  };

  const isAnyChildActive = (children?: MenuItem[]) => {
    if (!children?.length) return false;
    return children.some((c) => isActive(c.href));
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    closeMobileMenu();
  };

  const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin',
    companyadmin: 'Company Admin',
    hrmanager: 'HR Manager',
    manager: 'Manager',
    employee: 'Employee',
  };

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    closeMobileMenu();
  };

  const avatarUrl = (() => {
    if (!user?.avatarUrl) return null;
    const raw = user.avatarUrl;
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('/uploads')) return `${API_BASE_URL}${raw}`;
    if (raw.startsWith('uploads/')) return `${API_BASE_URL}/${raw}`;
    return `${API_BASE_URL}/uploads/${raw.replace(/^\//, '')}`;
  })();

  // Auto-open submenu if route is inside it (nice UX)
  useEffect(() => {
    if (isCollapsed) return;
    const next: Record<string, boolean> = {};
    for (const g of groups) {
      for (const item of g.items) {
        if (item.children?.length && isAnyChildActive(item.children)) {
          next[item.href] = true;
        }
      }
    }
    setOpenKeys((prev) => ({ ...prev, ...next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isCollapsed]);

  const toggleSubmenu = (key: string) => {
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen border-r border-slate-200 bg-slate-50/95 backdrop-blur transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isCollapsed ? 'w-16' : 'w-64'}`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 shrink-0">
            {!isCollapsed ? (
              <>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <img
                    src="/logo/logo2.png"
                    alt="Karyasetu logo"
                    className="h-16 w-auto max-w-[220px] object-contain"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">Karyasetu</p>
                    <p className="truncate text-xs text-slate-500">HR workspace</p>
                  </div>
                </div>

                <button
                  onClick={toggleSidebar}
                  className="hidden lg:flex rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 flex-shrink-0"
                  aria-label="Collapse sidebar"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center flex-1" />
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:flex rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 flex-shrink-0"
                  aria-label="Expand sidebar"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Close mobile */}
            <button
              onClick={closeMobileMenu}
              className="ml-auto rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 lg:hidden flex-shrink-0"
              aria-label="Close menu"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu */}
          <nav className={`flex-1 space-y-5 overflow-y-auto px-2 py-4 sm:px-3 lg:px-4 ${isCollapsed ? 'px-2' : ''}`}>
            {groups.map((group) => (
              <div key={group.title} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {group.title}
                  </div>
                )}

                {group.items.map((item) => {
                  const hasChildren = !!item.children?.length;
                  const childActive = hasChildren && isAnyChildActive(item.children);
                  const expanded = !!openKeys[item.href];

                  // When parent has children:
                  // - clicking the chevron toggles submenu
                  // - clicking the row navigates to parent href (same as before)
                  return (
                    <div key={item.name} className="space-y-1">
                      <div
                        className={`w-full flex items-center rounded-xl text-sm font-medium transition-all ${
                          isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                        } ${
                          isActive(item.href) || childActive
                            ? 'bg-blue-100 text-blue-800 shadow-sm ring-1 ring-blue-200'
                            : 'text-slate-700 hover:bg-white hover:text-slate-900'
                        }`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <button
                          onClick={() => handleNavigation(item.href)}
                          className={`flex items-center w-full ${isCollapsed ? 'justify-center' : ''}`}
                        >
                          <span className={`${isCollapsed ? '' : 'mr-2.5 sm:mr-3'} flex-shrink-0`}>
                            {item.icon}
                          </span>
                          {!isCollapsed && <span className="truncate text-sm">{item.name}</span>}
                        </button>

                        {!isCollapsed && hasChildren && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubmenu(item.href);
                            }}
                            className="ml-2 rounded-md p-1 transition-colors hover:bg-black/5"
                            aria-label={expanded ? 'Collapse submenu' : 'Expand submenu'}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Submenu */}
                      {!isCollapsed && hasChildren && expanded && (
                        <div className="ml-4 space-y-1 border-l border-slate-200 pl-3">
                          {item.children!.map((child) => (
                            <button
                              key={child.name}
                              onClick={() => handleNavigation(child.href)}
                              className={`w-full flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                                isActive(child.href)
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
                              }`}
                            >
                              <span className="mr-2.5 flex-shrink-0 opacity-70">{child.icon}</span>
                              <span className="truncate">{child.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* User */}
          {user && (
            <div className={`border-t border-slate-200 ${isCollapsed ? 'px-2 py-3' : 'px-3 py-4'}`}>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  className={`w-full flex items-center rounded-xl border border-transparent transition-colors hover:border-slate-200 hover:bg-white ${
                    isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2.5'
                  }`}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.name || user.email}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#5974E6] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-sm">
                      {getInitials(user.email)}
                    </div>
                  )}

                  {!isCollapsed && (
                    <>
                      <div className="ml-3 text-left min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {user.name || user.email.split('@')[0]}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{roleLabels[user.role]}</div>
                      </div>

                      <svg
                        className={`w-4 h-4 text-slate-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                    <div
                      className={`absolute z-20 ${
                        isCollapsed ? 'left-14 bottom-0' : 'left-0 bottom-12 w-full'
                      } rounded-xl border border-slate-200 bg-white shadow-lg`}
                    >
                      <div className="py-1">
                        {!isCollapsed && (
                          <div className="border-b border-slate-200 px-4 py-2">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {user.name || user.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            router.push('/dashboard/profile');
                            setShowProfileMenu(false);
                            closeMobileMenu();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Profile
                        </button>

                        <button
                          onClick={() => {
                            router.push('/dashboard/settings');
                            setShowProfileMenu(false);
                            closeMobileMenu();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Settings
                        </button>

                        <div className="border-t border-slate-200">
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
