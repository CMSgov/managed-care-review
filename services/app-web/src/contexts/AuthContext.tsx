import * as React from 'react'
import { useQuery } from '@apollo/client'

import { signOut as cognitoSignOut } from '../pages/Auth/cognitoAuth'
import { GetCurrentUserDocument, User as UserType } from '../gen/gqlClient'
import { logoutLocalUser } from '../pages/Auth/localAuth'
import { AuthModeType } from '../common-code/domain-models'

type LogoutFn = () => Promise<null>

type AuthContextType = {
    loggedInUser: UserType | undefined
    isAuthenticated: boolean
    isLoading: boolean
    checkAuth: () => Promise<void> // this can probably be simpler, letting callers use the loading states etc instead.
    logout: undefined | (() => Promise<void>)
}

export type LoggedInAuthContext = Omit<AuthContextType, 'loggedInUser'> & {
    loggedInUser: UserType
}
const AuthContext = React.createContext<AuthContextType>({
    loggedInUser: undefined,
    isAuthenticated: false,
    isLoading: false,
    checkAuth: () => Promise.reject(Error('Auth context error')),
    logout: undefined,
})

export type AuthProviderProps = {
    authMode: AuthModeType
    children?: React.ReactNode
}

function AuthProvider({
    authMode,
    children,
}: AuthProviderProps): React.ReactElement {
    const [loggedInUser, setLoggedInUser] = React.useState<
        UserType | undefined
    >(undefined)
    const [isLoading, setIsLoading] = React.useState(true)

    const { loading, data, error, refetch } = useQuery(GetCurrentUserDocument, {
        notifyOnNetworkStatusChange: true,
    })

    const isAuthenticated = loggedInUser !== undefined

    if (isLoading !== loading) {
        setIsLoading(loading)
    } else {
        if (error) {
            const { graphQLErrors, networkError } = error

            if (graphQLErrors)
                graphQLErrors.forEach(({ message, locations, path }) =>
                    console.log(
                        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
                    )
                )

            if (networkError) console.log(`[Network error]: ${networkError}`)
            if (isAuthenticated) {
                setLoggedInUser(undefined)
            }

            // TODO: do something different if the error is not 403
            // if the error is 403, then that's all gravy, just set logged in user to undefined
            // lets try and record what different errors are here.
            // call a generic graphql connection etc. error here.
        } else if (data?.getCurrentUser) {
            if (!isAuthenticated) {
                setLoggedInUser(data.getCurrentUser)
            }
        }
    }

    const checkAuth = () => {
        return new Promise<void>((resolve, reject) => {
            refetch()
                .then(() => {
                    resolve()
                })
                .catch((e) => {
                    console.log('Check Auth Failed.', e)
                    reject(e)
                })
        })
    }

    const realLogout: LogoutFn =
        authMode === 'LOCAL' ? logoutLocalUser : cognitoSignOut

    const logout =
        loggedInUser === undefined
            ? undefined
            : () => {
                  return new Promise<void>((resolve, reject) => {
                      realLogout()
                          .then(() => {
                              refetch()
                                  .then(() => {
                                      // this would actually be unexpected.
                                      reject(
                                          new Error(
                                              "Logout somehow didn't trigger a 403"
                                          )
                                      )
                                  })
                                  .catch(() => {
                                      // we expect this to 403, but that's all the logout caller is waiting on
                                      resolve()
                                  })
                          })
                          .catch((e) => {
                              console.log('Logout Failed.', e)
                              reject(e)
                          })
                  })
              }

    return (
        <AuthContext.Provider
            value={{
                loggedInUser,
                isAuthenticated,
                isLoading,
                logout,
                checkAuth,
            }}
            children={children}
        />
    )
}

const useAuth = (): AuthContextType => React.useContext(AuthContext)

export { AuthProvider, useAuth }
