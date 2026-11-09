//JSON timestamps arrive as string, rather than Python datatime objects
export type Incident = {
    id: string
    title: string
    description: string
    priority: "low" | "medium" | "high" | "critical"
    status: "open" | "investigating" | "resolved"
    created_at: string
    assignee_id: string | null
    deadline: string
    overdue: boolean
}

//pagination - the "?" makes each option optional.
export type IncidentListOpstions = {
    status?: string
    priority?: string
    limit?: number
    offset?: number
}

//GET
export async function getIncidents(options: IncidentListOpstions = {}): Promise<Incident[]> {
    //It requests the first page of up to 20 incidents.
    //build the query string using the supplied options
    const params = new URLSearchParams({
        limit: String(options.limit ?? 20),
        offset: String(options.offset ?? 0),
    })

    //An example request will look like:
    //api/incidents?limit=21&offset=20&status=open&priority=high

    //empty filters mean "show all"
    if(options.status){
        params.set("status", options.status)
    }
    if(options.priority){
        params.set("priority", options.priority)
    }
    
    const response = await fetch('/api/incidents?' + params.toString(), {
        credentials: "include"
    })

    if (response.status === 401) {
    throw new Error('Your session has expired. Refresh the page to sign in again.')
    }

    if(!response.ok){
    throw new Error('Unable to load incidents. Please try again.')
    }

    return response.json()
}

export type NewIncident = {
    title: string
    description: string
    priority: Incident['priority']
}

//POST
export async function createIncident(payload: NewIncident): Promise<Incident>{
    const response = await fetch('/api/incidents', {
        method: "POST",
        credentials: 'include',
        headers: {
            "Content-Type":"application/json",
        },
        body: JSON.stringify(payload)
    })

    if(response.status === 401){
        throw new Error("Your session has expired. Refresh the page to sign in again.")
    }

    //validanting entries
    if(response.status === 422){
        const body = await response.json()
        if(Array.isArray(body.detail) && body.detail.length > 0){
            throw new Error(body.detail[0].msg)
        }
        throw new Error("Please check the incident details.")
    }

    if(!response.ok){
        throw new Error("Unable to create the incident. Please try again.")
    }

    return response.json()
}

//Editing an incident
export type IncidentUpdate = {
    title: string
    description: string
    priority: Incident["priority"]
    status: Incident["status"]
}

//PUT
export async function updateIncident(incidentId: string, payload:IncidentUpdate): Promise<Incident>{
    const response = await fetch('/api/incidents/' + incidentId, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
    })
    
    if (response.status === 401) {
        throw new Error('Your session has expired. Refresh to sign in again.')
    }

    if (response.status === 404) {
        throw new Error('This incident no longer exists. Refresh the dashboard.')
    }

    if (response.status === 422) {
        throw new Error('Please check the incident details and try again.')
    }

    if (!response.ok) {
        throw new Error('Unable to update the incident. Please try again.')
    }

    return response.json()
}

//DELETE
export async function deleteIncident(incidentId: string): Promise<void> {
    const response = await fetch('/api/incidents/' + incidentId, {
        method: 'DELETE',
        credentials: 'include',
    })

    if(response.status === 401){
        throw new Error("Your session has expired. Refresh to sign in again.")
    }

    if(response.status === 404){
        throw new Error("This incident no longer exists. Refresh the dashboard.")
    }

    if(!response.ok){
        throw new Error("Unable to delete the incident. Please try again!")
    }

    //backend returns 204 if deleted. nothing to return.
}

//PATCH
//assigning incident to someone
export async function assignIncident(incidentId: string, assigneId: string | null): Promise<Incident>{
    const response = await fetch('/api/incidents/' + incidentId + '/assignee', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            assignee_id: assigneId,
        }),
    })

    if(response.status === 401){
        throw new Error("Your session has expired. Refresh to sign in again.")
    }

    if(response.status === 404){
        throw new Error("This incident no longer exists. Refresh the dashboard.")
    }

    if(!response.ok){
        throw new Error("Unable to save the assignee. Please try again!")
    }

    return response.json()
}