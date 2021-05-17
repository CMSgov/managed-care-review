import React from 'react'
import {
    Alert,
    Button,
    Link,
    GridContainer,
    Grid,
} from '@trussworks/react-uswds'
import { NavLink } from 'react-router-dom'

import { idmRedirectURL } from '../../pages/Auth/cognitoAuth'
import onemacLogo from '../../assets/images/onemac-logo.svg'
import styles from './Header.module.scss'

import { getRouteName } from '../../constants/routes'
import { useHistory } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePage } from '../../contexts/PageContext'
import { AuthModeType } from '../../common-code/domain-models'
import { Logo } from '../Logo/Logo'
import { PageHeadingRow } from './PageHeadingRow'
import { User } from '../../gen/gqlClient'

export type HeaderProps = {
    authMode: AuthModeType
    setAlert?: React.Dispatch<React.ReactElement>
}
/**
 * CMS Header
 */
export const Header = ({
    authMode,
    setAlert,
}: HeaderProps): React.ReactElement => {
    const { logout, loggedInUser, loginStatus } = useAuth()
    const history = useHistory()
    const { heading } = usePage()
    const route = getRouteName(history.location.pathname)

    const handleLogout = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        if (!logout) {
            console.log('Something went wrong ', e)
            return
        }

        logout().catch(() => {
            setAlert &&
                setAlert(
                    <Alert
                        data-testid="Error400"
                        style={{ width: '600px', marginBottom: '5px' }}
                        type="error"
                        heading="Oops! Something went wrong"
                    />
                )
        })
        history.push('/')
    }

    const LoggedInUserInfo = (user: User): React.ReactElement => {
        return (
            <div className={styles.userInfo}>
                <span>{user.email}</span>
                <span className={styles.divider}>|</span>

                <Button type="button" unstyled onClick={handleLogout}>
                    Sign out
                </Button>
            </div>
        )
    }

    const LoggedOutUserInfo = (authMode: AuthModeType): React.ReactElement => {
        return authMode === 'IDM' ? (
            <Link
                className="usa-button usa-button--outline usa-button--inverse"
                variant="unstyled"
                href={idmRedirectURL()}
            >
                Sign In
            </Link>
        ) : (
            <Link
                asCustom={NavLink}
                className="usa-button usa-button--outline usa-button--inverse"
                variant="unstyled"
                to="/auth"
            >
                Sign In
            </Link>
        )
    }

    const UserInfo = (): React.ReactElement | null => {
        return loggedInUser
            ? LoggedInUserInfo(loggedInUser)
            : loginStatus === 'LOADING'
            ? null
            : LoggedOutUserInfo(authMode)
    }

    return (
        <header>
            <div className={styles.banner}>
                <GridContainer>
                    <Grid row className="flex-justify flex-align-center">
                        <NavLink className={styles.bannerLogo} to="/dashboard">
                            <Logo
                                src={onemacLogo}
                                alt="One Mac"
                                className={styles.logoImg}
                            />
                            <span>Managed Care Review</span>
                        </NavLink>
                        <UserInfo />
                    </Grid>
                </GridContainer>
            </div>
            <PageHeadingRow
                heading={route !== 'UNKNOWN_ROUTE' ? heading : undefined}
                isLoading={loginStatus === 'LOADING'}
                loggedInUser={loggedInUser}
            />
        </header>
    )
}
