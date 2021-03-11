import { isCognitoUser } from '../../common-code/domain-models'
import { CognitoUserType } from '../../common-code/domain-models'
const localUserKey = 'localUser'

// loginLocalUser stores a local user in local storage
export function loginLocalUser(user: CognitoUserType): void {
    const store = window.localStorage
    store.setItem(localUserKey, JSON.stringify(user))
}

// Matching the signature for cognito signout for now.
export async function logoutLocalUser(): Promise<null> {
    const store = window.localStorage
    store.removeItem(localUserKey)
    return null
}

// getLoggedInUser retrieves a local user if one is logged in
export function getLoggedInUser(): Promise<CognitoUserType | null> {
    const store = window.localStorage
    const storedUserString = store.getItem(localUserKey)

    return new Promise((accept, reject) => {
        if (storedUserString === null) {
            accept(null)
            return
        }
        try {
            const storedUser = JSON.parse(storedUserString)

            if (isCognitoUser(storedUser)) {
                accept(storedUser)
                return
            } else {
                reject(new Error('garbled user stored in localStorage'))
                return
            }
        } catch (e) {
            reject(e)
            return
        }
    })
}
