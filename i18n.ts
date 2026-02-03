
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "customers": "Customers",
      "suppliers": "Suppliers",
      "flight_bookings": "Flight Bookings",
      "hajj_umrah": "Hajj & Umrah",
      "services": "General Services",
      "expenses": "Expenses",
      "treasury": "Treasury",
      "journal": "Journal Entries",
      "reports": "Reports",
      "employees": "Employees",
      "program_builder": "Program Builder",
      "trip_analysis": "Trip Cost Analysis",
      "clearing": "Clearing",
      "settings": "Settings",
      "year_end": "Year End Closing",
      "users": "Users & Permissions",
      "logout": "Logout",
      "audit_trail": "Audit Trail (System Log)",
      "user": "User",
      "action": "Action",
      "details": "Details",
      "date": "Date",
      "status": "Status",
      "search": "Search...",
      "welcome": "Welcome",
      "language": "Language",
      "income_statement": "Income Statement",
      "balance_sheet": "Balance Sheet",
      "trial_balance": "Trial Balance",
      "no_data_available": "No data available in this period"
    }
  },
  ar: {
    translation: {
      "dashboard": "لوحة التحكم",
      "customers": "العملاء",
      "suppliers": "الموردين",
      "flight_bookings": "حجوزات الطيران",
      "hajj_umrah": "الحج والعمرة",
      "services": "الخدمات العامة",
      "expenses": "المصروفات",
      "treasury": "الخزائن والبنوك",
      "journal": "القيود المحاسبية",
      "reports": "التقارير المالية",
      "employees": "الموظفين والرواتب",
      "program_builder": "مصمم البرامج",
      "trip_analysis": "تحليل تكاليف الرحلات",
      "clearing": "المقاصة المالية",
      "settings": "الإعدادات",
      "year_end": "إقفال السنة المالية",
      "users": "المستخدمين والصلاحيات",
      "logout": "تسجيل الخروج",
      "audit_trail": "سجل مراقبة النظام (Audit Trail)",
      "user": "المستخدم",
      "action": "العملية",
      "details": "التفاصيل",
      "date": "التاريخ",
      "status": "الحالة",
      "search": "بحث...",
      "welcome": "مرحباً بك",
      "language": "اللغة",
      "income_statement": "قائمة الدخل (الأرباح والخسائر)",
      "balance_sheet": "الميزانية العمومية",
      "trial_balance": "ميزان المراجعة",
      "no_data_available": "لا توجد بيانات متاحة في هذه الفترة"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage']
    }
  });

export default i18n;
