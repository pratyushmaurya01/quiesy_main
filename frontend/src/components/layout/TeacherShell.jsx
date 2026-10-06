import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import ThemeToggle from "../ThemeToggle"
import { useAuth } from "../../context/AuthContext"

function Icon({ name, collapsed }) {
    const cls = `h-[20px] w-[20px] shrink-0 transition-colors ${collapsed ? "" : "group-hover:text-primary dark:group-hover:text-blue-400"}`
    const common = {
        className: cls,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.8",
        viewBox: "0 0 24 24",
    }

    const paths = {
        dashboard: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </>
        ),
        questions: (
            <>
                <path strokeLinecap="round" d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 014 15.5v-10z" />
                <path strokeLinecap="round" d="M8 7h8M8 11h8M8 15h5" />
            </>
        ),
        quizzes: (
            <>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path strokeLinecap="round" d="M7 8h10M7 12h6M7 16h4" />
            </>
        ),
        results: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16" />
                <path strokeLinecap="round" d="M8 16v-4M12 16V8M16 16v-7" />
            </>
        ),
        settings: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1.03 1.56V20H10v-.2a1.7 1.7 0 00-1.03-1.56 1.7 1.7 0 00-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 005.73 15 1.7 1.7 0 004.2 14H4v-4h.2a1.7 1.7 0 001.53-1 1.7 1.7 0 00-.34-1.88l-.06-.06 1.7-1.7.06.06a1.7 1.7 0 001.88.34A1.7 1.7 0 0010 4.2V4h4v.2a1.7 1.7 0 001.03 1.56 1.7 1.7 0 001.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0018.27 9a1.7 1.7 0 001.53 1H20v4h-.2a1.7 1.7 0 00-.4 1z" />
            </>
        ),
    }

    return <svg {...common}>{paths[name]}</svg>
}

// Sidebar toggle icons (ChatGPT / Claude style)
function CollapseIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M21 19l-7-7 7-7" />
        </svg>
    )
}
function ExpandIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M3 5l7 7-7 7" />
        </svg>
    )
}

const navItems = [
    { label: "Dashboard",     to: "/dashboard",     icon: "dashboard" },
    { label: "Question Bank", to: "/question-bank", icon: "questions" },
    { label: "Quizzes",       to: "/create-quiz",   icon: "quizzes"   },
]

export default function TeacherShell({ children, noPadding = false, breadcrumbs = null }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [collapsed, setCollapsed] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate("/")
    }

    const sidebarW = collapsed ? "w-[72px]"    : "w-[280px]"
    const mainPL   = collapsed ? "lg:pl-[72px]"  : "lg:pl-[280px]"
    const headerL  = collapsed ? "lg:left-[72px]" : "lg:left-[280px]"

    return (
        <div className="min-h-screen bg-[#f6f8fa] dark:bg-[#101114] font-body-md text-slate-900 dark:text-white antialiased">

            {/* ── Sidebar ── */}
            <aside
                className={`
                    fixed left-0 top-0 h-full
                    ${sidebarW}
                    bg-[#181a20] dark:bg-[#101114]
                    border-r border-slate-200/80 dark:border-slate-800
                    text-slate-300 dark:text-slate-400
                    z-50 flex flex-col shadow-xl dark:shadow-none
                    overflow-x-hidden select-none
                    transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    hidden lg:flex
                `}
            >
                {/* Header: logo + brand + toggle */}
                <div
                    className={`
                        h-20 flex items-center shrink-0
                        border-b border-slate-200/80 dark:border-slate-800
                        ${collapsed ? "flex-col justify-center gap-1.5 px-2" : "justify-between px-5"}
                    `}
                >
                    {!collapsed && (
                        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                            <div className="flex h-8 w-8 min-w-[32px] items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm shrink-0">
                                Q
                            </div>
                            <span className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                                Quiesy
                            </span>
                        </div>
                    )}

                    {/* Collapse / Expand toggle */}
                    <button
                        onClick={() => setCollapsed(v => !v)}
                        title={collapsed ? "Expand sidebar (Ctrl+\\)" : "Collapse sidebar (Ctrl+\\)"}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    >
                        {collapsed ? <ExpandIcon /> : <CollapseIcon />}
                    </button>

                    {/* Mini logo visible only when collapsed */}
                    {collapsed && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm">
                            Q
                        </div>
                    )}
                </div>

                {/* Nav links */}
                <nav
                    className={`
                        flex-1 py-4 space-y-1.5 overflow-y-auto
                        ${collapsed ? "px-2 flex flex-col items-center" : "px-3"}
                    `}
                >
                    {navItems.map((item) => (
                        <div key={item.label} className="relative group w-full flex justify-center">
                            <NavLink
                                to={item.to}
                                className={({ isActive }) => `
                                    flex items-center transition-all cursor-pointer
                                    ${collapsed
                                        ? "w-11 h-11 justify-center rounded-xl"
                                        : "h-11 px-3.5 rounded-xl w-full"
                                    }
                                    ${isActive
                                        ? "bg-blue-600 text-white shadow-sm shadow-blue-900/30"
                                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                    }
                                `}
                            >
                                <span className="flex items-center justify-center shrink-0">
                                    <Icon name={item.icon} collapsed={collapsed} />
                                </span>

                                {/* Label — fades out when collapsed */}
                                <span
                                    className={`
                                        ml-3.5 whitespace-nowrap font-label-md text-[14px] font-medium
                                        transition-[opacity,width] duration-200
                                        ${collapsed ? "opacity-0 w-0 overflow-hidden pointer-events-none" : "opacity-100"}
                                    `}
                                >
                                    {item.label}
                                </span>
                            </NavLink>

                            {/* Tooltip — shown on hover only in collapsed state */}
                            {collapsed && (
                                <div className="
                                    pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2
                                    px-2.5 py-1
                                    bg-slate-800 text-white
                                    text-[12px] font-semibold rounded-md shadow-lg whitespace-nowrap z-50
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-150 border border-slate-700
                                ">
                                    {item.label}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User profile */}
                <div
                    className={`
                        border-t border-slate-200/80 dark:border-slate-800
                        ${collapsed ? "p-3 flex justify-center" : "p-4"}
                    `}
                >
                    <div className="relative group flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">
                            {user?.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>

                        {!collapsed && (
                            <div className="overflow-hidden flex-1 min-w-0">
                                <p className="text-[13px] text-white truncate font-semibold leading-snug tracking-tight">
                                    {user?.name || "Pratyush Maurya"}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate font-medium">
                                    Teacher
                                </p>
                            </div>
                        )}

                        {!collapsed && (
                            <button
                                type="button"
                                onClick={handleLogout}
                                title="Logout"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path strokeLinecap="round" d="M10 17l5-5-5-5M15 12H3" />
                                    <path strokeLinecap="round" d="M21 19V5a2 2 0 00-2-2h-5" />
                                </svg>
                            </button>
                        )}

                        {/* User tooltip when collapsed */}
                        {collapsed && (
                            <div className="
                                pointer-events-none absolute left-full bottom-0 ml-2
                                px-2.5 py-1.5
                                bg-surface-container-highest dark:bg-[#2d2d2d]
                                text-inverse-surface dark:text-[#f9fafb]
                                text-[12px] rounded-md shadow-lg whitespace-nowrap z-50
                                opacity-0 group-hover:opacity-100 transition-opacity duration-150
                            ">
                                <div className="font-semibold">{user?.name || "John Doe"}</div>
                                <div className="text-[11px] opacity-60">Teacher</div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Main content wrapper ── */}
            <div
                className={`
                    ${mainPL}
                    transition-[padding-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                `}
            >
                {/* Header */}
                <header
                    className={`
                        fixed top-0 ${headerL} right-0 left-0 h-16
                        bg-white/90 dark:bg-[#101114]/90
                        backdrop-blur-xl dark:backdrop-blur-md
                        shadow-[0_1px_4px_rgba(0,0,0,0.03)] dark:shadow-none
                        border-b border-slate-300/80 dark:border-slate-800
                        z-40 flex items-center justify-between px-4 lg:px-8
                        transition-[left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    `}
                >
                    <div className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400 font-medium overflow-hidden">
                        <NavLink to="/" className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            <span>Home</span>
                        </NavLink>

                        <span className="text-slate-300 dark:text-slate-700">/</span>

                        <NavLink 
                            to="/dashboard" 
                            className={`transition-colors cursor-pointer shrink-0 ${
                                breadcrumbs && breadcrumbs.length > 0
                                    ? "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium"
                                    : "text-slate-900 dark:text-white font-semibold"
                            }`}
                        >
                            Dashboard
                        </NavLink>

                        {breadcrumbs && breadcrumbs.map((crumb, idx) => (
                            <span key={idx} className="flex items-center gap-2 shrink-0">
                                <span className="text-slate-300 dark:text-slate-700">/</span>
                                {crumb.to ? (
                                    <NavLink to={crumb.to} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer">
                                        {crumb.label}
                                    </NavLink>
                                ) : (
                                    <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[160px] sm:max-w-[260px]">
                                        {crumb.label}
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />

                        <div className="relative items-center hidden sm:flex">
                            <svg className="absolute left-3 text-slate-400 w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                className="bg-slate-100/90 border border-slate-200/80 text-slate-800 rounded-lg py-1.5 pl-9 pr-4 w-60 text-[13px] outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:bg-[#202020] dark:border-[#3a3a3a] dark:text-[#f3f4f6] dark:placeholder:text-[#6b7280] dark:focus:ring-blue-500"
                                placeholder="Search exams, questions..."
                                type="text"
                            />
                        </div>

                        {/* Logout button (replaced bell icon) */}
                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Log out"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-500/10 border border-slate-200/80 dark:border-slate-800 transition-all duration-200 cursor-pointer active:scale-95"
                        >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path strokeLinecap="round" d="M10 17l5-5-5-5M15 12H3" />
                                <path strokeLinecap="round" d="M21 19V5a2 2 0 00-2-2h-5" />
                            </svg>
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </header>

                <main className={`relative pt-16 min-h-screen ${noPadding ? "" : "px-4 lg:px-8 py-8"}`}>
                    {children}
                </main>
            </div>
        </div>
    )
}