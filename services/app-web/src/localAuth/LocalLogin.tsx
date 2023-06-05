import React from 'react'
import {
    Alert,
    Button,
    Card,
    CardHeader,
    CardMedia,
    CardGroup,
    CardBody,
    CardFooter,
    GridContainer,
} from '@trussworks/react-uswds'
import { useNavigate } from 'react-router-dom'
import { RoutesRecord } from '@managed-care-review/common-code/constants'
import { loginLocalUser } from '.'

import aangAvatar from '../assets/images/aang.png'
import tophAvatar from '../assets/images/toph.png'
import zukoAvatar from '../assets/images/zuko.png'
import irohAvatar from '../assets/images/iroh.png'
import rokuAvatar from '../assets/images/roku.png'
import izumiAvatar from '../assets/images/izumi.jpg'

import { useAuth } from '../contexts/AuthContext'
import { LocalUserType } from './LocalUserType'

const localUsers: LocalUserType[] = [
    {
        id: 'user1',
        email: 'aang@example.com',
        givenName: 'Aang',
        familyName: 'Avatar',
        role: 'STATE_USER',
        stateCode: 'MN',
    },
    {
        id: 'user2',
        email: 'toph@example.com',
        givenName: 'Toph',
        familyName: 'Beifong',
        role: 'STATE_USER',
        stateCode: 'VA',
    },
    {
        id: 'user3',
        email: 'zuko@example.com',
        givenName: 'Zuko',
        familyName: 'Hotman',
        role: 'CMS_USER',
        stateAssignments: [],
    },
    {
        id: 'user5',
        email: 'roku@example.com',
        givenName: 'Roku',
        familyName: 'Hotman',
        role: 'CMS_USER',
        stateAssignments: [],
    },
    {
        id: 'user6',
        email: 'izumi@example.com',
        givenName: 'Izumi',
        familyName: 'Hotman',
        role: 'CMS_USER',
        stateAssignments: [],
    },
    {
        id: 'user4',
        email: 'iroh@example.com',
        givenName: 'Iroh',
        familyName: 'Coldstart',
        role: 'ADMIN_USER',
    },
]

const userAvatars: { [key: string]: string } = {
    'aang@example.com': aangAvatar,
    'toph@example.com': tophAvatar,
    'zuko@example.com': zukoAvatar,
    'iroh@example.com': irohAvatar,
    'roku@example.com': rokuAvatar,
    'izumi@example.com': izumiAvatar,
}

export function LocalLogin(): React.ReactElement {
    const [showFormAlert, setShowFormAlert] = React.useState(false)
    const navigate = useNavigate()
    const { checkAuth, loginStatus } = useAuth()

    async function login(user: LocalUserType) {
        loginLocalUser(user)

        try {
            await checkAuth()
            navigate(RoutesRecord.ROOT)
        } catch (error) {
            setShowFormAlert(true)
            console.info('Log: Server Error')
        }
    }

    return (
        <GridContainer>
            <h2>Auth Page</h2>
            <h3>Local Login</h3>
            <div>Login as one of our hard coded users:</div>
            {showFormAlert && (
                <Alert headingLevel="h4" type="error">
                    Something went wrong
                </Alert>
            )}
            <CardGroup>
                {localUsers.map((user) => {
                    const fromString =
                        user.role === 'ADMIN_USER'
                            ? 'CMS (Admin)'
                            : user.role === 'CMS_USER'
                            ? 'CMS'
                            : user.stateCode

                    return (
                        <Card key={user.email}>
                            <CardMedia>
                                <img
                                    src={userAvatars[user.email]}
                                    alt={user.givenName}
                                />
                            </CardMedia>
                            <CardHeader>
                                <h2 className="usa-card__heading">
                                    {user.givenName}
                                </h2>
                            </CardHeader>
                            <CardBody>
                                <p>From {fromString}</p>
                            </CardBody>
                            <CardFooter>
                                <Button
                                    data-testid={`${user.givenName}Button`}
                                    type="submit"
                                    disabled={loginStatus === 'LOADING'}
                                    onClick={() => login(user)}
                                >
                                    Login
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </CardGroup>
        </GridContainer>
    )
}
