//describe the account information returned by our backend
export type User = {
    id: string,
    username: string,
    role: 'responder' | 'admin'
}

export async function login(username:string, password:string) : Promise<User>{
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        //allows cookies to participate in the request.
        credentials: 'include',
        headers:{
            'Content-Type':'application/json',
        },
        body: JSON.stringify({username,password})
    })

    if(response.status == 401){
        throw new Error('Incorrect username or password.')
    }

    if(!response.ok){
        throw new Error('Unable to log in. Please try again.')
    }

    return response.json()
}

export async function getCurrentUser(): Promise<User | null>{
    const response = await fetch('/api/auth/me', {
        credentials: "include",
    })

    //being logged out is a normal result, rather than a connection error
    if(response.status == 401){
        return null
    }

    if(!response.ok){
        throw new Error("Unable to check your login session.")
    }
    return response.json()
}

//An incident contains an assignee_id. Fetching the users lets us display the matching username.
export async function getUsers(): Promise<User[]>{
    const response = await fetch("/api/auth/users", {
        credentials: 'include'
    })

    if(response.status == 401){
        throw new Error("Your session has expired. Refresh the page to sign in again.")
    }

    if(!response.ok){
        throw new Error("Unable to retrieve assignee name")
    }

    return response.json()
}

export async function logout(): Promise<void> {
    const response = await fetch('/api/auth/logout', {
        method: "POST",
        credentials: "include",
    })

    if(!response.ok){
        throw new Error("unable to log out. Please try again.")
    }
    //backeend returns 204 with no body.
}

//Registration- LOGIN
export async function registerUser(username:string, password:string): Promise<User>{
    const response = await fetch('/api/auth/register', {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({username: username, password:password,}),
    })

    if (response.status === 409) {
        throw new Error("That username is already taken. Choose another one.")
    }
    
    if (response.status === 422) {
        throw new Error("Please check the username and password requirements.")
    }

    if (!response.ok) {
        throw new Error("Unable to create your account. Please try again.")
    }

    return response.json()

}
