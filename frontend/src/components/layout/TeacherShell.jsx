import { useState } from "react"
import { NavLink } from "react-router-dom"
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
    { label: "Results",       to: "/results",       icon: "results"   },
    { label: "Settings",      to: "/settings",      icon: "settings"  },
]

export default function TeacherShell({ children }) {
    const { user, logout } = useAuth()
    const [collapsed, setCollapsed] = useState(false)

    const sidebarW = collapsed ? "w-[72px]"    : "w-[280px]"
    const mainPL   = collapsed ? "lg:pl-[72px]"  : "lg:pl-[280px]"
    const headerL  = collapsed ? "lg:left-[72px]" : "lg:left-[280px]"

    return (
        <div className="min-h-screen bg-surface dark:bg-[#181818] font-body-md text-on-surface dark:text-[#f9fafb] antialiased">

            {/* ── Sidebar ── */}
            <aside
                className={`
                    fixed left-0 top-0 h-full
                    ${sidebarW}
                    bg-inverse-surface dark:bg-[#1e1e1e]
                    dark:border-r dark:border-[#2e2e2e]
                    text-on-primary-container dark:text-[#9ca3af]
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
                        border-b border-on-surface-variant/15 dark:border-[#2e2e2e]
                        ${collapsed ? "flex-col justify-center gap-1.5 px-2" : "justify-between px-5"}
                    `}
                >
                    {!collapsed && (
                        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                            <div className="flex h-8 w-8 min-w-[32px] items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow-sm shrink-0">
                                Q
                            </div>
                            <span className="text-[20px] font-bold text-surface-bright dark:text-[#f9fafb] tracking-tight whitespace-nowrap">
                                Quiesy
                            </span>
                        </div>
                    )}

                    {/* Collapse / Expand toggle */}
                    <button
                        onClick={() => setCollapsed(v => !v)}
                        title={collapsed ? "Expand sidebar (Ctrl+\\)" : "Collapse sidebar (Ctrl+\\)"}
                        className="p-1.5 rounded-lg text-on-primary-container/70 hover:text-white hover:bg-surface-variant/20 active:scale-95 transition-all flex items-center justify-center shrink-0"
                    >
                        {collapsed ? <ExpandIcon /> : <CollapseIcon />}
                    </button>

                    {/* Mini logo visible only when collapsed */}
                    {collapsed && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white shadow-sm">
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
                                    flex items-center transition-all
                                    ${collapsed
                                        ? "w-11 h-11 justify-center rounded-xl"
                                        : "h-11 px-3.5 rounded-xl w-full"
                                    }
                                    ${isActive
                                        ? "bg-primary-container text-on-primary-container shadow-sm shadow-primary-container/30 dark:bg-blue-600 dark:text-white dark:shadow-blue-900/30"
                                        : "text-on-primary-container/70 hover:bg-surface-variant/15 hover:text-on-primary-container dark:hover:bg-[#282828] dark:hover:text-[#f9fafb]"
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
                                    bg-surface-container-highest dark:bg-[#2d2d2d]
                                    text-inverse-surface dark:text-[#f9fafb]
                                    text-[12px] font-semibold rounded-md shadow-lg whitespace-nowrap z-50
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-150
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
                        border-t border-on-surface-variant/15 dark:border-[#2e2e2e]
                        ${collapsed ? "p-3 flex justify-center" : "p-4"}
                    `}
                >
                    <div className="relative group flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-xl bg-primary dark:bg-blue-600 flex items-center justify-center text-on-primary shrink-0 shadow-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">
                            {user?.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>

                        {!collapsed && (
                            <div className="overflow-hidden flex-1">
                                <p className="font-label-md text-[14px] text-surface-bright dark:text-[#f9fafb] truncate font-semibold leading-tight">
                                    {user?.name || "John Doe"}
                                </p>
                                <p className="text-[12px] text-on-primary-container/60 dark:text-[#9ca3af] truncate mt-0.5">
                                    Teacher
                                </p>
                            </div>
                        )}

                        {!collapsed && (
                            <button
                                type="button"
                                onClick={logout}
                                title="Logout"
                                className="rounded-lg p-1.5 text-on-primary-container/50 hover:bg-surface-variant/10 hover:text-red-400 transition-colors shrink-0"
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
                        bg-surface/80 dark:bg-[#1e1e1e]/90
                        backdrop-blur-xl dark:backdrop-blur-md
                        shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none
                        dark:border-b dark:border-[#2e2e2e]
                        z-40 flex items-center justify-between px-4 lg:px-8
                        transition-[left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    `}
                >
                    <div className="flex items-center gap-2.5 text-[13px] text-on-surface-variant dark:text-[#9ca3af] font-medium">
                        {/* Topbar sidebar toggle */}
                        <button
                            onClick={() => setCollapsed(v => !v)}
                            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                            className="p-1.5 -ml-1.5 rounded-lg text-on-surface-variant hover:text-primary dark:hover:text-[#f9fafb] hover:bg-surface-container-low dark:hover:bg-[#2a2a2a] transition-colors flex items-center justify-center"
                        >
                            {collapsed ? <ExpandIcon /> : <CollapseIcon />}
                        </button>

                        <span className="hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">Quiesy</span>
                        <svg className="w-4 h-4 text-on-surface-variant dark:text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-on-surface dark:text-[#f9fafb] font-semibold">Dashboard</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />

                        <div className="relative items-center hidden sm:flex">
                            <svg className="absolute left-3 text-on-surface-variant dark:text-[#9ca3af] w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                className="bg-surface-container-low dark:bg-[#202020] border-none dark:border dark:border-[#3a3a3a] dark:text-[#f3f4f6] rounded-full dark:rounded-lg py-1.5 pl-9 pr-4 w-64 text-[13px] focus:ring-1 focus:ring-primary-container dark:focus:ring-blue-500 outline-none transition-all placeholder:text-on-surface-variant dark:placeholder:text-[#6b7280]"
                                placeholder="Search exams, questions..."
                                type="text"
                            />
                        </div>

                        <button className="relative p-2 text-on-surface-variant dark:text-[#9ca3af] hover:text-primary dark:hover:text-[#f9fafb] transition-colors hover:bg-surface-container-low dark:hover:bg-[#2a2a2a] rounded-full dark:rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-error dark:bg-red-500 rounded-full ring-2 ring-surface dark:ring-[#1e1e1e]"></span>
                        </button>
                    </div>
                </header>

                <main className="relative pt-16 bg-surface dark:bg-[#181818] min-h-screen px-4 lg:px-8 py-8">
                    {children}
                </main>
            </div>
        </div>
    )
}