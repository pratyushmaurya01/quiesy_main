import { useEffect, useState } from "react"

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        setIsDark(
            document.documentElement.classList.contains("dark")
        )
    }, [])

    const toggleTheme = () => {
        const nextIsDark = !isDark

        document.documentElement.classList.toggle(
            "dark",
            nextIsDark
        )

        localStorage.setItem(
            "theme",
            nextIsDark ? "dark" : "light"
        )

        setIsDark(nextIsDark)
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={
                isDark
                    ? "Switch to light mode"
                    : "Switch to dark mode"
            }
            title={
                isDark
                    ? "Switch to light mode"
                    : "Switch to dark mode"
            }
            className="
                flex h-9 w-9 items-center justify-center
                rounded-lg
                border border-slate-200
                bg-white
                text-slate-600
                transition-all duration-200
                hover:-translate-y-0.5
                hover:bg-slate-50
                hover:text-slate-900
                focus:outline-none
                focus:ring-2 focus:ring-blue-500/30
                dark:border-slate-800
                dark:bg-slate-900
                dark:text-slate-300
                dark:hover:bg-slate-800
                dark:hover:text-white
            "
        >
            {isDark ? (
                <svg
                    className="h-[18px] w-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <circle cx="12" cy="12" r="4" />
                    <path
                        strokeLinecap="round"
                        d="
                            M12 2v2
                            M12 20v2
                            M4.93 4.93l1.41 1.41
                            M17.66 17.66l1.41 1.41
                            M2 12h2
                            M20 12h2
                            M4.93 19.07l1.41-1.41
                            M17.66 6.34l1.41-1.41
                        "
                    />
                </svg>
            ) : (
                <svg
                    className="h-[18px] w-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"
                    />
                </svg>
            )}
        </button>
    )
}