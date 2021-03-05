import React from 'react'
import {
    Button,
    Card,
    CardHeader,
    CardMedia,
    CardGroup,
    CardBody,
    CardFooter,
} from '@trussworks/react-uswds'
import { useHistory } from 'react-router-dom'

import { loginLocalUser } from './localLogin'

import aangAvatar from '../../assets/images/aang.png'
import tophAvatar from '../../assets/images/toph.png'
import { useAuth } from '../../contexts/AuthContext'
import { User as UserType } from '../../gen/gqlClient'

const localUsers: UserType[] = [
    {
        email: 'aang@dhs.state.mn.us',
        name: 'Aang',
        role: 'STATE_USER',
        state: {
            name: 'Minnesota',
            code: 'MN',
            programs: [{ name: 'MSHO' }, { name: 'PMAP' }, { name: 'SNBC' }],
        },
    },
    {
        email: 'toph@dmas.virginia.gov',
        name: 'Toph',
        role: 'STATE_USER',
        state: {
            name: 'Virginia',
            code: 'VA',
            programs: [{ name: 'CCC Plus' }, { name: 'Medallion' }],
        },
    },
]

const userAvatars: { [key: string]: string } = {
    'aang@dhs.state.mn.us': aangAvatar,
    'toph@dmas.virginia.gov': tophAvatar,
}

export function LocalAuth(): React.ReactElement {
    const history = useHistory()
    const { checkAuth } = useAuth()

    async function login(user: UserType) {
        loginLocalUser(user)

        await checkAuth()
        history.push('/dashboard')
    }

    return (
        <>
            <h3>Local Login</h3>
            <div>Login as one of our hard coded users:</div>
            <CardGroup>
                {localUsers.map((user) => {
                    return (
                        <Card key={user.email}>
                            <CardMedia>
                                <img
                                    src={userAvatars[user.email]}
                                    alt={user.name}
                                />
                            </CardMedia>
                            <CardHeader>
                                <h2 className="usa-card__heading">
                                    {user.name}
                                </h2>
                            </CardHeader>
                            <CardBody>
                                <p>From {user.state.code}</p>
                            </CardBody>
                            <CardFooter>
                                <Button
                                    data-testid={`${user.name}Button`}
                                    type="submit"
                                    onClick={() => login(user)}
                                >
                                    Login
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </CardGroup>
        </>
    )
}
