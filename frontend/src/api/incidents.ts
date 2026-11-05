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

export async function getIncidents(): Promise<Incident[]> {
    //It requests the first page of up to 20 incidents.
    const response = await fetch('/api/incidents?limit=20&offset=0', {
    credentials: 'include',
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

