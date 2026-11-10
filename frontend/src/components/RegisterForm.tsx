import { useState } from "react";
import type { FormEvent } from "react";

import { registerUser } from "../api/auth";

type RegisterFormProps = {
    onRegistered(username: string): void
    onCancel(): void
}

export default function RegisterForm(props: RegisterFormProps){
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>){
        event.preventDefault()
        setError("")
        setIsSubmitting(true)

        try{
            const createdUser = await registerUser(username.trim(), password)

            //tell app that registration succeeded
            props.onRegistered(createdUser.username)
        }catch(cause){
            if(cause instanceof Error){
                setError(cause.message)
            }else{
                setError("Something went wrong while creating your account.")
            }
        }finally{
            setIsSubmitting(false)
        }

    }

    return(
        <form onSubmit={handleSubmit}>
            <h2>Create Account</h2>

            <label>
                Username
                <input
                    name="username"
                    value={username}
                    onChange={function(event){
                        setUsername(event.target.value)
                    }}
                    autoComplete="username"
                    pattern="[a-z0-9_]{3,30}"
                    minLength={3}
                    maxLength={30}
                    required
                    disabled={isSubmitting}
                />
                <small className="muted">Use 3-30 lowercase letters, numbers or underscores.</small>
            </label>

            <label>
                Password
                <input
                    name="password"
                    type="password"
                    value={password}
                    onChange={function (event){
                        setPassword(event.target.value)
                    }}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                    disabled={isSubmitting}
                />
                <small className="muted">Use at least 12 characters</small>
            </label>

            {error && (
                <p className="error" role="alert">{error}</p>
            )}

            <div className="button-row">
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account" : "Create account"}
                </button>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={props.onCancel}
                    disabled={isSubmitting}>
                        back to login
                </button>
            </div>

        </form>
    )

}