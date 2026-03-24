import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"
import API from "../api/api"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function QuizResults() {
  const { quizId } = useParams()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")


  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await API.get(`quiz/${quizId}/results/`)
        setData(res.data)
      } catch (error) {
        console.error("Failed to fetch results:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [quizId])

  // 🔥 Helper Function to format seconds into MM:SS
  const formatTimeTaken = (totalSeconds) => {
    if (!totalSeconds) return "--"
    const m = Math.floor(totalSeconds / 60)
    const s = Math.floor(totalSeconds % 60)
    return `${m}m ${s}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-slate-500">Loading Analytics...</p>
      </div>
    )
  }

  // --- 1. SEARCH, FILTER & FRONTEND SORT LOGIC ---
  const filteredAndSortedResults = data.results
    .filter(r => 
      r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
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
  const passThreshold = data.stats.max_score * 0.4 
  const passedStudents = data.results.filter(r => r.score >= passThreshold).length
  const passPercentage = data.results.length > 0 
    ? Math.round((passedStudents / data.results.length) * 100) 
    : 0

  // --- 4. EXPORT TO CSV (Updated with Time Taken) ---
  const exportToCSV = () => {
    const headers = ["Name,Email,Score,Time Taken,Submitted At"]
    const rows = filteredAndSortedResults.map(r => 
      `${r.student_name},${r.email},${r.score},"${formatTimeTaken(r.time_taken_seconds)}","${new Date(r.submitted_at).toLocaleString()}"`
    )
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${data.quiz_title.replace(/\s+/g, '_')}_Results.csv`)
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
  
  data.results.forEach(r => {
    const percent = data.stats.max_score > 0 ? (r.score / data.stats.max_score) * 100 : 0
    if (percent <= 20) chartBins[0].count++
    else if (percent <= 40) chartBins[1].count++
    else if (percent <= 60) chartBins[2].count++
    else if (percent <= 80) chartBins[3].count++
    else chartBins[4].count++
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 pb-12">

      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-16 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{data.quiz_title}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Comprehensive Analytics Dashboard</p>
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Students</span>
            <div className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">{data.stats.total_students}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Score</span>
            <div className="text-3xl font-bold mt-1">{data.stats.avg_score.toFixed(1)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Highest Score</span>
            <div className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{data.stats.max_score}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Lowest Score</span>
            <div className="text-3xl font-bold mt-1 text-red-600 dark:text-red-400">{data.stats.min_score}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pass Rate</span>
            <div className="text-3xl font-bold mt-1 text-purple-600 dark:text-purple-400">{passPercentage}%</div>
          </div>
        </div>

        {/* --- MIDDLE SECTION: GRAPH & LEADERBOARD --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Score Distribution</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartBins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-yellow-500">🏆</span> Top Performers
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3">
              {topStudents.length === 0 ? (
                <p className="text-slate-500 text-sm">No attempts yet.</p>
              ) : (
                topStudents.map((student, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : index === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' : index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold truncate max-w-[120px]">{student.student_name}</p>
                      </div>
                    </div>
                    {/* 🔥 Now shows Score AND Time Taken in Leaderboard */}
                    <div className="text-right">
                      <div className="font-extrabold text-blue-600 dark:text-blue-400">{student.score} Marks</div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatTimeTaken(student.time_taken_seconds)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --- FULL RESULTS TABLE WITH SEARCH --- */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
            <h2 className="text-lg font-bold hidden sm:block">Detailed Results</h2>
            <div className="relative w-full sm:w-72">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Search name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Score</th>
                  <th className="px-6 py-4 font-semibold">Time Taken</th> {/* 🔥 New Column */}
                  <th className="px-6 py-4 font-semibold">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAndSortedResults.length > 0 ? (
                  filteredAndSortedResults.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{r.student_name}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{r.email}</td>
                      <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{r.score}</td>
                      {/* 🔥 Renders Time Here */}
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                        {formatTimeTaken(r.time_taken_seconds)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {new Date(r.submitted_at).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  )
}