import React from "react"
import API from "../api/api" 

const DeleteQuizButton = ({ quizId, onDeleteSuccess }) => {

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this quiz?")
    if (!confirmDelete) return

    try {
      const res = await API.delete(`quiz/${quizId}/delete/`)

      if (res.status === 200 || res.status === 204) {
        alert("Deleted successfully")
        
        // 🔥 Ye line aapke page ko automatically refresh kar degi!
        // Isse aapka TeacherDashboard dobara load hoga aur API se fresh quizzes layega.
        window.location.reload()
        
      }

    } catch (error) {
      alert(error.response?.data?.error || "Delete failed")
    }
  }

  return (
    <button 
        onClick={handleDelete}
        title="Delete Quiz"
        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors cursor-pointer"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}

export default DeleteQuizButton