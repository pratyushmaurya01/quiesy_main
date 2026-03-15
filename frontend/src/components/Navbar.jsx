import { useState } from "react"

export default function Navbar() {

  const [dark,setDark] = useState(true)

  const toggleTheme = () =>{
    document.documentElement.classList.toggle("dark")
    setDark(!dark)
  }

  return (
    <nav className="w-full border-b border-gray-800 bg-gray-950">

      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">

        <h1 className="text-xl font-semibold text-blue-400">
          Quiesy
        </h1>

        <button
          onClick={toggleTheme}
          className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 transition"
        >
          {dark ? "Light" : "Dark"}
        </button>

      </div>

    </nav>
  )
}   