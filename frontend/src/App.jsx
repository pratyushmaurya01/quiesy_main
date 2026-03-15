import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import TeacherDashboard from "./pages/TeacherDashboard"
import CreateQuiz from "./pages/CreateQuiz"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element = {<TeacherDashboard/>}/>
        <Route path="/create-quiz" element = {<CreateQuiz/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App