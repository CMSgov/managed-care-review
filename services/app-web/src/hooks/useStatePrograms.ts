import { useAuth } from '../contexts/AuthContext'
import { Program } from '../gen/gqlClient'

// Get state programs from logged in state users data
const useStatePrograms = (): Program[] | [] => {
    const { loggedInUser } = useAuth()
    let statePrograms: Program[] = []

    if (loggedInUser && loggedInUser.__typename === 'StateUser') {
        statePrograms = loggedInUser.state.programs
    } else {
        console.error(
            `CODING ERROR: useStatePrograms does not currently support CMSUser and will return [].`
        )
    }
    return statePrograms
}

export { useStatePrograms }
