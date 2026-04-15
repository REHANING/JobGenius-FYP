import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  UserIcon,
  BriefcaseIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'jobseeker':
        return [
          { name: 'Home', icon: HomeIcon, href: '/dashboard' },
          { name: 'My Profile', icon: UserIcon, href: '/profile' },
          { name: 'Jobs', icon: BriefcaseIcon, href: '/internships' },
          { name: 'Applications', icon: ClipboardDocumentListIcon, href: '/applications' },
          { name: 'Interviews', icon: AcademicCapIcon, href: '/interviews' },
          { name: 'Offers', icon: ChartBarIcon, href: '/offers' },
          { name: 'Cover Letter', icon: DocumentTextIcon, href: '/marketplace' },
        ];
      case 'recruiter':
        return [
          { name: 'Home', icon: HomeIcon, href: '/recruiter' },
          { name: 'Post Job', icon: PlusIcon, href: '/recruiter/post-job' },
          { name: 'My Jobs', icon: BriefcaseIcon, href: '/recruiter/jobs' },
          { name: 'Applicants', icon: ClipboardDocumentListIcon, href: '/recruiter/applicants' },
          { name: 'Browse Profiles', icon: UsersIcon, href: '/recruiter/profiles' },
          { name: 'Interviews', icon: AcademicCapIcon, href: '/recruiter/interviews' },
          { name: 'Offers', icon: ChartBarIcon, href: '/recruiter/offers' },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', icon: HomeIcon, href: '/admin' },
          { name: 'Users', icon: UsersIcon, href: '/admin/users' },
          { name: 'Jobs', icon: BriefcaseIcon, href: '/admin/jobs' },
          { name: 'Reports', icon: ChartBarIcon, href: '/admin/reports' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  if (!user || menuItems.length === 0) return null;

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      {/* User Card */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <UserIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 capitalize truncate">
              {user.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link key={item.href} to={item.href}>
              <div
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors mb-1 ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-600'}`} />
                <span className="text-sm">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Job Genius Platform
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;