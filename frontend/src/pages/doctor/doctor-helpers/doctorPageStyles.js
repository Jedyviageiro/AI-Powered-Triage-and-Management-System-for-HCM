export const doctorPageStyles = `
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .doctor-page,
        .doctor-page input,
        .doctor-page textarea,
        .doctor-page select,
        .doctor-page button { font-family: 'IBM Plex Sans', system-ui, sans-serif; }
        .doctor-page h1 { font-family: 'IBM Plex Sans', system-ui, sans-serif; font-size: 28px !important; font-weight: 700 !important; line-height: 1.05; }
        .doctor-page h2,
        .doctor-page h3 { font-family: 'IBM Plex Sans', system-ui, sans-serif; font-weight: 700; }
        .dash-animate { animation: fadeInUp 0.4s ease forwards; }
        .dash-animate-delay-1 { animation-delay: 0.05s; opacity: 0; }
        .dash-animate-delay-2 { animation-delay: 0.1s; opacity: 0; }
        .dash-animate-delay-3 { animation-delay: 0.15s; opacity: 0; }
        .dash-animate-delay-4 { animation-delay: 0.2s; opacity: 0; }
        .dash-animate-delay-5 { animation-delay: 0.25s; opacity: 0; }
        @media (prefers-reduced-motion: reduce) {
          .dash-animate,
          .nav-indicator,
          .sidebar,
          .nav-label,
          .logo-text,
          .user-info { animation: none !important; transition: none !important; }
        }
        .doctor-page button:not(.sidebar-nav-btn) { border-radius: 999px !important; box-shadow: none !important; font-family: inherit; }
        .doctor-page .modern-select-root > button { border-radius: 999px !important; box-shadow: none !important; }
        .doctor-page .active-alert-row { border-radius: 10px !important; }
        .doctor-font-scaled * { font-size: calc(100% * var(--doctor-font-scale)) !important; line-height: 1.4; }
        .triage-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 18px; font-size: 13px; font-weight: 400; color: #111827; background: #fff; transition: border-color 0.15s; }
        .triage-input::placeholder { color: #d1d5db; }
        .triage-input:focus { outline: none; border-color: #165034; }
        .triage-label { font-size: 10px; font-weight: 700; color: #374151; margin-bottom: 4px; display: block; letter-spacing: 0.08em; text-transform: uppercase; }
        .btn-primary { background: #165034; color: white; border: 1px solid #165034; border-radius: 999px; padding: 11px 20px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, border-color 0.15s; width: 100%; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; line-height: 1.1; }
        .btn-primary:hover:not(:disabled) { background: #0c3a24; border-color: #0c3a24; }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; border-radius: 999px; padding: 11px 20px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, border-color 0.15s; width: 100%; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; line-height: 1.1; }
        .btn-secondary:hover:not(:disabled) { background: #e5e7eb; }
        .btn-secondary:disabled { opacity: 0.45; cursor: not-allowed; }
        .form-card { background: white; border: 1px solid #f0f0f0; border-radius: 16px; padding: 28px; box-shadow: 0 1px 8px rgba(0,0,0,0.04); }
        .cf-wrap { width: 100%; }
        .cf-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
        }
        .cf-card-sm {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px 16px;
          min-width: 0;
        }
        .cf-label {
          display: block;
          margin-bottom: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
        }
        .cf-input,
        .cf-textarea {
          width: 100%;
          border: 1px solid #dbe5df;
          background: #ffffff;
          color: #111827;
          border-radius: 16px;
          padding: 12px 14px;
          font-size: 13px;
          line-height: 1.45;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .cf-input {
          min-height: 44px;
        }
        .cf-textarea {
          min-height: 116px;
          resize: vertical;
        }
        .cf-input:focus,
        .cf-textarea:focus {
          outline: none;
          border-color: #86efac;
          box-shadow: 0 0 0 4px rgba(134, 239, 172, 0.18);
        }
        .cf-btn-primary,
        .cf-btn-sec {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .cf-btn-primary {
          background: #165034;
          border: 1px solid #165034;
          color: #ffffff;
        }
        .cf-btn-primary:hover:not(:disabled) {
          background: #0c3a24;
          border-color: #0c3a24;
        }
        .cf-btn-sec {
          background: #f8fafc;
          border: 1px solid #dbe5df;
          color: #334155;
        }
        .cf-btn-sec:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .cf-btn-primary:disabled,
        .cf-btn-sec:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }
        .cf-grid-2,
        .cf-grid-4,
        .cf-grid-5 {
          display: grid;
          gap: 14px;
        }
        .cf-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .cf-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .cf-grid-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        @media (max-width: 1100px) {
          .cf-grid-5 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .cf-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px) {
          .cf-card { padding: 18px; }
          .cf-grid-2,
          .cf-grid-4,
          .cf-grid-5 { grid-template-columns: 1fr; }
        }
                input:focus, textarea:focus, select:focus { outline: none; border-color: #22c55e; }
                .modern-date-input:focus { outline: none; border-color: #22c55e; }
        .modern-date-input::-webkit-calendar-picker-indicator { opacity: 0.01; cursor: pointer; }

        .sidebar { transition: width 0.3s cubic-bezier(0.4,0,0.2,1); overflow: hidden; background: #0c3a24; color: #ffffff; }
        .sidebar-open { width: 256px; }
        .sidebar-closed { width: 76px; }
        .sidebar nav { overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(220,235,226,0.55) transparent; }
        .sidebar nav::-webkit-scrollbar { width: 8px; }
        .sidebar nav::-webkit-scrollbar-thumb { background: rgba(220,235,226,0.45); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
        .sidebar button:focus { outline: none; }
        .sidebar-closed nav { padding-left: 8px !important; padding-right: 8px !important; }
        .sidebar-closed .nav-item-wrap > button { justify-content: center; gap: 0 !important; padding-left: 10px !important; padding-right: 10px !important; }

        .nav-label {
          transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap; overflow: hidden;
        }
        .sidebar-open .nav-label { opacity: 1; max-width: 200px; }
        .sidebar-closed .nav-label { opacity: 0; max-width: 0; }

        .logo-text {
          transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap; overflow: hidden;
        }
        .sidebar-open .logo-text { opacity: 1; max-width: 200px; }
        .sidebar-closed .logo-text { opacity: 0; max-width: 0; }

        .user-info { transition: opacity 0.2s ease, max-height 0.3s ease; overflow: hidden; }
        .sidebar-open .user-info { opacity: 1; max-height: 80px; }
        .sidebar-closed .user-info { opacity: 0; max-height: 0; }

        .sidebar-closed .nav-badge {
          position: absolute; top: 4px; right: 4px;
          width: 18px; height: 18px; font-size: 10px;
          border-radius: 9999px;
        }

        .nav-badge-open {
          width: 20px; height: 20px; border-radius: 9999px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600;
        }

        .nav-tooltip {
          position: absolute; left: calc(100% + 12px); top: 50%;
          transform: translateY(-50%); background: #111827; color: #fff;
          font-size: 12px; font-weight: 500; padding: 4px 10px;
          border-radius: 6px; white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity 0.15s ease; z-index: 50;
        }
        .sidebar-closed .nav-item-wrap:hover .nav-tooltip { opacity: 1; }
        .sidebar-open .nav-tooltip { display: none; }
        .sidebar-nav-btn {
          position: relative;
          border-radius: 0 !important;
          margin-left: 0;
          width: 100% !important;
          font-size: 12px;
          font-weight: 500;
        }
        .sidebar-open .sidebar-nav-btn {
          padding-left: 20px !important;
        }
        .nav-indicator {
          position: absolute;
          left: 0;
          width: 3px;
          background: #7fe0a0;
          border-radius: 0;
          transition: top 0.22s cubic-bezier(0.4, 0, 0.2, 1), height 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease;
          pointer-events: none;
        }
        .nav-active {
          background: rgba(134, 214, 163, 0.14) !important;
          color: #ffffff !important;
          margin-right: -12px !important;
          width: calc(100% + 12px) !important;
          padding-left: 20px !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .sidebar .nav-item-wrap,
        .sidebar .nav-item-wrap > button {
          border-radius: 0 !important;
        }
        .sidebar-closed .nav-active {
          padding-left: 0 !important;
          justify-content: center !important;
        }
        .sidebar-nav-inactive { color: rgba(255,255,255,0.78) !important; }
        .sidebar-nav-inactive:hover {
          background: rgba(255,255,255,0.06) !important;
          color: #ffffff !important;
        }
        .popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 16px;
        }
        .popup-card {
          width: min(460px, 100%);
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
          padding: 18px;
        }
        .popup-icon {
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .popup-icon-warning { background: #fef3c7; color: #b45309; }
        .popup-icon-success { background: #dcfce7; color: #166534; }
`;
