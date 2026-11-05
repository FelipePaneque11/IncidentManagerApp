//JSON timestamps arrive as string, rather than Python datatime objects
export type Incident = {
    id: string
    title: string
    description: string
    priority: "low" | "medium" | "high" | "cricical"
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