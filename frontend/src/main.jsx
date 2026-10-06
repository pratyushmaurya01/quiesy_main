import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import { AuthProvider } from "./context/AuthContext"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById("root")).render(
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <App />
        </AuthProvider>
    </QueryClientProvider>
)