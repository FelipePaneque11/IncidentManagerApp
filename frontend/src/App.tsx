import { useEffect, useState } from 'react'

import { getCurrentUser, logout } from './api/auth'
import type { User } from './api/auth'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import IncidentDashboard from './components/IncidentDashboard'

export default function App() {
  // null means this component has not received a logged-in account yet.
  const [user, setUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [authNotice, setAuthNotice] = useState("")
  const [error, setError] = useState("")

  useEffect(function () {
    let active = true

    async function restoreSession(){
      try {
          const currentUser = await getCurrentUser()
          if(active){
            setUser(currentUser)
          }
      }catch(cause){
        if(active){
          if(cause instanceof Error){
            setError(cause.message)
          }else{
            setError("Unable to check your login session.")
          }
        }
      }finally{
        if(active){
          setCheckingSession(false)
        }
      }
    }

    restoreSession()

    //ignore results from this request after the effect is cleaned up
    return function(){
      active = false
    }
  }, [])

  function handleLogin(loggedInUser: User) {
    setError("")
    setAuthNotice("")
    setShowRegistration(false)
    setUser(loggedInUser)
  }

  async function handleLogout(){
    setError('')
    setIsLoggingOut(true)

    try{
      await logout()

      //show the login form after backend confirms logout
      setUser(null)
    }catch(cause){
      if(cause instanceof Error){
        setError(cause.message)
      }else{
        setError("Unable to log out. Please try again.")
      }
    }finally{
      setIsLoggingOut(false)
    }
  }

  function openRegistration(){
    setError("")
    setAuthNotice("")
    setShowRegistration(true)
  }

  function closeRegistration(){
    setShowRegistration(false)
  }

  function handleRegistration(username: string){
    setShowRegistration(false)
    setAuthNotice('Account "' + username + '" created. You can now log in.')
  }

  function retrySession(){
    //reload the application to retry its initial session check
    window.location.reload()
  }

  if(checkingSession){
    return (
      <main className='auth-card'>
        <p role="status">Checking your session...</p>
      </main>
    )
  }

  if(error && user == null){
    return(
      <main className='auth-card'>
        <h1>Connection problem</h1>

        <p className='error' role='alert'>{error}</p>
        <p>Check that the backend is running, then try again</p>

        <button type='button' onClick={retrySession}>Try again</button>
      </main>
    )
  }

  if (user !== null) {
    return (
      <main className="dashboard-shell">
        <header className='dashboard-header'>

          <div>
            <h1>Incident Manager</h1>
            <p>Signed in as {user.username} . {user.role}</p>
          </div>

          <button 
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}>
            {isLoggingOut ? "Logging out..." : "Log out"}    
          </button>
        </header>

        {error && (
          <p className="error" role="alert">{error}</p>
        )}
        
        <IncidentDashboard />
      </main>
    )
  }

  return (
    <main className="auth-card">
      <h1>Incident Manager</h1>
      {authNotice && (
        <p className='success-message' role="status">{authNotice}</p>
      )}

      {/* show registration form when true, otherwise show login form */}
      {showRegistration ? (
        <RegisterForm
          onRegistered={handleRegistration}
          onCancel={closeRegistration}
        />
      ): (
        <LoginForm
          onLogin={handleLogin}
          onRegister={openRegistration}
        />
      )}

    </main>
  )
}