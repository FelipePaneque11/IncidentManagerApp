// useState remembers the fetched data, loading state, and errors.
// useEffect starts the requests when the dashboard mounts.
// getIncidents and getUsers are our API functions.
// Incident and User describe the returned data.

import { useEffect, useState } from "react"

import CreateIncidentForm from "./CreateIncidentForm"
import IncidentDetails from "./IncidentDetails"
import EditIncidentForm from "./EditIncidentForm"
import IncidentAssignmentForm from "./IncidentAssignmentForm"
import { getIncidents, deleteIncident, updateIncident } from "../api/incidents"
import type { Incident } from "../api/incidents"
import { getUsers } from "../api/auth"
import type { User } from "../api/auth"

const PAGE_SIZE = 20

export default function IncidentDashboard(){
    const [incidents, setIncidents] = useState<Incident[]>([]) //Start with an empty array of incidents
    const [users, setUsers] = useState<User[]>([])             //Start with an empty array of users
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false) //isDeleting prevents other actions dureing the request
    const [deleteError, setDeleteError] = useState('') //deleteError lets us show a deletion error while keeping the dashboard visible
    const [isEditing, setIsEditing] = useState(false)
    const [isAssigning, setIsAssigning] = useState(false)
    const [notice, setNotice] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [offset, setOffset] = useState(0) //counts how many matching records to skip.
    const [hasNextPage, setHasNextPage] = useState(false)
    const [reloadCount, setReloadCount] = useState(0)

    const controlsDisabled = loading || showCreateForm || isEditing || isDeleting || isAssigning
    
    //find the selected incident using its ID
    const selectedIncident = incidents.find(function (incident){
        return incident.id === selectedIncidentId
    })

    useEffect(function () {
        let active = true

        //load the dashboard with the incidents and users. 
        async function loadDashboard(){
            try{
                const [incidentResults, userResults] = await Promise.all([
                    getIncidents({
                      status: statusFilter,
                      priority: priorityFilter,
                      limit: PAGE_SIZE + 1,
                      offset: offset,
                    }),
                    getUsers(),
                ])
                //ignore results from an old request
                if(!active){
                    return
                }
                //a deletion or edit might leave the current page empty
                //move back one page and let the effect fetch again.
                if(incidentResults.length === 0 && offset > 0){
                  setOffset(Math.max(0, offset - PAGE_SIZE))
                  return
                }

                setHasNextPage(incidentResults.length > PAGE_SIZE)

                //the extra record is only used to check for another page
                setIncidents(incidentResults.slice(0, PAGE_SIZE))
                setUsers(userResults)
                setError('')
                setLoading(false)
            }catch(cause){
                if(active){
                    if(cause instanceof Error){
                        setError(cause.message)
                    }else{
                        setError("Unable to load the dashboard")
                    }
                    setLoading(false)
                }
            }
        }

        loadDashboard()
        
        //ignore results arriving after this dashboard has been removed
        return function(){
            active = false
        }
    }, [statusFilter, priorityFilter, offset, reloadCount])

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
  //gets deadline status
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
    setLoading(true)
    setError('')
    setDeleteError('')
    setSelectedIncidentId(null)

    // Changing this value tells our effect to fetch again.
    setReloadCount(function (currentCount) {
      return currentCount + 1
    })
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

  function changeStatusFilter(value: string) {
  setStatusFilter(value)
  setOffset(0)
  setNotice('')
  reloadDashboard()
}

function changePriorityFilter(value: string) {
  setPriorityFilter(value)
  setOffset(0)
  setNotice('')
  reloadDashboard()
}

function resetFilters() {
  setStatusFilter('')
  setPriorityFilter('')
  setOffset(0)
  setNotice('')
  reloadDashboard()
}

function goToPage(newOffset: number) {
  setOffset(newOffset)
  setNotice('')
  reloadDashboard()
}

  function openCreateForm(){
    setNotice('')
    //close the details panel when opening the creation form
    setSelectedIncidentId(null)
    setShowCreateForm(true)
    setDeleteError("")
  }

  function closeCreateForm(){
    setShowCreateForm(false)
    setDeleteError("")
  }

  function handleIncidentCreated(createdIncident: Incident) {
    // Return to the unfiltered first page to show the new incident.
    setStatusFilter('')
    setPriorityFilter('')
    setOffset(0)
    setShowCreateForm(false)

    setNotice('Incident "' + createdIncident.title + '" created successfully.')
    reloadDashboard()
  }

  function openIncidentDetails(incidentId: string){
    setNotice('')
    setSelectedIncidentId(incidentId)
    setDeleteError("")
  }

  function closeIncidentDetails(){
    setSelectedIncidentId(null)
    setDeleteError("")
  }

  //Edit handlers
  function startEditing(){
    setNotice("")
    setIsEditing(true)
  }

  function cancelEditing(){
    setIsEditing(false)
  }

  //INCIDENT UPDATE HANDLER
  function handleIncidentUpdated(updatedIncident: Incident) {
    setIsEditing(false)
    setNotice('Incident "' + updatedIncident.title + '" updated successfully.')

    // Its new status or priority might no longer match the filters.
    reloadDashboard()
  }

//INCIDENT DELETION HANDLER
async function handleDeleteIncident(){
  //stop if nothing is selected or a deletion is already running
  if(!selectedIncident || isDeleting || isAssigning){
    return
  }
  //keep a reference to the incident this request concerns
  const incidentToDelete = selectedIncident
  const confirmed = window.confirm('Delete"' + incidentToDelete.title + '"? This cannot be undone!')

  //cancel means no API request is sent
  if(!confirmed){
    return
  }

  setDeleteError('')
  setNotice('')
  setIsDeleting(true)

  try{
    await deleteIncident(incidentToDelete.id)

    reloadDashboard()
    setNotice('Incident "' + incidentToDelete.title + '" deleted successfully.')
  }catch(cause){
    if(cause instanceof Error){
      setDeleteError(cause.message)
    }else{
      setDeleteError("Something went wrong while deleting.")
    }
  }finally{
    setIsDeleting(false)
  }
}

//AssigneeHandler
function handleIncidentAssigned(updatedIncident: Incident){
  //replace the matching incident with the version returned by FastAPI
  setIncidents(function (currentIncidents){
    return currentIncidents.map(function (incident){
      if(incident.id === updatedIncident.id){
        return updatedIncident
      }
      return incident
    })
  })
  setNotice("Incident assignee updateed successfully.")
}

  return (
    <section className="panel">
      <div className="panel-heading">
        <div className="incident-filters">
          <label>
            Status
            <select
              value={statusFilter}
              onChange={function (event){changeStatusFilter(event.target.value)}}
              disabled={controlsDisabled}>
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>

          <label>
            Priority
            <select
              value={priorityFilter}
              onChange={function (event){changePriorityFilter(event.target.value)}}
              disabled={controlsDisabled}>
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <button
            type="button"
            className="secondary-button"
            onClick={resetFilters}
            disabled={controlsDisabled}>
              Reset filters
          </button>
        </div>

        <h2>Latest incidents</h2>
        
        <div className="button-row">
            <button type="button" onClick={openCreateForm} disabled={showCreateForm || isEditing || isDeleting || controlsDisabled}>New Incident</button>
            <button type="button" onClick={reloadDashboard} disabled={showCreateForm || isEditing || isDeleting || controlsDisabled}>Refresh</button>
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

        {selectedIncident && !isEditing &&(
            <IncidentDetails
                incident={selectedIncident}
                assigneeName={getAssigneeName(selectedIncident.assignee_id)}
                slaLabel={getSLALabel(selectedIncident)}
                formatDate={formatDate}
                onClose={closeIncidentDetails}
                onEdit={startEditing}
                onDelete={handleDeleteIncident}
                isDeleting={isDeleting}
                isAssigning={isAssigning}
            />
        )}

        {selectedIncident && !isEditing && (
          <IncidentAssignmentForm
            key= {selectedIncident.id}
            incident={selectedIncident}
            users={users}
            isSaving={isAssigning}
            disabled={isDeleting}
            onSavingChange={setIsAssigning}
            onAssigned={handleIncidentAssigned}
          />
        )}

        {selectedIncident && !isEditing && deleteError && (
          <p className="error" role="alert">{deleteError}</p>
        )}

        {selectedIncident && isEditing && (
            <EditIncidentForm
                key={selectedIncident.id}
                incident={selectedIncident}
                onUpdate={handleIncidentUpdated}
                onCancel={cancelEditing}
            />
        )}

      <p className="muted">
         Incidents on this page: {incidents.length}. Times use your local timezone.
      </p>

      {incidents.length === 0 ? (
        <p className="empty-state">
          No incidents found. Create an incident or try different filters.
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
                    <th scope="row">
                    <button
                        type="button"
                        className="incident-title-button"
                        disabled={showCreateForm || isEditing || isDeleting || isAssigning || controlsDisabled}
                        onClick={function () {
                        openIncidentDetails(incident.id)
                        }}
                    >{incident.title}
                    </button>
                    </th>

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

      <nav className="pagination" aria-label="Incident pages">
        <button
          type="button"
          className="secondary-button"
          disabled={controlsDisabled || offset === 0}
          onClick={function (){goToPage(Math.max(0, offset - PAGE_SIZE))}}>
          Previous
        </button>

        <span>Page {offset / PAGE_SIZE + 1}</span>

        <button
          type="button"
          className="secondary-button"
          disabled={controlsDisabled || !hasNextPage}
          onClick={function (){ goToPage(offset + PAGE_SIZE)}}>
          Next
        </button>
      </nav>
    </section>
  )

}
