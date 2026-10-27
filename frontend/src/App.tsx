export default function App() {
  // Return the interface React should display.
  return (
    <main>
      <h1>Incident Manager</h1>
      <p>Manage Incidents, assignments, and SLA deadlines.</p>
      <br></br>
      <p>The frontend is running.</p>

      {/* Open the backend health endpoint through our development proxy. */}
      <a href="/api/health" target="_blank" rel="noreferrer">
        Check backend connection
      </a>
    </main>
  )
}