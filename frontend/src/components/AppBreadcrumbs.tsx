'use client';

import {
  Fragment,
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  companyadmin: 'Company Admin',
  hrmanager: 'HR Manager',
  employee: 'Employee',
  manager: 'Manager',
};

const SEGMENT_LABELS: Record<string, string> = {
  users: 'Users',
  companies: 'Companies',
  'company-admins': 'Company Admins',
  employees: 'Employees',
  'employee-directory': 'Employee Directory',
  departments: 'Departments',
  designations: 'Designations',
  attendance: 'Attendance',
  regularizations: 'Attendance Requests',
  shifts: 'Shifts',
  'leave-requests': 'Leave Requests',
  'leave-types': 'Leave Types',
  leave: 'My Leave Requests',
  'leave-usages': 'Leave Balance & Usage',
  projects: 'Projects',
  payroll: 'Payroll',
  policies: 'Policy Hub',
  policy: 'Policy',
  complaints: 'Complaints',
  profile: 'Profile',
  settings: 'Attendance Settings',
  payslips: 'My Payslips',
};

function prettifySegment(segment: string) {
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isDynamicSegment(segment: string) {
  return /^[a-f0-9-]{8,}$/i.test(segment);
}

type BreadcrumbItemType = { href?: string; label: string };

const BreadcrumbOverrideContext = createContext<{
  items: BreadcrumbItemType[] | null;
  setItems: (items: BreadcrumbItemType[] | null) => void;
} | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItemType[] | null>(null);

  return (
    <BreadcrumbOverrideContext.Provider value={{ items, setItems }}>
      {children}
    </BreadcrumbOverrideContext.Provider>
  );
}

export function useBreadcrumbs(items: BreadcrumbItemType[] | null) {
  const context = useContext(BreadcrumbOverrideContext);

  useLayoutEffect(() => {
    if (!context) return;
    context.setItems(items);

    return () => {
      context.setItems(null);
    };
  }, [context, items]);
}

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const context = useContext(BreadcrumbOverrideContext);

  const generatedItems = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);

    if (segments[0] !== 'dashboard') {
      return [] as BreadcrumbItemType[];
    }

    if (segments.length <= 2) {
      return [] as BreadcrumbItemType[];
    }

    const role = segments[1];
    const pageSegments = segments.slice(2);
    const crumbs: BreadcrumbItemType[] = [
      { href: role ? `/dashboard/${role}` : '/dashboard', label: 'Dashboard' },
    ];

    let currentPath = role ? `/dashboard/${role}` : '/dashboard';

    for (let index = 0; index < pageSegments.length; index += 1) {
      const segment = pageSegments[index];
      currentPath += `/${segment}`;

      let label = SEGMENT_LABELS[segment] || prettifySegment(segment);

      if (index === 0 && pageSegments.length === 0 && role) {
        label = ROLE_LABELS[role] || 'Dashboard';
      }

      if (isDynamicSegment(segment)) {
        const previous = pageSegments[index - 1];
        if (previous === 'projects') {
          label = 'Project Details';
        } else {
          label = 'Details';
        }
      }

      crumbs.push({
        href: index === pageSegments.length - 1 ? undefined : currentPath,
        label,
      });
    }

    if (pageSegments.length === 0 && role) {
      crumbs[0] = { label: ROLE_LABELS[role] || 'Dashboard' };
    }

    return crumbs;
  }, [pathname]);

  const items = context?.items ?? generatedItems;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 flex items-center px-1 sm:mb-4">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <Fragment key={`${item.label}-${index}`}>
                <BreadcrumbItem>
                  {isLast || !item.href ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast ? <BreadcrumbSeparator /> : null}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
