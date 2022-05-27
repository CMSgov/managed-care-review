import React, { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router'
import { Route, Switch } from 'react-router-dom'
import { useLDClient } from 'launchdarkly-react-client-sdk'
import { extendSession } from '../../pages/Auth/cognitoAuth'
import { assertNever, AuthModeType } from '../../common-code/config'
import {
    getRouteName,
    PageTitlesRecord,
    RoutesRecord,
    RouteT,
} from '../../constants/routes'
import { useAuth } from '../../contexts/AuthContext'
import { usePage } from '../../contexts/PageContext'
import { useTitle } from '../../hooks/useTitle'
import { LocalLogin } from '../../localAuth'
import { idmRedirectURL } from '../../pages/Auth/cognitoAuth'
import { CognitoLogin } from '../Auth/CognitoLogin'
import { CMSDashboard } from '../Dashboard/CMSDashboard'
import { Dashboard } from '../Dashboard/Dashboard'
import { AuthenticatedRouteWrapper } from '../Wrapper/AuthenticatedRouteWrapper'
import { Error404 } from '../Errors/Error404'
import { Help } from '../Help/Help'
import { Landing } from '../Landing/Landing'
import { NewStateSubmissionForm, StateSubmissionForm } from '../StateSubmission'
import { SubmissionSummary } from '../SubmissionSummary'
import { SubmissionRevisionSummary } from '../SubmissionRevisionSummary'
import { useScrollToPageTop } from '../../hooks/useScrollToPageTop'
import { featureFlags } from '../../common-code/featureFlags'

const LOGIN_REDIRECT_STORAGE_KEY = 'LOGIN_REDIRECT'
const LocalStorage = window.localStorage

function componentForAuthMode(
    authMode: AuthModeType
): (() => React.ReactElement) | undefined {
    switch (authMode) {
        case 'LOCAL':
            return LocalLogin
        case 'AWS_COGNITO':
            return CognitoLogin
        case 'IDM':
            return undefined
        default:
            assertNever(authMode)
    }
}

const StateUserRoutes = ({
    authMode,
    setAlert,
}: {
    authMode: AuthModeType
    setAlert?: React.Dispatch<React.ReactElement>
}): React.ReactElement => {
    return (
        <AuthenticatedRouteWrapper setAlert={setAlert} authMode={authMode}>
            <Switch>
                <Route path={RoutesRecord.ROOT} exact component={Dashboard} />
                <Route path={RoutesRecord.DASHBOARD} component={Dashboard} />
                <Route
                    path={RoutesRecord.SUBMISSIONS_NEW}
                    component={NewStateSubmissionForm}
                />
                <Route
                    path={RoutesRecord.SUBMISSIONS_FORM}
                    component={SubmissionSummary}
                    exact
                />
                <Route
                    path={RoutesRecord.SUBMISSIONS_REVISION}
                    component={SubmissionRevisionSummary}
                    exact
                />
                <Route
                    path={RoutesRecord.SUBMISSIONS_FORM}
                    component={StateSubmissionForm}
                />
                <Route path={RoutesRecord.HELP} component={Help} />
                <Route path="*" component={Error404} />
            </Switch>
        </AuthenticatedRouteWrapper>
    )
}

const CMSUserRoutes = ({
    authMode,
    setAlert,
}: {
    authMode: AuthModeType
    setAlert?: React.Dispatch<React.ReactElement>
}): React.ReactElement => {
    return (
        <AuthenticatedRouteWrapper authMode={authMode} setAlert={setAlert}>
            <Switch>
                <Route
                    path={RoutesRecord.ROOT}
                    exact
                    component={CMSDashboard}
                />
                <Route path={RoutesRecord.DASHBOARD} component={CMSDashboard} />
                <Route
                    path={RoutesRecord.SUBMISSIONS_FORM}
                    component={SubmissionSummary}
                    exact
                />
                <Route
                    path={RoutesRecord.SUBMISSIONS_REVISION}
                    component={SubmissionRevisionSummary}
                    exact
                />
                <Route path="*" component={Error404} />
            </Switch>
        </AuthenticatedRouteWrapper>
    )
}

const UnauthenticatedRoutes = ({
    authMode,
}: {
    authMode: AuthModeType
}): React.ReactElement => {
    const authComponent = componentForAuthMode(authMode)

    return (
        <Switch>
            <Route path={RoutesRecord.ROOT} exact component={Landing} />
            {/* no /auth page for IDM auth, we just have the login redirect link */}
            {authComponent && (
                <Route path={RoutesRecord.AUTH} component={authComponent} />
            )}
            <Route path="*" component={Landing} />
        </Switch>
    )
}

export const AppRoutes = ({
    authMode,
    setAlert,
}: {
    authMode: AuthModeType
    setAlert?: React.Dispatch<React.ReactElement>
}): React.ReactElement => {
    const {
        loggedInUser,
        sessionIsExpiring,
        updateSessionExpirationState,
        updateSessionExpirationTime,
        checkIfSessionsIsAboutToExpire,
    } = useAuth()
    const { pathname } = useLocation()
    const ldClient = useLDClient()
    const showExpirationModal: boolean = ldClient?.variation(
        featureFlags.SESSION_EXPIRING_MODAL,
        true
    )
    const history = useHistory()
    const route = getRouteName(pathname)
    const { updateHeading } = usePage()
    const [initialPath] = useState(pathname) // this gets written on mount, so we don't call the effect on every path change
    if (
        loggedInUser !== undefined &&
        sessionIsExpiring === false &&
        showExpirationModal
    ) {
        // whenever we load a page, reset the logout timer and refresh the session
        updateSessionExpirationTime()

        if (authMode !== 'LOCAL') {
            void extendSession()
        }
        updateSessionExpirationState(false)
        // Every thirty seconds, check if the current time is within `countdownDuration` of the session expiration time
        checkIfSessionsIsAboutToExpire()
    }

    // This effect handles our initial redirect on login
    // This way, if you get a link to something and aren't logged in, you get
    // sent there after you login.
    useEffect(() => {
        // When AppRoutes mounts and we are logged out, stash the url we navigated to in local storage
        // and redirect them to auth if they aren't heading for the dashboard.
        const dontRedirectToAuthRoutes: (RouteT | 'UNKNOWN_ROUTE')[] = [
            'ROOT' as const,
            'AUTH' as const,
            'UNKNOWN_ROUTE' as const,
        ]
        if (!loggedInUser) {
            const currentRoute = getRouteName(initialPath)
            console.log('ROUTE NAME', currentRoute, dontRedirectToAuthRoutes)
            if (!dontRedirectToAuthRoutes.includes(currentRoute)) {
                try {
                    console.log('Storing For Redirect: ', initialPath)
                    LocalStorage.setItem(
                        LOGIN_REDIRECT_STORAGE_KEY,
                        initialPath
                    )

                    if (authMode === 'IDM') {
                        console.log('redirecting to', idmRedirectURL())
                        window.location.href = idmRedirectURL()
                    } else {
                        console.log('redirecting to /auth')
                        history.push('/auth')
                    }
                } catch (err) {
                    console.log(
                        'Error: Local Storage is Full Attempting to Save Redirect URL'
                    )
                }
            }
            // Then, when we login, read that key, if it exists, go forth.
        } else {
            const redirectPath = LocalStorage.getItem(
                LOGIN_REDIRECT_STORAGE_KEY
            )
            console.log('Retrieved For Redirect: ', redirectPath)

            if (redirectPath) {
                history.push(redirectPath)
                LocalStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY)
            }
        }
    }, [initialPath, loggedInUser, history, authMode])

    /*
        Side effects that happen on page change
    */
    const title =
        route === 'ROOT' && loggedInUser
            ? PageTitlesRecord['DASHBOARD']
            : PageTitlesRecord[route]

    useTitle(title)
    useScrollToPageTop()
    useEffect(() => {
        updateHeading(pathname)
    }, [pathname, updateHeading])

    if (!loggedInUser) {
        return <UnauthenticatedRoutes authMode={authMode} />
    } else if (loggedInUser.__typename === 'StateUser') {
        return <StateUserRoutes authMode={authMode} setAlert={setAlert} />
    } else {
        return <CMSUserRoutes authMode={authMode} setAlert={setAlert} />
    }
}
