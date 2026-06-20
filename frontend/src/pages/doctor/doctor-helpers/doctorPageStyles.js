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
        .doctor-page button:not(.sidebar-nav-btn) { border-radius: 8px !important; box-shadow: none !important; font-family: inherit; }
        .doctor-page .modern-select-root > button { border-radius: 8px !important; box-shadow: none !important; }
        .doctor-page .active-alert-row { border-radius: 10px !important; }
        .doctor-font-scaled * { font-size: calc(100% * var(--doctor-font-scale)) !important; line-height: 1.4; }
        .triage-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 18px; font-size: 13px; font-weight: 400; color: #111827; background: #fff; transition: border-color 0.15s; }
        .triage-input::placeholder { color: #d1d5db; }
        .triage-input:focus { outline: none; border-color: #165034; }
        .triage-label { font-size: 10px; font-weight: 700; color: #374151; margin-bottom: 4px; display: block; letter-spacing: 0.08em; text-transform: uppercase; }
        .btn-primary { background: var(--hcm-primary-green); color: white; border: 1px solid var(--hcm-primary-green); border-radius: 8px; padding: 0 16px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, border-color 0.15s; width: 100%; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; line-height: 1.1; box-shadow: none; }
        .btn-primary:hover:not(:disabled) { background: var(--hcm-primary-green-hover); border-color: var(--hcm-primary-green-hover); }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-secondary { background: #ffffff; color: #374151; border: 1px solid #d1d5db; border-radius: 8px; padding: 0 16px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, border-color 0.15s; width: 100%; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; line-height: 1.1; box-shadow: none; }
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
          background: var(--hcm-primary-green);
          border: 1px solid var(--hcm-primary-green);
          color: #ffffff;
        }
        .cf-btn-primary:hover:not(:disabled) {
          background: var(--hcm-primary-green-hover);
          border-color: var(--hcm-primary-green-hover);
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

        .sidebar { transition: width 0.3s cubic-bezier(0.4,0,0.2,1); overflow: hidden; background: #ffffff; color: #101827; border-right: 1px solid #e7ebf0; box-shadow: none; }
        .sidebar-open { width: 216px; }
        .sidebar-closed { width: 76px; }
        .sidebar-brand-row { min-height: 74px; padding: 12px 14px 10px; }
        .sidebar-nav { padding: 6px 10px 12px; overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(102,112,133,0.35) transparent; }
        .sidebar-nav-groups { display: grid; gap: 0; }
        .sidebar-section-items { display: grid; gap: 5px; }
        .sidebar nav { overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(102,112,133,0.35) transparent; }
        .sidebar nav::-webkit-scrollbar { width: 8px; }
        .sidebar nav::-webkit-scrollbar-thumb { background: rgba(102,112,133,0.28); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
        .sidebar button:focus { outline: none; }
        .sidebar-footer { flex: 0 0 auto; position: sticky; bottom: 0; background: #ffffff; z-index: 2; }
        .sidebar-closed .sidebar-brand-row { padding-left: 12px; padding-right: 12px; }
        .sidebar-closed .sidebar-nav { padding-left: 7px !important; padding-right: 7px !important; }
        .sidebar-closed .nav-item-wrap > button { justify-content: center; gap: 0 !important; padding-left: 8px !important; padding-right: 8px !important; }

        .nav-label {
          transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap; overflow: hidden;
        }
        .sidebar-open .nav-label { opacity: 1; max-width: 158px; font-size: 12px; }
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
          position: absolute; top: 2px; right: 2px;
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
        .sidebar-nav-btn { position: relative; border-radius: 8px !important; margin-left: 0; width: 100% !important; font-size: 12px !important; font-weight: 500; min-height: 34px !important; padding: 8px 10px !important; gap: 10px !important; }
        .sidebar-nav-btn svg { width: 16px !important; height: 16px !important; }
        .sidebar-open .sidebar-nav-btn {
          padding-left: 10px !important;
          padding-right: 10px !important;
        }
        .nav-indicator {
          display: none;
        }
        .sidebar-closed .nav-indicator { left: -8px; }
        .nav-active {
          background: var(--hcm-primary-green-soft) !important;
          color: var(--hcm-primary-green) !important;
          margin-right: 0 !important;
          width: 100% !important;
          padding-left: 10px !important;
          border-radius: 8px !important;
          box-shadow: none !important;
          font-weight: 600 !important;
        }
        .sidebar .nav-item-wrap,
        .sidebar .nav-item-wrap > button {
          border-radius: 8px !important;
        }
        .sidebar-closed .nav-active {
          margin-left: 0 !important;
          margin-right: 0 !important;
          width: 100% !important;
          padding-left: 0 !important;
          justify-content: center !important;
        }
        .sidebar-nav-inactive { color: #66738b !important; }
        .sidebar-nav-inactive:hover {
          background: #f4f7f8 !important;
          color: var(--hcm-primary-green) !important;
        }
        .hcm-brand-mark { width: 50px; height: 50px; border-radius: 9px; overflow: hidden; flex: 0 0 auto; position: relative; background: #ffffff; border: none; padding: 0 !important; cursor: pointer; }
        .hcm-brand-mark img { position: absolute; width: 78%; height: 78%; left: 50%; top: 50%; transform: translate(-50%, -50%); object-fit: contain; }
        .hcm-dashboard-header { position: sticky; top: 0; z-index: 100; background: var(--doctor-page-bg); border-bottom: 0; box-shadow: none; min-height: 104px; display: flex; align-items: center; }
        .hcm-dashboard-header__inner { max-width: 1240px; margin: 0 auto; width: 100%; padding: 28px 36px 14px; display: grid; grid-template-columns: minmax(300px, 1fr) 324px auto; align-items: center; column-gap: 18px; row-gap: 14px; min-width: 0; box-sizing: border-box; }
        .hcm-dashboard-header__copy { min-width: 260px; }
        .doctor-page .hcm-dashboard-header__title { margin: 0; color: #101827; font-size: 25px !important; line-height: 1.1; font-weight: 800 !important; letter-spacing: 0 !important; }
        .hcm-dashboard-header__date { margin: 8px 0 0; color: #758096; font-size: 14px !important; line-height: 1.2; text-transform: none; }
        .hcm-dashboard-header__search { height: 43px; display: flex; align-items: center; gap: 12px; width: 324px; min-width: 0; max-width: 100%; background: #ffffff; border: 1px solid #dbe2ea; border-radius: 8px; padding: 0 13px; box-shadow: none; outline: none; }
        .hcm-dashboard-header__search input { font-size: 13px !important; color: #374151; }
        .hcm-dashboard-header__actions { display: flex; align-items: center; justify-content: flex-end; gap: 0; white-space: nowrap; min-width: 0; }
        .hcm-dashboard-header__notification-wrap { position: relative; padding: 0 23px; border-right: 1px solid #edf0f4; display: flex; align-items: center; justify-content: center; }
        .hcm-dashboard-header__notification { width: 42px; height: 42px; padding: 0 !important; border: 0 !important; border-radius: 8px !important; background: #ffffff; color: #101827; position: relative; display: inline-grid !important; place-items: center !important; cursor: pointer; }
        .hcm-dashboard-header__badge { position: absolute; top: 2px; right: 2px; min-width: 17px; height: 17px; border-radius: 999px; background: #ff333d; border: 2px solid #fff; color: #fff; display: inline-flex; align-items: center; justify-content: center; padding: 0 4px; font-size: 10px; font-weight: 800; }
        .hcm-dashboard-header__profile { margin-left: 24px; min-width: 166px; display: inline-flex; align-items: center; gap: 13px; border: 0 !important; background: transparent !important; padding: 0 !important; color: #101827; cursor: pointer; }
        .hcm-dashboard-header__avatar { width: 42px; height: 42px; border-radius: 50% !important; overflow: hidden; flex: 0 0 auto; background: linear-gradient(135deg, #0c3a24, #165034); display: grid; place-items: center; color: #fff; font-size: 13px; font-weight: 800; }
        .hcm-dashboard-header__avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
        .hcm-dashboard-header__profile-text { display: grid; gap: 5px; line-height: 1; text-align: left; }
        .hcm-dashboard-header__profile-text strong { color: #101827; font-size: 13px; font-weight: 800; white-space: nowrap; }
        .hcm-dashboard-header__profile-text span { color: #69758a; font-size: 12px; font-weight: 500; white-space: nowrap; }
        .doctor-content-shell { max-width: 1240px; width: 100%; margin: 0 auto; padding: 14px 36px 28px; box-sizing: border-box; }
        @media (max-width: 1180px) {
          .hcm-dashboard-header__inner { grid-template-columns: 1fr 300px; gap: 18px; padding: 28px 26px 14px; }
          .hcm-dashboard-header__actions { grid-column: 1 / -1; justify-content: flex-end; }
        }
        @media (max-width: 820px) {
          .hcm-dashboard-header__inner { grid-template-columns: 1fr; gap: 14px; padding: 22px 18px 14px; }
          .hcm-dashboard-header__search { width: 100%; }
          .hcm-dashboard-header__actions { justify-content: flex-start; flex-wrap: wrap; }
        }
        .doctor-dashboard-redesign { display: grid; gap: 22px; color: #202638; align-content: start; }
        .doctor-dash-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; align-items: stretch; }
        .doctor-dash-stat-card { min-height: 108px !important; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 23px 24px !important; display: flex; align-items: center; gap: 17px; box-shadow: 0 9px 22px rgba(16,24,39,0.075); overflow: hidden; box-sizing: border-box; transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
        .doctor-dash-stat-card:hover { transform: translateY(-1px); border-color: #dbe3ec; box-shadow: 0 9px 20px rgba(16,24,39,0.07); }
        .doctor-dash-stat-icon { width: 46px !important; height: 46px !important; border-radius: 999px; display: inline-flex !important; align-items: center !important; justify-content: center !important; flex: 0 0 46px; overflow: visible; margin: 0 !important; }
        .doctor-dash-stat-icon svg { width: 22px !important; height: 22px !important; stroke-width: 2.1; overflow: visible; }
        .doctor-dash-stat-card > div { min-width: 0; display: block; }
        .doctor-dash-stat-card strong { display: block; color: #202638; font-size: 24px !important; line-height: 1 !important; font-weight: 800; letter-spacing: 0 !important; white-space: nowrap; margin-bottom: 8px; }
        .doctor-dash-stat-card > div > span { display: block; margin-top: 0; color: #202638; font-size: 11px !important; line-height: 1.1 !important; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .doctor-dash-stat-card small { display: block; margin-top: 5px; color: #7d8597; font-size: 11px !important; line-height: 1.1 !important; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .doctor-dash-grid { display: grid; grid-template-columns: minmax(0, 1fr) 404px; gap: 18px; align-items: start; }
        .doctor-dash-left { display: grid; gap: 16px; min-width: 0; }
        .doctor-dash-side { display: grid; gap: 16px; }
        .doctor-dash-bottom-grid { display: grid; grid-template-columns: minmax(0, 1fr) 343px; gap: 18px; }
        .doctor-dash-panel { background: #ffffff; border: 1px solid #edf0f4; border-radius: 8px; padding: 18px 20px; box-shadow: 0 5px 14px rgba(16,24,39,0.045); min-width: 0; transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
        .doctor-dash-panel:hover { transform: translateY(-1px); border-color: #dbe3ec; box-shadow: 0 9px 20px rgba(16,24,39,0.07); }
        .doctor-dash-main-panel { min-height: 0; }
        .doctor-dash-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 16px; }
        .doctor-dash-panel-head h2 { margin: 0; color: #202638; font-size: 13px !important; line-height: 1.2; font-weight: 800 !important; }
        .doctor-dash-panel-head p { margin: 4px 0 0; color: #7d8597; font-size: 11px; font-weight: 600; }
        .doctor-dash-link { width: auto !important; min-height: 0 !important; padding: 0 !important; border: 0 !important; background: transparent !important; color: var(--hcm-primary-green) !important; font-size: 11px !important; font-weight: 800 !important; display: inline-flex; align-items: center; gap: 4px; }
        .doctor-dash-link::after { content: "->"; font-size: 10px; }
        .doctor-dash-table { border: 0; border-radius: 0; overflow: hidden; }
        .doctor-dash-table-row { display: grid; grid-template-columns: 110px minmax(140px, 1.08fr) minmax(150px, 1.45fr) 118px 132px; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f2f6; min-width: 0; }
        .doctor-dash-table-row:last-child { border-bottom: 0; }
        .doctor-dash-table-head { background: transparent; color: #9aa3b3; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; padding-top: 0; }
        .doctor-dash-patient-row { width: 100%; min-height: 50px; border-left: 0 !important; border-right: 0 !important; border-top: 0 !important; border-radius: 0 !important; background: #ffffff; text-align: left; cursor: pointer; color: #566074; }
        .doctor-dash-patient-row:hover { background: #fbfefc; }
        .doctor-dash-patient-row strong { display: block; color: #202638; font-size: 11px; font-weight: 800; }
        .doctor-dash-patient-row small { display: block; margin-top: 3px; color: #7d8597; font-size: 10px; font-weight: 600; }
        .doctor-dash-patient-row > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; font-weight: 600; }
        .doctor-dash-priority { width: 24px; height: 24px; border-radius: 999px; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px !important; font-weight: 800 !important; }
        .doctor-dash-status { justify-self: start; min-width: 0; border-radius: 5px; padding: 4px 9px; font-size: 10px !important; font-weight: 800 !important; }
        .doctor-dash-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .doctor-dash-actions button { min-height: 40px; padding: 9px 13px !important; border: 1px solid #e7ebf2 !important; background: #ffffff !important; color: #202638 !important; border-radius: 8px !important; display: inline-flex; align-items: center; justify-content: flex-start; gap: 10px; font-size: 10px !important; font-weight: 800 !important; }
        .doctor-dash-actions button:hover { background: var(--hcm-primary-green-soft) !important; border-color: #cfeedd !important; color: var(--hcm-primary-green) !important; }
        .doctor-dash-list { display: grid; gap: 8px; }
        .doctor-dash-list button { min-height: 38px; padding: 9px 0 !important; border: 0 !important; border-top: 1px solid #f0f2f6 !important; border-radius: 0 !important; background: transparent !important; display: grid; grid-template-columns: 43px 1fr auto; align-items: center; gap: 13px; text-align: left; color: #202638; }
        .doctor-dash-list button:first-child { border-top: 0 !important; padding-top: 0 !important; }
        .doctor-dash-list time { color: var(--hcm-primary-green); background: transparent; border-radius: 0; padding: 0; font-size: 10px; font-weight: 800; text-align: left; }
        .doctor-dash-list strong { font-size: 11px; font-weight: 800; }
        .doctor-dash-list span { border-radius: 6px; background: #fff7ed; color: #f97316; padding: 5px 7px; font-size: 9px; font-weight: 800; }
        .doctor-dash-colleagues { display: grid; gap: 0; }
        .doctor-dash-colleagues div { display: grid; grid-template-columns: 28px 1fr auto; column-gap: 13px; align-items: center; padding: 9px 0; border-top: 1px solid #f0f2f6; }
        .doctor-dash-colleagues div:first-child { border-top: 0; padding-top: 0; }
        .doctor-dash-colleagues div > span { grid-row: span 2; width: 28px; height: 28px; border-radius: 999px; background: #eef6f2; color: var(--hcm-primary-green); display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
        .doctor-dash-colleagues strong { color: #25314a; font-size: 11px; font-weight: 800; }
        .doctor-dash-colleagues small { color: #94a3b8; font-size: 10px; font-weight: 600; }
        .doctor-dash-colleagues em { grid-column: 3; grid-row: 1 / span 2; font-style: normal; font-size: 9px; font-weight: 800; }
        .doctor-dash-activity, .doctor-dash-alerts, .doctor-dash-exams { display: grid; gap: 10px; }
        .doctor-dash-activity div { display: grid; grid-template-columns: 24px 44px 1fr 74px; align-items: center; gap: 13px; min-height: 34px; padding: 9px 0; border-top: 1px solid #f0f2f6; }
        .doctor-dash-activity div:first-child { border-top: 0; padding-top: 0; }
        .doctor-dash-activity time { color: #64748b; font-size: 10px; font-weight: 800; }
        .doctor-dash-activity span { color: #475569; font-size: 11px; font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .doctor-dash-activity small { color: #94a3b8; font-size: 10px; font-weight: 700; }
        .doctor-dash-alerts button { min-height: 48px; border: 0 !important; border-radius: 8px !important; background: #fff1f2 !important; color: #ef4444 !important; padding: 10px 12px !important; display: grid; grid-template-columns: 18px 1fr; gap: 8px; align-items: center; text-align: left; }
        .doctor-dash-alerts strong { color: #e11d48; font-size: 11px; font-weight: 800; }
        .doctor-dash-alerts span { grid-column: 2; color: #f43f5e; font-size: 10px; font-weight: 700; margin-top: -4px; }
        .doctor-dash-exams button { min-height: 48px; border: 1px solid #eef2f6 !important; border-radius: 8px !important; background: #ffffff !important; color: #25314a !important; padding: 10px 12px !important; display: grid; grid-template-columns: 18px 1fr auto; gap: 10px; align-items: center; text-align: left; }
        .doctor-dash-exams strong { display: block; color: #25314a; font-size: 11px; font-weight: 800; }
        .doctor-dash-exams small { display: block; color: #94a3b8; font-size: 10px; font-weight: 600; margin-top: 2px; }
        .doctor-dash-exams em { font-style: normal; border-radius: 6px; background: var(--hcm-primary-green-soft); color: var(--hcm-primary-green); padding: 5px 7px; font-size: 9px; font-weight: 800; }
        .doctor-dash-empty { color: #94a3b8; font-size: 11px; font-weight: 600; padding: 10px 0; }
        .doctor-dash-footer { display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px; font-weight: 600; padding: 8px 2px 0; }
        @media (max-width: 1240px) {
          .doctor-dash-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .doctor-dash-grid, .doctor-dash-bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 820px) {
          .doctor-dash-hero { grid-template-columns: 1fr; }
          .doctor-dash-stats { grid-template-columns: 1fr; }
          .doctor-dash-table { overflow-x: auto; }
          .doctor-dash-table-row { min-width: 760px; }
          .doctor-dash-actions { grid-template-columns: 1fr; }
        }
        .popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.38);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 18px;
        }
        .popup-card {
          width: min(390px, 100%);
          background: #fff;
          border: 1px solid #e4ece7;
          border-radius: 24px;
          box-shadow: 0 32px 80px rgba(15, 23, 42, 0.22);
          padding: 28px 24px 24px;
          text-align: center;
          animation: doctorPopupIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .popup-icon {
          width: 64px;
          height: 64px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin: 0 auto 18px;
        }
        .popup-icon-warning { background: #fff1f2; color: #be123c; }
        .popup-icon-success { background: #e8f7ee; color: #0c3a24; }
        @keyframes doctorPopupIn {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
`;
