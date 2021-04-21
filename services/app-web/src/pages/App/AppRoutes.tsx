import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { useLocation } from 'react-router'

import { CognitoLogin } from '../Auth/CognitoLogin'
import { LocalLogin } from '../Auth/LocalLogin'
import { Error404 } from '../Errors/Error404'
import { useAuth } from '../../contexts/AuthContext'
import { Dashboard } from '../Dashboard/Dashboard'
import { Landing } from '../Landing/Landing'
import { RoutesRecord } from '../../constants/routes'
import { StateSubmissionForm } from '../StateSubmissionForm/StateSubmissionForm'
import { NewStateSubmissionForm } from '../StateSubmissionForm/NewStateSubmissionForm'
import { SubmissionDescriptionExamples } from '../Help/SubmissionDescriptionExamples'
import { S3Test } from '../S3Test/S3Test'
import { useTitle } from '../../hooks/useTitle'
import { getRouteName, PageTitlesRecord } from '../../constants/routes'

import { AuthModeType, assertNever } from '../../common-code/domain-models'

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

export const AppRoutes = ({
    authMode,
}: {
    authMode: AuthModeType
}): React.ReactElement => {
    const { loggedInUser } = useAuth()
    const { pathname } = useLocation()
    const route = getRouteName(pathname)

    /*
        Add page titles throughout the application
    */
    const title =
        route === 'ROOT' && loggedInUser
            ? PageTitlesRecord['DASHBOARD']
            : route === 'UNKNOWN_ROUTE'
            ? 'Managed Care Review'
            : PageTitlesRecord[route]
    useTitle(title)

    const authComponent = componentForAuthMode(authMode)

    const AuthenticatedRoutes = (): React.ReactElement => {
        return (
            <Switch>
                <Route path={RoutesRecord.ROOT} exact component={Dashboard} />
                <Route path={RoutesRecord.DASHBOARD} component={Dashboard} />
                <Route
                    path={RoutesRecord.SUBMISSIONS_NEW}
                    component={NewStateSubmissionForm}
                />
                <Route
                    path={RoutesRecord.SUBMISSIONS_FORM}
                    component={StateSubmissionForm}
                />
                <Route
                    path={RoutesRecord.HELP_SUBMISSION_DESCRIPTION}
                    component={SubmissionDescriptionExamples}
                />
                <Route path="/dev/s3test">
                    <S3Test />
                </Route>
                <Route path="*" component={Error404} />
            </Switch>
        )
    }

    const UnauthenticatedRoutes = (): React.ReactElement => {
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
    return (
        <>
            {!loggedInUser ? (
                <UnauthenticatedRoutes />
            ) : (
                <AuthenticatedRoutes />
            )}
        </>
    )
}
