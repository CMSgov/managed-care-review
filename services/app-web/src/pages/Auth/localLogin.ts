import { User, isUser } from '../../common-code/domain-models'

const localUserKey = 'localUser'

// loginLocalUser stores a local user in local storage
export function loginLocalUser(user: User): void {
    const store = window.localStorage
    store.setItem(localUserKey, JSON.stringify(user))
}

export function logoutLocalUser(): void {
    const store = window.localStorage
    store.removeItem(localUserKey)
}

// getLoggedInUser retrieves a local user if one is logged in
export function getLoggedInUser(): Promise<User | null> {
    const store = window.localStorage
    const storedUserString = store.getItem(localUserKey)

    return new Promise((accept, reject) => {
        if (storedUserString === null) {
            accept(null)
            return
        }
        try {
            const storedUser = JSON.parse(storedUserString)

            if (isUser(storedUser)) {
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
