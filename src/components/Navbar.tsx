import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Sparkles,
  Timer,
  Target,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Cloud,
  Database
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onResetSeed?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onResetSeed }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'skills', label: 'My Skills', icon: Sparkles },
    { id: 'practice', label: 'Practice', icon: Timer },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center space-x-2 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight block leading-tight text-base sm:text-lg">
                  HobbyCloud
                </span>
                <span className="text-[11px] font-medium text-slate-500 block leading-none">
                  Skills &amp; Community Tracker
                </span>
              </div>
            </button>

            {/* Cloud badge indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Cloud Sync Online</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center space-x-3">
            {onResetSeed && (
              <button
                onClick={onResetSeed}
                title="Reset sample data for viva / testing"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Demo Data</span>
              </button>
            )}

            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
                >
                  <img
                    src={user.profile_picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  />
                  <div className="hidden xl:block leading-tight">
                    <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                    <p className="text-[11px] text-slate-500">@{user.username}</p>
                  </div>
                </button>

                <button
                  onClick={() => logout()}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {user && (
            <div className="flex items-center space-x-3 py-2 px-3 mb-2 bg-slate-50 rounded-lg border border-slate-200">
              <img
                src={user.profile_picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">@{user.username}</p>
              </div>
            </div>
          )}

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            {onResetSeed && (
              <button
                onClick={() => {
                  onResetSeed();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 text-xs text-slate-600 hover:text-slate-900 px-3 py-2"
              >
                <Database className="w-4 h-4 text-slate-500" />
                <span>Reset Demo Data</span>
              </button>
            )}

            <button
              onClick={() => logout()}
              className="flex items-center space-x-2 text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
