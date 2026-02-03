
import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import App from './App';
import { AlertCircle } from 'lucide-react';

class GlobalErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Global crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] text-white p-8 text-center font-['Cairo']">
          <AlertCircle size={60} className="text-rose-500 mb-8 animate-pulse" />
          <h1 className="text-3xl font-bold mb-4">فشل في بدء تشغيل النظام</h1>
          <p className="text-slate-400 mb-8 max-w-md text-sm font-bold">حدث خطأ تقني حرج أثناء تهيئة التطبيق. يرجى محاولة إعادة التشغيل.</p>
          <div className="bg-slate-900/50 p-6 rounded-2xl text-left font-mono text-xs overflow-auto max-w-2xl w-full border border-white/5 backdrop-blur-xl">
            <div className="text-rose-400 mb-2 font-bold">Error Details:</div>
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-10 bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-xl font-bold transition-all text-sm shadow-xl shadow-indigo-600/20"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
