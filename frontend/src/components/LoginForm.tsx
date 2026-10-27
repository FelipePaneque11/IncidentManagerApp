import { useState } from 'react' //remember values inside the component
import type { ChangeEvent, FormEvent } from 'react' //describe an input-change event - describe a form event

import { login } from '../api/auth' // api function
import type { User } from '../api/auth' //account type

type LoginFormProps = {
    //App supplies the function to call after successful login
    onLogin(user: User): void
}

export default function Loginform(props: LoginFormProps){
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    function handleUsernameChange(event: ChangeEvent<HTMLInputElement>){
        //read the current value from the input that triggered the event
        setUsername(event.currentTarget.value)
    }

    function handlePasswordChange(event: ChangeEvent<HTMLInputElement>){
        setPassword(event.currentTarget.value)
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>){
        //handle submission in react instead of reloading the browser page
        event.preventDefault()

        setError('')
        setIsSubmitting(true)

        try{
            const user = await login(username, password)

            //give the successful login result to the parent component
            props.onLogin(user)
        }catch(cause){
            if(cause instanceof Error){
                setError(cause.message)
            }else{
                setError('Something went wrong! Please try again.')
            }
        }finally{
            //reset the loading state if the request succeeds or fails
            setIsSubmitting(false)
        }
    }

    return(
        <form onSubmit={handleSubmit}>
            <label>
                Username
                <input
                    name="username"
                    autoComplete='username'
                    value={username}
                    onChange={handleUsernameChange}
                    required
                    maxLength={30}
                />
            </label>
            
            <label>
                Password
                <input
                    name="password"
                    type="password"
                    autoComplete='current-password'
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    maxLength={128}
                />
            </label>

            {error && (
                <p className='error' role="alert">{error}</p>
            )}

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : "Log in"}
            </button>
        </form>
    )
}