import React, { useState } from 'react'
import {
    Alert,
    Button,
    Form,
    FormGroup,
    Label,
    TextInput,
} from '@trussworks/react-uswds'
import { useHistory } from 'react-router-dom'

import { signIn } from '../Auth/cognitoAuth'
import { useAuth } from '../../contexts/AuthContext'

type Props = {
    defaultEmail?: string
}

export function Login({ defaultEmail }: Props): React.ReactElement {
    const [showFormAlert, setShowFormAlert] = React.useState(false)
    const [fields, setFields] = useState({
        loginEmail: defaultEmail || '',
        loginPassword: '',
    })

    const history = useHistory()
    const { loginStatus, checkAuth } = useAuth()
    if (loginStatus === 'LOGGED_IN') history.push('/dashboard')

    const onFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = event.target
        setFields((prevFields) => ({ ...prevFields, ...fields, [id]: value }))
        if (showFormAlert) setShowFormAlert(false)
    }

    function validateForm() {
        return fields.loginEmail.length > 0 && fields.loginPassword.length > 0
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        try {
            const result = await signIn(fields.loginEmail, fields.loginPassword)
            // TODO: try and useAuth() here, track state using the loading param there instead of awaiting something.
            // if loading, show "redirecting" spinner or something.
            // if loggedInUser, redirect

            if (result && 'code' in result) {
                if (result.code === 'UserNotConfirmedException') {
                    // the user has not been confirmed, need to display the confirmation UI
                    console.log(
                        'you need to confirm your account, enter the code below'
                    )
                } else if (result.code === 'NotAuthorizedException') {
                    // the password is bad
                    console.log('bad password')
                } else {
                    console.log('Unknown error from Amplify: ', result)
                }
                setShowFormAlert(true)
                console.log('Error', result.message)
            } else {
                try {
                    await checkAuth()
                } catch (e) {
                    console.log('UNEXPECTED NOT LOGGED IN AFTER LOGGIN', e)
                    setShowFormAlert(true)
                }

                history.push('/dashboard')
            }
        } catch (err) {
            console.log('Unexpected error signing in:', err)
        }
    }

    return (
        <Form onSubmit={handleSubmit} name="Login" aria-label="Login Form">
            {showFormAlert && <Alert type="error">Something went wrong</Alert>}
            <FormGroup>
                <Label htmlFor="loginEmail">Email</Label>
                <TextInput
                    data-testid="loginEmail"
                    id="loginEmail"
                    name="loginEmail"
                    type="email"
                    value={fields.loginEmail}
                    onChange={onFieldChange}
                />
            </FormGroup>
            <FormGroup>
                <Label htmlFor="loginPassword">Password</Label>
                <TextInput
                    data-testid="loginPassword"
                    id="loginPassword"
                    name="loginPassword"
                    type="password"
                    value={fields.loginPassword}
                    onChange={onFieldChange}
                />
            </FormGroup>
            <Button
                type="submit"
                disabled={!validateForm() || loginStatus === 'LOADING'}
            >
                Login
            </Button>
        </Form>
    )
}
