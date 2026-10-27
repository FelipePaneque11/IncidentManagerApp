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