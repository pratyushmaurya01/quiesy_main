import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Register() {

  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  })

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const res = await fetch("http://127.0.0.1:8000/api/register/",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(form)
    })

    const data = await res.json()

    console.log(data)

    if(res.ok){
      navigate("/login")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-xl w-80">

        <h2 className="text-xl mb-6">Teacher Register</h2>

        <input
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="w-full mb-4 p-2 rounded bg-slate-800"
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full mb-4 p-2 rounded bg-slate-800"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full mb-4 p-2 rounded bg-slate-800"
        />

        <button
          type="submit"
          className="w-full bg-green-600 p-2 rounded"
        >
          Register
        </button>

      </form>

    </div>
  )
}