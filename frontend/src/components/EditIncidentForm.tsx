import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { updateIncident } from '../api/incidents'
import type { Incident, IncidentUpdate } from '../api/incidents'

type EditIncidentFormProps = {
    incident: Incident
    onUpdate(incident: Incident): void
    onCancel(): void
}

export default function EditIncidentForm(props: EditIncidentFormProps){
    //start each field with the incident's current value
    const [title, setTitle] = useState(props.incident.title)
    const [description, setDescription] = useState(props.incident.description)
    const [priority, setPriority] = useState<IncidentUpdate["priority"]>(props.incident.priority)
    const [status, setStatus] = useState<IncidentUpdate["status"]>(props.incident.status)
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    function handlePriorityChange(event: ChangeEvent<HTMLSelectElement>){
        const value = event.target.value

        //check that the dropdown value is an allowed priority
        if(value === "low" || value === "medium" || value === "high" || value === "critical"){
            setPriority(value)
        }
    }

    function handleStatusChange(event: ChangeEvent<HTMLSelectElement>){
        const value = event.target.value

        if(value === "open" || value === "investigating" || value === "resolved"){
            setStatus(value)
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>){
        //handle saving instead of reloading the page
        event.preventDefault()
        setError("")

        const trimmedTitle = title.trim()
        const trimmedDescription = description.trim()

        if(trimmedTitle.length < 3 || trimmedDescription.length < 10){
            setError("Use at least 3 characters for the title and 10 for the description")
            return
        }
        setIsSubmitting(true)

        try{
            const savedIncident = await updateIncident(props.incident.id, {
                title:trimmedTitle,
                description: trimmedDescription,
                priority: priority,
                status: status,
            })

            // tell dashboard which incident was successfully saved
            props.onUpdate(savedIncident)
        }catch(cause){
            if(cause instanceof Error){
                setError(cause.message)
            }else{
                setError("Something went wrong while saving")
            }
        }finally{
            setIsSubmitting(false)
        }
    }

    return(
        <form className="incident-form" onSubmit={handleSubmit}>
            <h3>Edit incident</h3>

            <label>Title
                <input value={title} onChange={function (event){setTitle(event.target.value)}}
                required
                minLength={3}
                maxLength={100}
                disabled={isSubmitting}
                />
            </label>

            <label>
                Description
                <textarea value={description} onChange={function (event){setDescription(event.target.value)}}
                    required
                    minLength={10}
                    maxLength={2000}
                    disabled={isSubmitting}
                 />
            </label>

            <label>
                Priority
                <select value={priority} onChange={handlePriorityChange} disabled={isSubmitting}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
                </select>
            </label>

            <label>
                Status
                <select value={status} onChange={handleStatusChange} disabled={isSubmitting}>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                </select>
            </label>

            {error && (
                <p className="error" role="alert">{error}</p>
            )}

            <div className="button-row">
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save changes"}
                </button>

                <button type="button" className="secondary-button" onClick={props.onCancel} disabled={isSubmitting}>
                    Cancel
                </button>
            </div>
        </form>
    )
}