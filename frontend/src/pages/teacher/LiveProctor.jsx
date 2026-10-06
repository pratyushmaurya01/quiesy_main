import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import TeacherShell from "../../components/layout/TeacherShell"
import { getLiveProctorRoster } from "../../api/quizzes"

export default function LiveProctor() {
  const { quizId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [quizData, setQuizData] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [stats, setStats] = useState({
    total_online: 0,
    currently_active: 0,
    currently_blocked: 0,
    avg_tab_switches: 0,
  })

  // Filters & Search
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("all") // 'all' | 'active' | 'switched' | 'blocked' | 'submitted'
  const [sortBy, setSortBy] = useState("recent")

  // Unblock Modal State
  const [unblockModalStudent, setUnblockModalStudent] = useState(null)
  const [pardonOption, setPardonOption] = useState("reset_2") // 'reset_2' | 'reset_0'
  const [unblockingLoading, setUnblockingLoading] = useState(false)

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState("")

  // Live Telemetry Alerts stream
  const [telemetryAlerts, setTelemetryAlerts] = useState([])
  const [alertFilter, setAlertFilter] = useState("all")

  // WebSocket Ref
  const wsRef = useRef(null)

  const reconnectTimeoutRef = useRef(null)
  const isIntentionalCloseRef = useRef(false)
  const announcedJoinsRef = useRef(new Set())

  // 1. Initial Load of Proctor Roster
  const fetchRoster = async () => {
    try {
      setLoading(true)
      const res = await getLiveProctorRoster(quizId)
      setQuizData(res.data)
      const initialCandidates = res.data.candidates || []
      setCandidates(initialCandidates)

      // Pre-seed announced joins with existing active candidates so initial load doesn't trigger alerts
      initialCandidates.forEach((c) => {
        if (c.attempt_id) {
          announcedJoinsRef.current.add(String(c.attempt_id))
        }
      })
    } catch (err) {
      console.error("Failed to load proctor roster:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoster()
  }, [quizId])

  // 2. Connect WebSocket to Room Group: quiz_proctor_{quizId} with Auto-Reconnect
  useEffect(() => {
    if (!quizId) return

    isIntentionalCloseRef.current = false

    const connectWs = () => {
      if (isIntentionalCloseRef.current) return

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const wsHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "127.0.0.1:8000" : window.location.host
      const wsUrl = `${wsProtocol}//${wsHost}/ws/quiz-proctor/${quizId}/`

      console.log(`[LiveProctor WS] Connecting to ${wsUrl}...`)
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log(`[LiveProctor WS] Connected successfully to quiz_proctor_${quizId}`)
      }

      ws.onerror = (err) => {
        console.warn("[LiveProctor WS] Error:", err)
      }

      ws.onclose = (ev) => {
        console.log(`[LiveProctor WS] Closed (code: ${ev.code})`)
        if (!isIntentionalCloseRef.current && ev.code !== 1000) {
          console.log("[LiveProctor WS] Scheduling reconnect in 2.5s...")
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWs()
          }, 2500)
        }
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          const { event: evtType, data } = payload

          if (evtType === "STUDENT_JOINED") {
            const isBlockedCandidate = Boolean(data.is_blocked || data.tab_switch_count >= 3)

            // Upsert candidate in state
            setCandidates((prev) => {
              const exists = prev.some((c) => String(c.attempt_id) === String(data.attempt_id))
              if (exists) {
                return prev.map((c) =>
                  String(c.attempt_id) === String(data.attempt_id)
                    ? { ...c, ...data, is_blocked: isBlockedCandidate }
                    : c
                )
              }
              return [
                {
                  attempt_id: data.attempt_id,
                  student_id: data.student_id,
                  student_name: data.student_name,
                  email: data.email,
                  status: data.status || "IN_PROGRESS",
                  is_blocked: isBlockedCandidate,
                  tab_switch_count: data.tab_switch_count || 0,
                  score: data.score || 0,
                  max_score: data.max_score || 0,
                  answered_count: data.answered_count || 0,
                  seconds_left: data.seconds_left,
                  started_at: data.started_at || data.joined_at || new Date().toISOString(),
                  joined_at: data.joined_at || data.started_at || new Date().toISOString(),
                },
                ...prev,
              ]
            })

            // Only add join log to Telemetry stream once per examinee session
            const attemptKey = String(data.attempt_id)
            if (!announcedJoinsRef.current.has(attemptKey)) {
              announcedJoinsRef.current.add(attemptKey)
              const joinAlert = {
                id: Date.now(),
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                name: data.student_name,
                email: data.email,
                attempt_id: data.attempt_id,
                switches: data.tab_switch_count || 0,
                is_blocked: isBlockedCandidate,
                severity: "info",
                msg: `${data.student_name} joined the exam session.`,
              }
              setTelemetryAlerts((prev) => [joinAlert, ...prev.slice(0, 19)])
            }

          } else if (evtType === "TAB_SWITCH_LOGGED") {
            const isBlockedNow = Boolean(data.is_blocked || data.tab_switch_count >= 3)

            // Update candidate in state or upsert if missing
            setCandidates((prev) => {
              const exists = prev.some((c) => String(c.attempt_id) === String(data.attempt_id))
              if (exists) {
                return prev.map((c) =>
                  String(c.attempt_id) === String(data.attempt_id)
                    ? {
                        ...c,
                        tab_switch_count: data.tab_switch_count,
                        is_blocked: isBlockedNow,
                        paused_seconds_remaining: data.paused_seconds_remaining ?? c.paused_seconds_remaining,
                        seconds_left: data.paused_seconds_remaining ?? c.seconds_left,
                      }
                    : c
                )
              }
              // If candidate wasn't in state yet, add them
              return [
                {
                  attempt_id: data.attempt_id,
                  student_id: data.student_id,
                  student_name: data.student_name,
                  email: data.email,
                  status: "IN_PROGRESS",
                  is_blocked: isBlockedNow,
                  tab_switch_count: data.tab_switch_count,
                  paused_seconds_remaining: data.paused_seconds_remaining,
                  seconds_left: data.paused_seconds_remaining ?? 0,
                },
                ...prev,
              ]
            })

            // Add to Live Telemetry stream immediately
            const alertItem = {
              id: Date.now(),
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              name: data.student_name,
              email: data.email,
              attempt_id: data.attempt_id,
              switches: data.tab_switch_count,
              is_blocked: isBlockedNow,
              severity: isBlockedNow ? "critical" : "warning",
              msg: isBlockedNow
                ? `🚨 ${data.student_name} locked after ${data.tab_switch_count}/3 tab switches.`
                : `⚠️ ${data.student_name} switched tabs (${data.tab_switch_count}/3 warning).`,
            }
            setTelemetryAlerts((prev) => [alertItem, ...prev.slice(0, 19)])

          } else if (evtType === "STUDENT_UNBLOCKED") {
            setCandidates((prev) =>
              prev.map((c) =>
                String(c.attempt_id) === String(data.attempt_id)
                  ? {
                      ...c,
                      is_blocked: false,
                      tab_switch_count: data.tab_switch_count,
                      seconds_left: data.seconds_left ?? c.seconds_left,
                    }
                  : c
              )
            )

            const unblockAlert = {
              id: Date.now(),
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              name: data.student_name,
              email: data.email,
              attempt_id: data.attempt_id,
              switches: data.tab_switch_count,
              is_blocked: false,
              severity: "info",
              msg: `🔓 ${data.student_name} was unblocked by proctor (warnings: ${data.tab_switch_count}/3).`,
            }
            setTelemetryAlerts((prev) => [unblockAlert, ...prev.slice(0, 19)])

          } else if (evtType === "STUDENT_HEARTBEAT") {
            setCandidates((prev) =>
              prev.map((c) =>
                String(c.attempt_id) === String(data.attempt_id)
                  ? {
                      ...c,
                      seconds_left: data.seconds_left ?? c.seconds_left,
                      answered_count: data.answered_count ?? c.answered_count,
                    }
                  : c
              )
            )
          } else if (evtType === "STUDENT_SUBMITTED") {
            setCandidates((prev) =>
              prev.map((c) =>
                String(c.attempt_id) === String(data.attempt_id)
                  ? {
                      ...c,
                      status: "SUBMITTED",
                      score: data.score ?? c.score,
                      max_score: data.max_score ?? c.max_score,
                    }
                  : c
              )
            )
            const submitAlert = {
              id: Date.now(),
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              name: data.student_name,
              email: data.email,
              attempt_id: data.attempt_id,
              switches: data.tab_switch_count || 0,
              is_blocked: false,
              severity: "info",
              msg: `🎉 ${data.student_name} submitted their exam.`,
            }
            setTelemetryAlerts((prev) => [submitAlert, ...prev.slice(0, 19)])
          }
        } catch (err) {
          console.error("Error parsing proctor event:", err)
        }
      }
    }

    connectWs()

    return () => {
      isIntentionalCloseRef.current = true
      clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close(1000, "Component unmounted")
      }
    }
  }, [quizId])

  // Dynamically compute live stats from candidates so it is always 100% synchronized
  const liveStats = useMemo(() => {
    const total = candidates.length
    const blocked = candidates.filter((c) => c.is_blocked || c.tab_switch_count >= 3).length
    const active = candidates.filter((c) => !c.is_blocked && c.tab_switch_count < 3 && c.status === "IN_PROGRESS").length
    const totalSwitches = candidates.reduce((sum, c) => sum + (c.tab_switch_count || 0), 0)
    const avg = total > 0 ? (totalSwitches / total).toFixed(1) : "0"

    return {
      total_online: total,
      currently_active: active,
      currently_blocked: blocked,
      avg_tab_switches: avg,
    }
  }, [candidates])

  // Unblock Action
  const handleAuthorizeUnblock = () => {
    if (!unblockModalStudent || !wsRef.current) return
    setUnblockingLoading(true)

    const resetCounter = pardonOption === "reset_0"

    wsRef.current.send(
      JSON.stringify({
        action: "TEACHER_UNBLOCK",
        attempt_id: unblockModalStudent.attempt_id,
        reset_counter: resetCounter,
      })
    )

    setUnblockingLoading(false)
    setUnblockModalStudent(null)
  }

  // Broadcast Announcement
  const handleSendBroadcast = () => {
    if (!broadcastMsg.trim() || !wsRef.current) return

    wsRef.current.send(
      JSON.stringify({
        action: "TEACHER_BROADCAST",
        message: broadcastMsg.trim(),
      })
    )

    setBroadcastMsg("")
    setShowBroadcastModal(false)
  }

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        // Status filter
        if (activeFilter === "active" && (c.is_blocked || c.tab_switch_count >= 3 || c.status !== "IN_PROGRESS")) return false
        if (activeFilter === "blocked" && !(c.is_blocked || c.tab_switch_count >= 3)) return false
        if (activeFilter === "switched" && c.tab_switch_count === 0) return false
        if (activeFilter === "submitted" && c.status !== "SUBMITTED" && c.status !== "EVALUATED") return false

        // Search filter
        if (search) {
          const q = search.toLowerCase()
          return c.student_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === "recent") {
          const timeA = a.joined_at || a.started_at ? new Date(a.joined_at || a.started_at).getTime() : 0
          const timeB = b.joined_at || b.started_at ? new Date(b.joined_at || b.started_at).getTime() : 0
          return timeB - timeA
        }
        if (sortBy === "infractions") return b.tab_switch_count - a.tab_switch_count
        if (sortBy === "time") return a.seconds_left - b.seconds_left
        if (sortBy === "name") return a.student_name.localeCompare(b.student_name)
        if (sortBy === "progress") return b.answered_count - a.answered_count
        return 0
      })
  }, [candidates, activeFilter, search, sortBy])

  // Format Seconds to MM:SS
  const formatTime = (secs) => {
    if (secs === null || secs === undefined || secs < 0) return "00:00"
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  return (
    <TeacherShell
      breadcrumbs={[
        { label: "Quizzes", to: "/dashboard" },
        { label: quizData?.quiz_title || "Results", to: `/quiz/${quizId}/results` },
        { label: "Live Proctoring" },
      ]}
    >
      <div className="w-full max-w-[1600px] mx-auto pb-16 flex flex-col gap-6 text-slate-900 dark:text-slate-100">
        
        {/* --- SECTION 1: HEADER & LIVE CONTROLS --- */}
        <section className="pt-2 sm:pt-4 flex flex-col gap-3 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Teacher Dashboard</Link>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <Link to={`/quiz/${quizId}/results`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Results</Link>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Live Proctoring</span>
              </nav>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {quizData?.quiz_title || "Live Proctoring Cockpit"}
              </h1>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-[#1E2128] border border-slate-200 dark:border-slate-700/80 rounded-md font-semibold text-slate-700 dark:text-slate-300">
                  {quizData?.subject || "Examination"}
                </span>
                <span>•</span>
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  Code: {quizData?.quiz_code}
                </span>
                <span>•</span>
                <span>Total Marks: {quizData?.quiz_max_score} Pts</span>
              </div>
            </div>

            {/* Top Status & Action Row (Uniform heights & clean alignment) */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* LIVE EXAM IN PROGRESS Badge */}
              <div className="h-10 px-3.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 select-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  LIVE EXAM IN PROGRESS
                </span>
              </div>

              {/* Broadcast Notice Button */}
              <button
                onClick={() => setShowBroadcastModal(true)}
                type="button"
                className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm shadow-blue-600/25 cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <span>Broadcast Notice</span>
              </button>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: STATS SUMMARY TILES (4 TILES) --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Online Candidates */}
          <div className="relative p-5 rounded-xl bg-white dark:bg-[#141518] border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col justify-between text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Online Candidates
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/50 dark:border-blue-900/40">
                Roster
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {liveStats.total_online}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Examinees currently registered
            </span>
          </div>

          {/* Currently Active */}
          <div className="relative p-5 rounded-xl bg-white dark:bg-[#141518] border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col justify-between text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Currently Active
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200/50 dark:border-emerald-900/40">
                Active
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {liveStats.currently_active}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              In focus & answering questions
            </span>
          </div>

          {/* Currently Blocked (Luminous Coral #FF6B6B contrast fix) */}
          <div className="relative p-5 rounded-xl bg-white dark:bg-[#141518] border border-rose-300/80 dark:border-rose-900/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col justify-between text-left bg-rose-50/30 dark:bg-rose-950/15">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF6B6B] dark:text-[#FF7B7B]">
                Currently Blocked
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-[#FF5252] dark:text-[#FF7B7B] font-bold border border-rose-200/80 dark:border-rose-800/60">
                Action Needed
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-[#FF5252] dark:text-[#FF6B6B]">
                {liveStats.currently_blocked}
              </span>
            </div>
            <span className="text-[11px] text-[#FF6B6B]/90 dark:text-[#FF8A8A] mt-2 font-medium">
              &gt;3 tab switches (Session Frozen)
            </span>
          </div>

          {/* Avg. Tab Switches */}
          <div className="relative p-5 rounded-xl bg-white dark:bg-[#141518] border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col justify-between text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Avg. Tab Switches
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-semibold border border-slate-200 dark:border-slate-700">
                Max 3
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {liveStats.avg_tab_switches}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Real-time anti-cheat threshold
            </span>
          </div>
        </section>

        {/* --- SECTION 3: LIVE TELEMETRY STREAM (COMPACT ALERTS) --- */}
        {telemetryAlerts.length > 0 && (
          <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Live Telemetry Alerts</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{telemetryAlerts.length} recent events</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {telemetryAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                    alert.severity === "critical"
                      ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                      : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${alert.severity === "critical" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {alert.severity === "critical" ? "🚫 AUTO-FROZEN" : "⚠️ TAB SWITCH"}
                    </span>
                    <span className="text-slate-400 font-mono">{alert.time}</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium line-clamp-2">
                    {alert.msg}
                  </p>
                  {alert.is_blocked && (
                    <button
                      onClick={() => setUnblockModalStudent(alert)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline self-end cursor-pointer"
                    >
                      Authorize Unblock →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- SECTION 4: CONTROLS & FILTER BAR --- */}
        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate by name or email..."
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="recent">Sort: Recently Joined (Newest First)</option>
                <option value="infractions">Sort: Highest Warnings</option>
                <option value="time">Sort: Lowest Time Left</option>
                <option value="name">Sort: Candidate Name (A–Z)</option>
                <option value="progress">Sort: Questions Answered</option>
              </select>
            </div>
          </div>

          {/* Filter Pills (Cleaned label: "Blocked" instead of "Blocked (3/3)") */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold custom-scrollbar">
            {[
              { id: "all", label: "All Candidates", count: candidates.length },
              { id: "active", label: "Active", count: candidates.filter(c => !c.is_blocked && c.tab_switch_count < 3 && c.status === "IN_PROGRESS").length },
              { id: "switched", label: "Tab Switched", count: candidates.filter(c => c.tab_switch_count > 0).length },
              { id: "blocked", label: "Blocked", count: candidates.filter(c => c.is_blocked || c.tab_switch_count >= 3).length },
              { id: "submitted", label: "Submitted", count: candidates.filter(c => c.status === "SUBMITTED" || c.status === "EVALUATED").length },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setActiveFilter(pill.id)}
                type="button"
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeFilter === pill.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-[#1E2128] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#282C35] border border-slate-200/80 dark:border-slate-700/80"
                }`}
              >
                <span>{pill.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeFilter === pill.id ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                  {pill.count}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* --- SECTION 5: CANDIDATE MONITORING ROSTER (TABLE) --- */}
        <section className="w-full bg-white dark:bg-[#141518] border border-slate-300/80 dark:border-slate-800 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#181A20] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800 select-none">
                <tr>
                  <th className="py-3.5 pl-6 pr-4">Candidate Info</th>
                  <th className="py-3.5 px-4">Live Status</th>
                  <th className="py-3.5 px-4">Tab Switches</th>
                  <th className="py-3.5 px-4">Progress & Score</th>
                  <th className="py-3.5 px-4">Timer Remaining</th>
                  <th className="py-3.5 pr-6 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                      No examinees found matching the active filter.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((c) => {
                    const isExamineeBlocked = c.is_blocked || c.tab_switch_count >= 3
                    const pctAnswered = c.total_questions > 0 ? Math.round((c.answered_count / c.total_questions) * 100) : 0

                    return (
                      <tr
                        key={c.attempt_id}
                        className={`transition-colors ${
                          isExamineeBlocked
                            ? "bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-50/70 dark:hover:bg-rose-950/20"
                            : "hover:bg-slate-50/80 dark:hover:bg-[#181A20]/80"
                        }`}
                      >
                        {/* 1. Student Info */}
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="relative shrink-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isExamineeBlocked
                                  ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-[#FF6B6B] border border-rose-300 dark:border-rose-900/60"
                                  : "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50"
                              }`}>
                                {c.student_name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#141518] ${
                                isExamineeBlocked ? "bg-rose-500" : c.status === "IN_PROGRESS" ? "bg-emerald-500" : "bg-slate-400"
                              }`} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {c.student_name}
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1.5">
                                <span>{c.email}</span>
                                {(c.joined_at || c.started_at) && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                                      Joined {new Date(c.joined_at || c.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                    </span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Status Pill */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isExamineeBlocked ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-[#FF6B6B] font-bold text-[11px] border border-rose-200 dark:border-rose-900/50">
                              <span>🚫 Locked (3/3 Switched)</span>
                            </div>
                          ) : c.status === "SUBMITTED" || c.status === "EVALUATED" ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-blue-200 dark:border-blue-900/50">
                              <span>✓ Submitted</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-200 dark:border-emerald-900/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active</span>
                            </div>
                          )}
                        </td>

                        {/* 3. Tab Switches Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] w-fit ${
                              c.tab_switch_count >= 3
                                ? "bg-rose-600 text-white"
                                : c.tab_switch_count === 2
                                ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60"
                                : c.tab_switch_count === 1
                                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}>
                              {c.tab_switch_count >= 3 ? "⚠️ 3/3 EXCEEDED" : `⚠️ ${c.tab_switch_count}/3 Warnings`}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {c.tab_switch_count === 0 ? "Zero infractions" : `${c.tab_switch_count} focus loss logged`}
                            </span>
                          </div>
                        </td>

                        {/* 4. Progress & Score */}
                        <td className="py-3.5 px-4 min-w-[160px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{c.answered_count}/{c.total_questions} answered</span>
                              <span className="font-bold text-slate-900 dark:text-white">{c.score} pts</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isExamineeBlocked ? "bg-rose-500" : "bg-blue-600"}`}
                                style={{ width: `${pctAnswered}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 5. Timer Remaining */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isExamineeBlocked ? (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-rose-600 dark:text-[#FF6B6B]">
                              ⏸ PAUSED ({formatTime(c.seconds_left)})
                            </span>
                          ) : (
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                              ⏱ {formatTime(c.seconds_left)}
                            </span>
                          )}
                        </td>

                        {/* 6. Actions */}
                        <td className="py-3.5 pr-6 pl-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {isExamineeBlocked && (
                              <button
                                onClick={() => setUnblockModalStudent(c)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                                <span>Unblock</span>
                              </button>
                            )}

                            <Link
                              to={`/review/${c.attempt_id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-[#1A2234] dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200/80 dark:border-blue-900/50 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <span>Inspect</span>
                              <span>→</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- UNBLOCK AUTHORIZATION MODAL --- */}
        {unblockModalStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Authorize Unblock</h3>
                    <p className="text-xs text-slate-500">Restore session and resume timer for student</p>
                  </div>
                </div>
                <button onClick={() => setUnblockModalStudent(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  ✕
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{unblockModalStudent.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono">{unblockModalStudent.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trigger Reason:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">3/3 Tab Switches Exceeded</span>
                </div>
              </div>

              {/* Pardon Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Unblock Policy</label>
                <select
                  value={pardonOption}
                  onChange={(e) => setPardonOption(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="reset_2">Set to 2/3 Warnings (Next switch locks immediately)</option>
                  <option value="reset_0">Full Pardon: Reset warnings counter to 0/3</option>
                </select>
                <span className="text-[11px] text-slate-400">
                  Clicking Authorize will instantly send a WebSocket signal to student's screen to unlock and resume their timer.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnblockModalStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={unblockingLoading}
                  onClick={handleAuthorizeUnblock}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {unblockingLoading ? "Authorizing..." : "Authorize Unblock"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- BROADCAST ANNOUNCEMENT MODAL --- */}
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Broadcast Announcement</h3>
                    <p className="text-xs text-slate-500">Sends an instant banner to all active student screens</p>
                  </div>
                </div>
                <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  ✕
                </button>
              </div>

              <textarea
                rows="3"
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="e.g., Note: Please check Question 4 wording clarification..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleSendBroadcast}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Broadcast to All</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </TeacherShell>
  )
}
