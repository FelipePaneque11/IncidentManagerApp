import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { createIncident } from '../api/incidents'
import type { Incident, NewIncident } from '../api/incidents'


type CreateIncidentFormProps = {
  onCreated(incident: Incident): void
  onCancel(): void
}

export default function CreateIncidentForm(props: CreateIncidentFormProps){
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState<NewIncident['priority']>('medium')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    function handleTitleChange(event: ChangeEvent<HTMLInputElement>){
        setTitle(event.currentTarget.value)
    }

    function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>){
        setDescription(event.currentTarget.value)
    }

    function handlePriorityChange(event: ChangeEvent<HTMLSelectElement>){
        const value = event.currentTarget.value

        if(value === 'low'|| value === 'medium' || value === 'high' || value === 'critical'){
            setPriority(value)
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>){
        event.preventDefault()

        const cleanedTitle = title.trim()
        const cleanedDescription = description.trim()

        //browser length checks include spaces, so check trimmed values too.
        if(cleanedTitle.length < 3 || cleanedDescription.length < 10){
            setError("Enter a title of at least 3 characters and a description of at least 10 characters.")
            return
        }

        setError('')
        setIsSubmitting(true)

        try{
            const savedIncident = await createIncident({
                title: cleanedTitle,
                description: cleanedDescription,
                priority: priority,
            })
            //notify the dashboard only after the backend confirms creation
            props.onCreated(savedIncident)
        }catch(cause){
            if(cause instanceof Error){
                setError(cause.message)
            }else{
                setError("Unable to create the incident")
            }
        }finally{
            setIsSubmitting(false)
        }
    }

    return(
        <form className='incident-form' onSubmit={handleSubmit}>
            <h3>New Incident</h3>

            <label>
                Title
                <input
                    name='title'
                    value={title}
                    onChange={handleTitleChange}
                    required
                    minLength={3}
                    maxLength={100}
                    disabled={isSubmitting}
                />
            </label>

            <label>Description
                <textarea
                    name='description'
                    value={description}
                    onChange={handleDescriptionChange}
                    required
                    minLength={10}
                    maxLength={2000}
                    disabled={isSubmitting}
                />
            </label>

            <label>
                Priority
                <select
                    name="priority"
                    value={priority}
                    onChange={handlePriorityChange}
                    disabled={isSubmitting}
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
            </label>

            {error && (
                <p className="error" role="alert">{error}</p>
            )}

            <div className='button-row'>
                <button
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Creating..." : "Create incident"}
                </button>
                <button 
                    type='button' 
                    className='secondary-button'
                    onClick={props.onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
            </div>
        </form>
    )

}