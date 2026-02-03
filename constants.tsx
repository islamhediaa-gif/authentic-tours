
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Wallet, 
  Moon, 
  FileText, 
  Settings, 
  Briefcase,
  BadgePercent,
  BookOpenText,
  UserCog,
  PlaneTakeoff,
  LockKeyhole,
  Contact2,
  RefreshCw,
  BarChart3,
  Palette,
  Fingerprint,
  Building2,
  Plane,
  ClipboardList,
  ShieldCheck
} from 'lucide-react';
import { ViewState, Currency } from './types';

export const NAV_GROUPS = [
  {
    id: 'DASHBOARD_GROUP',
    label: 'الرئيسية',
    items: [
      { id: ViewState.DASHBOARD, label: 'لوحة التحكم', translationKey: 'dashboard', icon: <LayoutDashboard size={20} /> },
    ]
  },
  {
    id: 'CRM_GROUP',
    label: 'العملاء والموردين',
    icon: <Users size={18} />,
    items: [
      { id: ViewState.CUSTOMERS, label: 'العملاء', translationKey: 'customers', icon: <Users size={20} />, permission: 'MANAGE_CUSTOMERS' },
      { id: ViewState.SUPPLIERS, label: 'الموردين', translationKey: 'suppliers', icon: <Truck size={20} />, permission: 'MANAGE_SUPPLIERS' },
    ]
  },
  {
    id: 'TOURISM_GROUP',
    label: 'السياحة والرحلات',
    icon: <Plane size={18} />,
    items: [
      { id: ViewState.FLIGHTS, label: 'حجز طيران', translationKey: 'flight_bookings', icon: <PlaneTakeoff size={20} />, permission: 'MANAGE_BOOKINGS' },
      { id: ViewState.SERVICES, label: 'التأشيرات والخدمات', translationKey: 'services', icon: <Briefcase size={20} />, permission: 'MANAGE_BOOKINGS' },
      { id: ViewState.HAJJ_UMRAH, label: 'الحج والعمرة', translationKey: 'hajj_umrah', icon: <Moon size={20} />, permission: 'MANAGE_BOOKINGS' },
      { id: ViewState.PROGRAM_BUILDER, label: 'مصمم البرامج', translationKey: 'program_builder', icon: <Palette size={20} />, permission: 'ADMIN_ONLY' },
      { id: ViewState.ACCOMMODATION, label: 'توزيع وتسكين الغرف', translationKey: 'accommodation', icon: <Building2 size={20} /> },
    ]
  },
  {
    id: 'FINANCE_GROUP',
    label: 'النظام المالي',
    icon: <Wallet size={18} />,
    items: [
      { id: ViewState.TREASURY, label: 'الخزينة والبنك', translationKey: 'treasury', icon: <Wallet size={20} />, permission: 'MANAGE_TREASURY' },
      { id: ViewState.JOURNAL, label: 'القيود المحاسبية', translationKey: 'journal', icon: <BookOpenText size={20} />, permission: 'MANAGE_JOURNAL' },
      { id: ViewState.EXPENSES, label: 'المصروفات والديون', translationKey: 'expenses', icon: <BadgePercent size={20} />, permission: 'MANAGE_EXPENSES' },
      { id: ViewState.CLEARING, label: 'مقاصة وتسويات', translationKey: 'clearing', icon: <RefreshCw size={20} />, permission: 'MANAGE_JOURNAL' },
    ]
  },
  {
    id: 'HR_GROUP',
    label: 'الموارد البشرية',
    icon: <Contact2 size={18} />,
    items: [
      { id: ViewState.EMPLOYEES, label: 'الموظفين والعمولات', translationKey: 'employees', icon: <Contact2 size={20} />, permission: 'ADMIN_ONLY' },
      { id: ViewState.FINGERPRINT, label: 'جهاز البصمة', translationKey: 'fingerprint', icon: <Fingerprint size={20} />, permission: 'ADMIN_ONLY' },
    ]
  },
  {
    id: 'ANALYTICS_GROUP',
    label: 'التقارير والتحليل',
    icon: <BarChart3 size={18} />,
    items: [
      { id: ViewState.REPORTS, label: 'التقارير المالية', translationKey: 'reports', icon: <FileText size={20} />, permission: 'VIEW_REPORTS' },
      { id: ViewState.TRIP_COST_ANALYSIS, label: 'تحليل تكاليف الرحلات', translationKey: 'trip_analysis', icon: <BarChart3 size={20} />, permission: 'ADMIN_ONLY' },
    ]
  },
  {
    id: 'SYSTEM_GROUP',
    label: 'إدارة النظام',
    icon: <ShieldCheck size={18} />,
    items: [
      { id: ViewState.YEAR_END, label: 'إقفال السنة المالية', translationKey: 'year_end', icon: <LockKeyhole size={20} />, permission: 'ADMIN_ONLY' },
      { id: ViewState.USERS, label: 'المستخدمين والصلاحيات', translationKey: 'users', icon: <UserCog size={20} />, permission: 'ADMIN_ONLY' },
      { id: ViewState.SETTINGS, label: 'إعدادات الشركة', translationKey: 'settings', icon: <Settings size={20} />, permission: 'ADMIN_ONLY' },
    ]
  }
];

// Keep NAV_ITEMS for backward compatibility where needed, or as a flat list
export const NAV_ITEMS = NAV_GROUPS.flatMap(group => group.items);


export const INITIAL_CURRENCIES: Currency[] = [
  { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م', rateToMain: 1 },
  { code: 'USD', name: 'دولار أمريكي', symbol: '$', rateToMain: 50 },
  { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س', rateToMain: 13.3 },
  { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ', rateToMain: 13.6 },
];

export const ALL_PERMISSIONS = [
  { id: 'MANAGE_CUSTOMERS', label: 'إدارة العملاء' },
  { id: 'MANAGE_SUPPLIERS', label: 'إدارة الموردين' },
  { id: 'MANAGE_TREASURY', label: 'إدارة الخزائن والبنك' },
  { id: 'MANAGE_BOOKINGS', label: 'إدارة الحجوزات والخدمات' },
  { id: 'MANAGE_EXPENSES', label: 'إدارة المصروفات' },
  { id: 'MANAGE_JOURNAL', label: 'إدارة القيود اليدوية' },
  { id: 'VIEW_REPORTS', label: 'عرض التقارير المالية' },
  { id: 'HIDE_FINANCIAL_AMOUNTS', label: 'إخفاء المبالغ المالية (للموظفين)' },
  { id: 'ADMIN_ONLY', label: 'صلاحيات الإدارة الكاملة' },
];

export const INITIAL_CUSTOMERS = [
  { id: '1', name: 'أحمد محمد الخطيب', phone: '', email: '', openingBalance: 0, openingBalanceCurrency: 'EGP', openingBalanceInBase: 0, balance: 0, currencyBalance: 0 },
];

export const INITIAL_SUPPLIERS = [
  { id: 'S1', name: 'مصر للطيران', phone: '', company: 'EgyptAir', openingBalance: 0, openingBalanceCurrency: 'EGP', openingBalanceInBase: 0, balance: 0, currencyBalance: 0 },
];

export const EXPENSE_CATEGORIES = [
  'أخرى',
  'أدوات مكتبية ومطبوعات',
  'إيجار مقر الشركة',
  'دعاية وتسويق وإعلانات',
  'رواتب وأجور الموظفين',
  'كهرباء ومياه وغاز',
  'إنترنت وهاتف واتصالات'
].sort((a, b) => a.localeCompare(b, 'ar'));

export const REVENUE_CATEGORIES = [
  'إيرادات أخرى',
  'إيرادات تأشيرات وخدمات',
  'إيرادات تذاكر طيران',
  'إيرادات حج وعمرة',
  'إيرادات عمولات'
].sort((a, b) => a.localeCompare(b, 'ar'));
