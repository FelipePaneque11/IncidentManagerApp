import { useState } from 'react'
import type { FormEvent } from 'react'

import { assignIncident } from '../api/incidents'
import type { Incident } from '../api/incidents'
import type { User } from '../api/auth'

type IncidentAssignmentFormProps = {
    incident: Incident
    users: User[]
    isSaving: boolean
    disabled: boolean
    onSavingChange(isSaving: boolean): void
    onAssigned(incident: Incident): void
}

export default function IncidentAssignmentFormProps(props:IncidentAssignmentFormProps){
    //dropdown values are strings. We use an empty string for unnassigned
    const [selectedAssigneeId, setSelectedAssigneeId] = useState(props.incident.assignee_id ?? '')
    const [error, setError] = useState('')
    //?? uses the value on the right if the value on the left is null.
    const hasChanged = selectedAssigneeId !== (props.incident.assignee_id ?? '') 

    async function handleSubmit(event: FormEvent<HTMLFormElement>){
        event.preventDefault()

        if(props.disabled || props.isSaving || !hasChanged){
            return
        }

        setError('')
        props.onSavingChange(true)

        //Concert the dropdown's empty string into the null our API expects
        let assigneeId: string | null = selectedAssigneeId
        if(selectedAssigneeId === ''){
            assigneeId = null
        }

        try{
            const savedIncident = await assignIncident(props.incident.id, assigneeId)
            props.onAssigned(savedIncident)
        }catch(cause){
            if(cause instanceof Error){
                setError(cause.message)
            }else{
                setError("Something went wrong while saving the assignee.")
            }
        }finally{
            props.onSavingChange(false)
        }

    }

    return(
    <form className="incident-form" onSubmit={handleSubmit}>
      <h3>Assign incident</h3>

      <label>
        Assignee
        <select
          value={selectedAssigneeId}
          onChange={function (event) {
            setSelectedAssigneeId(event.target.value)
            setError('')
          }}
          disabled={props.disabled || props.isSaving}
        >
          <option value="">Unassigned</option>

          {props.users.map(function (user) {
            return (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            )
          })}
        </select>
      </label>

      {error && (
        <p className="error" role="alert">{error}</p>
      )}

      <div className="button-row">
        <button
          type="submit"
          disabled={props.disabled || props.isSaving || !hasChanged}
        >
          {props.isSaving ? 'Saving...' : 'Save assignee'}
        </button>
      </div>
    </form>
    )
    
}