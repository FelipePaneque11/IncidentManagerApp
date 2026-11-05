// useState remembers the fetched data, loading state, and errors.
// useEffect starts the requests when the dashboard mounts.
// getIncidents and getUsers are our API functions.
// Incident and User describe the returned data.

import { useEffect, useState } from "react"

import CreateIncidentForm from "./CreateIncidentForm"
import { getIncidents } from "../api/incidents"
import type { Incident } from "../api/incidents"
import { getUsers } from "../api/auth"
import type { User } from "../api/auth"

export default function IncidentDashboard(){
    const [incidents, setIncidents] = useState<Incident[]>([]) //Start with an empty array of incidents
    const [users, setUsers] = useState<User[]>([])             //Start with an empty array of users
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [notice, setNotice] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(function () {
        let active = true

        async function loadDashboard(){
            try{
                const [loadedIncident, loadedUsers] = await Promise.all([
                    getIncidents(),
                    getUsers(),
                ])

                if(active){
                    setIncidents(loadedIncident)
                    setUsers(loadedUsers)
                }
            }catch(cause){
                if(active){
                    if(cause instanceof Error){
                        setError(cause.message)
                    }else{
                        setError("Unable to load the dashboard")
                    }
                }
            }finally{
                if(active){
                    setLoading(false)
                }
            }
        }

        loadDashboard()
        
        //ignore results arriving after this dashboard has been removed
        return function(){
            active = false
        }
    }, [])

    function getAssigneeName(assigneeId: string | null): string {
    if (assigneeId === null) {
      return "Unassigned"
    }

    for (const user of users) {
      if (user.id === assigneeId) {
        return user.username
      }
    }

    return 'Unknown user'
  }

//format date to DD-MM-YYYY and HH-MM
function formatDate(value: string): string {
    const date = new Date(value)

    // padStart ensures single-digit values have a leading zero.
    const day = String(date.getDate()).padStart(2, '0')

    // JavaScript months start at 0, so add 1.
    const month = String(date.getMonth() + 1).padStart(2, '0')

    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${day}/${month}/${year} ${hours}:${minutes}`
}

  function getSLALabel(incident: Incident): string {
    if (incident.status === 'resolved') {
      return 'Resolved'
    }

    if (incident.overdue) {
      return 'Overdue'
    }

    return 'Within Deadline'
  }

  function reloadDashboard() {
    // App will restore the session and load the dashboard again.
    window.location.reload()
  }

  if (loading) {
    return (
      <section className="panel">
        <p role="status">Loading incidents...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="panel">
        <p className="error" role="alert">
          {error}
        </p>

        <button type="button" onClick={reloadDashboard}>
          Try again
        </button>
      </section>
    )
  }

  function openCreateForm(){
    setNotice('')
    setShowCreateForm(true)
  }

  function closeCreateForm(){
    setShowCreateForm(false)
  }

  function handleIncidentCreated(createdIncident: Incident){
    setIncidents(function (currentIncidents){
        //make a new array with the saved incident at the beginning
        const updatedIncidents = [createdIncident, ...currentIncidents]

        //keep this initial dashboard page limited to 20 records
        return updatedIncidents.slice(0, 20)
    })

    setShowCreateForm(false)
    setNotice("Incident created successfully")
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Latest incidents</h2>
        
        <div className="button-row">
            <button type="button" onClick={openCreateForm} disabled={showCreateForm}>New Incident</button>
            <button type="button" onClick={reloadDashboard} disabled={showCreateForm}>Refresh</button>
        </div>  
      </div>

        {notice && (
            <p className="success-message" role="status">{notice}</p>
        )}

        {showCreateForm && (
            <CreateIncidentForm
                onCreated={handleIncidentCreated}
                onCancel={closeCreateForm}
            />
        )}

      <p className="muted">
        Showing up to 20 most recent incidents. Times use your local timezone.
      </p>

      {incidents.length === 0 ? (
        <p className="empty-state">
          No incidents yet. Your reported incidents will appear here.
        </p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Priority</th>
                <th scope="col">Status</th>
                <th scope="col">Assignee</th>
                <th scope="col">Created at</th>
                <th scope="col">Deadline</th>
                <th scope="col">State</th>
              </tr>
            </thead>

            <tbody>
              {/*map calls the function for each incident and collects the returned rows*/}
              {incidents.map(function (incident) {
                return (
                  <tr
                    key={incident.id}
                    className={incident.overdue ? 'incident-overdue' : ''}
                  >
                    <th scope="row">{incident.title}</th>

                    <td>
                      <span className={'badge priority-' + incident.priority}>
                        {incident.priority}
                      </span>
                    </td>

                    <td>{incident.status}</td>
                    <td>{getAssigneeName(incident.assignee_id)}</td>
                    <td>{formatDate(incident.created_at)}</td>
                    <td>{formatDate(incident.deadline)}</td>
                    <td>{getSLALabel(incident)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )

}
