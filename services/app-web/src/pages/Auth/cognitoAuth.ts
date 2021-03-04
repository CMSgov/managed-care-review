import { Auth as AmplifyAuth } from 'aws-amplify'
import { CognitoUser } from 'amazon-cognito-identity-js'
import { UserType } from '../../common-code/domain-models/user'

type newUser = {
    username: string
    password: string
    given_name: string
    family_name: string
    state_code: UserType['state']
}

type AmplifyErrorCodes =
    | 'UsernameExistsException'
    | 'ExpiredCodeException'
    | 'UserNotConfirmedException'
    | 'NotAuthorizedException'

export interface AmplifyError {
    code: AmplifyErrorCodes
    name: string
    message: string
}

// typescript user defined type assertion
function isAmplifyError(err: unknown): err is AmplifyError {
    const ampErr = err as AmplifyError
    return 'code' in ampErr && 'message' in ampErr && 'name' in ampErr
}

export async function signUp(
    user: newUser
): Promise<CognitoUser | AmplifyError> {
    try {
        const result = await AmplifyAuth.signUp({
            username: user.username,
            password: user.password,
            attributes: {
                given_name: user.given_name,
                family_name: user.family_name,
                state_code: user.state_code,
            },
        })
        return result.user
    } catch (e) {
        console.log('ERROR SIGNUP', e)

        if (isAmplifyError(e)) {
            if (e.code === 'UsernameExistsException') {
                console.log('that username already exists....')
                return e
            } else {
                // if amplify returns an error in a format we don't expect, let's throw it for now.
                // might be against the spirit of never throw, but this is our boundary with a system we don't control.
                throw e
            }
        } else {
            throw e
        }
    }
}

export async function confirmSignUp(
    email: string,
    code: string
): Promise<null | AmplifyError> {
    try {
        await AmplifyAuth.confirmSignUp(email, code)
        return null
    } catch (e) {
        if (isAmplifyError(e)) {
            if (e.code === 'ExpiredCodeException') {
                console.log('your code is expired, we are sending another one.')
                return e
            } else {
                throw e
            }
        } else {
            throw e
        }
    }
}

export async function resendSignUp(
    email: string
): Promise<null | AmplifyError> {
    try {
        await AmplifyAuth.resendSignUp(email)
        return null
    } catch (e) {
        // no known handleable errors for this one...
        console.log('unknown err', e)
        throw e
    }
}

export async function signIn(
    email: string,
    password: string
): Promise<CognitoUser | AmplifyError> {
    try {
        const result = await AmplifyAuth.signIn(email, password)
        return result.user
    } catch (e) {
        if (isAmplifyError(e)) {
            if (e.code === 'UserNotConfirmedException') {
                console.log(
                    'you need to confirm your account, enter the code below'
                )
                return e
            } else if (e.code === 'NotAuthorizedException') {
                console.log('unknown user or password?')
                return e
            } else {
                // if amplify returns an error in a format we don't expect, let's throw it for now.
                // might be against the spirit of never throw, but this is our boundary with a system we don't control.
                return e
            }
        } else {
            return e
        }
    }
}

export async function signOut(): Promise<null> {
    try {
        await AmplifyAuth.signOut()
        return null
    } catch (e) {
        console.log('error signing out: ', e)
        throw e
    }
}
