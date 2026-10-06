import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getQuizResults, toggleQuizReview } from "../../api/quizzes"
import TeacherShell from "../../components/layout/TeacherShell"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function QuizResults() {
  const { quizId } = useParams()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [reviewToggling, setReviewToggling] = useState(false)

  const fetchResults = async () => {
    try {
      setLoading(true)
      const res = await getQuizResults(quizId)
      setData(res.data)
    } catch (error) {
      console.error("Failed to fetch results:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [quizId])

  const handleToggleReview = async () => {
    try {
      setReviewToggling(true)
      const nextState = !data.review_enabled
      await toggleQuizReview(quizId, nextState)
      setData((prev) => ({
        ...prev,
        review_enabled: nextState,
      }))
    } catch (err) {
      console.error("Failed to toggle review:", err)
      alert("Failed to change review status. Please try again.")
    } finally {
      setReviewToggling(false)
    }
  }


  // 🔥 Helper Function to format seconds into MM:SS
  const formatTimeTaken = (totalSeconds) => {
    if (!totalSeconds) return "--"
    const m = Math.floor(totalSeconds / 60)
    const s = Math.floor(totalSeconds % 60)
    return `${m}m ${s}s`
  }

  if (loading) {
    return (
      <TeacherShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-800 dark:text-white">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-medium text-slate-500 dark:text-slate-400 text-sm">Loading Analytics...</p>
        </div>
      </TeacherShell>
    )
  }

  // --- 1. SEARCH, FILTER & FRONTEND SORT LOGIC ---
  const filteredAndSortedResults = (data?.results || [])
    .filter(r => 
      r.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Primary Sort: Score (High to Low)
      if (b.score !== a.score) {
        return b.score - a.score
      }
      // Secondary Sort (Tie-breaker): Time Taken (Low to High)
      return a.time_taken_seconds - b.time_taken_seconds
    })

  // --- 2. LEADERBOARD (Top 5 from sorted data) ---
  const topStudents = filteredAndSortedResults.slice(0, 5)

  // --- 3. PASS PERCENTAGE ---
  const maxScore = data?.stats?.max_score || 0
  const passThreshold = maxScore * 0.4 
  const passedStudents = (data?.results || []).filter(r => r.score >= passThreshold).length
  const totalResultsCount = data?.results?.length || 0
  const passPercentage = totalResultsCount > 0 
    ? Math.round((passedStudents / totalResultsCount) * 100) 
    : 0

  // --- 4. EXPORT TO CSV (Updated with Time Taken) ---
  const exportToCSV = () => {
    const headers = ["Name,Email,Score,Time Taken,Submitted At"]
    const rows = filteredAndSortedResults.map(r => 
      `"${r.student_name}","${r.email}",${r.score},"${formatTimeTaken(r.time_taken_seconds)}","${new Date(r.submitted_at).toLocaleString()}"`
    )
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${(data?.quiz_title || "Quiz").replace(/\s+/g, '_')}_Results.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- 5. CHART DATA PREPARATION ---
  const chartBins = [
    { name: '0-20%', count: 0 },
    { name: '21-40%', count: 0 },
    { name: '41-60%', count: 0 },
    { name: '61-80%', count: 0 },
    { name: '81-100%', count: 0 },
  ]
  
  ;(data?.results || []).forEach(r => {
    const percent = maxScore > 0 ? (r.score / maxScore) * 100 : 0
    if (percent <= 20) chartBins[0].count++
    else if (percent <= 40) chartBins[1].count++
    else if (percent <= 60) chartBins[2].count++
    else if (percent <= 80) chartBins[3].count++
    else chartBins[4].count++
  })

  return (
    <TeacherShell
      breadcrumbs={[
        { label: "Quizzes", to: "/dashboard" },
        { label: data?.quiz_title || "Quiz", to: `/quiz/${quizId}/results` },
        { label: "Results" },
      ]}
    >
      <div className="w-full max-w-[1360px] mx-auto pb-16">

        {/* ── Page Header & Unified Action Buttons ── */}
        <div className="pt-2 sm:pt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {data?.quiz_title}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 dark:bg-[#1E2128] border border-slate-200 dark:border-slate-700/80 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500">Code:</span>
                <span>{data?.quiz_code}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Comprehensive Analytics & Real-Time Submissions Dashboard
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Live Proctoring View (Primary Action: Quiesy Solid Blue) */}
            <Link
              to={`/quiz/${quizId}/live-proctor`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-600/25 transition-all cursor-pointer active:scale-95"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>Live Proctoring View</span>
            </Link>

            {/* Toggle Student Review Button (Secondary Action: Subtle Outline Style) */}
            <button
              disabled={reviewToggling}
              onClick={handleToggleReview}
              type="button"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#181A20] border border-slate-300/80 dark:border-[#3A3F47] hover:bg-slate-50 dark:hover:bg-[#252830] transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {data?.review_enabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM10 11V7a2 2 0 114 0v4" />
                )}
              </svg>
              <span>
                {reviewToggling
                  ? "Updating..."
                  : data?.review_enabled
                  ? "Student Review: Enabled"
                  : "Student Review: Disabled"}
              </span>
              <span className={`w-2 h-2 rounded-full ${data?.review_enabled ? "bg-emerald-500" : "bg-slate-400"}`} />
            </button>

            {/* Export CSV (Secondary Action: Subtle Dark-Grey Outline Style) */}
            <button 
              onClick={exportToCSV}
              type="button"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#181A20] border border-slate-300/80 dark:border-[#3A3F47] hover:bg-slate-50 dark:hover:bg-[#252830] transition-all cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* ── 5 Stat Cards (Professional Typography & Left Aligned) ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4 mb-8">
          
          {/* Total Students */}
          <div className="bg-white dark:bg-[#141518] p-5 rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Students
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">
              {data?.stats?.total_students || 0}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Submitted attempts</p>
          </div>

          {/* Average Score */}
          <div className="bg-white dark:bg-[#141518] p-5 rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Score
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">
              {data?.stats?.average_score ?? (data?.stats?.avg_score?.toFixed(1) || "0")}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Out of {maxScore} pts</p>
          </div>

          {/* Highest Score */}
          <div className="bg-white dark:bg-[#141518] p-5 rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Highest Score
              </span>
              <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                Top
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">
              {data?.stats?.highest_score ?? (data?.stats?.max_score || "0")}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Best performance</p>
          </div>

          {/* Lowest Score */}
          <div className="bg-white dark:bg-[#141518] p-5 rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Lowest Score
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">
              {data?.stats?.lowest_score ?? (data?.stats?.min_score || "0")}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Minimum scored</p>
          </div>

          {/* Pass Rate */}
          <div className="bg-white dark:bg-[#141518] p-5 rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none text-left col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pass Rate
              </span>
              <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                ≥40%
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">
              {passPercentage}%
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{passedStudents} of {totalResultsCount} passed</p>
          </div>
        </div>

        {/* ── Middle Section: Graph & Leaderboard ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Score Distribution Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-[#141518] p-6 rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Score Distribution
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Percentage bins of candidates score frequencies
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                Histogram
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155', opacity: 0.2 }} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }} 
                    contentStyle={{ 
                      backgroundColor: '#181A20', 
                      borderRadius: '8px', 
                      border: '1px solid #3A3F47', 
                      color: '#f8fafc',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' 
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#barGradient)" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leaderboard with Custom Dark Scrollbar */}
          <div className="bg-white dark:bg-[#141518] p-6 rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base">🏆</span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Leaderboard
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Top 5
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-64 pr-1.5 custom-scrollbar">
              {topStudents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                  No submissions yet
                </div>
              ) : (
                topStudents.map((student, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#181A20] border border-slate-200/80 dark:border-[#2D3139] hover:border-slate-300 dark:hover:border-[#3D424E] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        index === 0 
                          ? 'bg-amber-400/20 text-amber-500 border border-amber-400/40' 
                          : index === 1 
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' 
                          : index === 2 
                          ? 'bg-amber-700/20 text-amber-600 dark:text-amber-500' 
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                          {student.student_name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate max-w-[130px]">
                          {student.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {student.score} pts
                      </div>
                      <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {formatTimeTaken(student.time_taken_seconds)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Detailed Submissions Table ── */}
        <div className="bg-white dark:bg-[#141518] rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none overflow-hidden">
          
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-[#181A20]/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Submissions ({filteredAndSortedResults.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review specific attempts and individual performance
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-[#202228] border border-slate-300/90 dark:border-[#3A3F47] rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#181A20] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Time Taken</th>
                  <th className="px-5 py-3.5">Submitted At</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredAndSortedResults.length > 0 ? (
                  filteredAndSortedResults.map((r, i) => (
                    <tr 
                      key={i} 
                      className="hover:bg-slate-50/80 dark:hover:bg-[#181A20]/80 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {(r.student_name || "S").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold">{r.student_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {r.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 dark:text-white">{r.score}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500"> / {r.max_score || maxScore} pts</span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                        {formatTimeTaken(r.time_taken_seconds)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(r.submitted_at).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {r.attempt_id ? (
                          <Link
                            to={`/review/${r.attempt_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-[#1A2234] dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200/80 dark:border-blue-900/50 transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <span>Inspect Attempt</span>
                            <span>→</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </TeacherShell>
  )
}