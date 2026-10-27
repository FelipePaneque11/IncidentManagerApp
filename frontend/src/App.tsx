import { useState } from 'react'

import LoginForm from './components/LoginForm'
import type { User } from './api/auth'


export default function App() {
  // null means this component has not received a logged-in account yet.
  const [user, setUser] = useState<User | null>(null)

  function handleLogin(loggedInUser: User) {
    setUser(loggedInUser)
  }

  if (user !== null) {
    return (
      <main className="auth-card">
        <h1>Welcome, {user.username}</h1>
        <p>User role: {user.role}</p>
        <p>You are signed in to Incident Manager.</p>
      </main>
    )
  }

  return (
    <main className="auth-card">
      <h1>Incident Manager</h1>
      <p>Sign in to manage your incidents.</p>

      <LoginForm onLogin={handleLogin} />
    </main>
  )
}