import type { CMSUsersUnionType, StateType } from '../../domain-models'
import statePrograms from '../../../../app-web/src/common-code/data/statePrograms.json'
import type { PrismaClient } from '@prisma/client'

// Returns postgres state info for the states that currently supported for pilot.
// Supported states are state that have had their programs added to the statePrograms json file.
export async function findAllSupportedStates(
    client: PrismaClient
): Promise<StateType[] | Error> {
    const pilotStateCodes = statePrograms.states.map((state) => state.code)

    try {
        const allStates = await client.state.findMany({
            orderBy: {
                stateCode: 'asc',
            },
            include: {
                users: {
                    where: {
                        role: {
                            in: ['CMS_USER', 'CMS_APPROVER_USER'],
                        },
                    },
                    include: {
                        stateAssignments: true,
                    },
                },
            },
        })

        const states = allStates.filter((state) =>
            pilotStateCodes.includes(state.stateCode)
        )

        return states.map((state) => ({
            ...state,
            users: state.users.map(
                (user) =>
                    ({
                        id: user.id,
                        role: user.role,
                        givenName: user.givenName,
                        familyName: user.familyName,
                        email: user.email,
                        stateAssignments: user.stateAssignments,
                        divisionAssignment: user.divisionAssignment,
                    }) as CMSUsersUnionType
            ),
        }))
    } catch (err) {
        console.error(err)
        return err
    }
}
