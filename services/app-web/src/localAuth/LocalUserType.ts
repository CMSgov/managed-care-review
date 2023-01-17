import { StateType } from '../common-code/healthPlanFormDataType'

type LocalUserType = LocalStateUserType | LocalCMSUserType | LocalAdminUserType

type LocalStateUserType = {
    id: string
    role: 'STATE_USER'
    email: string
    stateCode: string
    givenName: string
    familyName: string
}

type LocalCMSUserType = {
    id: string
    role: 'CMS_USER'
    email: string
    givenName: string
    familyName: string
    stateAssignments: StateType[]
}

type LocalAdminUserType = {
    id: string
    role: 'ADMIN_USER'
    email: string
    givenName: string
    familyName: string
}

function isLocalUser(user: unknown): user is LocalUserType {
    if (user && typeof user === 'object') {
        if ('role' in user) {
            const roleUser = user as { role: unknown }
            if (typeof roleUser.role === 'string') {
                if (
                    roleUser.role === 'STATE_USER' ||
                    roleUser.role === 'CMS_USER'
                ) {
                    return true
                }
            }
        }
    }

    return false
}

export type { LocalUserType }

export { isLocalUser }
