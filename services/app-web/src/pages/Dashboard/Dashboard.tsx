import { Button, GridContainer, Grid } from '@trussworks/react-uswds'

import styles from './Dashboard.module.scss'
import { Tabs } from '../../components/Tabs/Tabs'
import { TabPanel } from '../../components/Tabs/TabPanel'
import { useAuth } from '../../contexts/AuthContext'

type UserProgram = {
    name: string
    populations: string
}

export const Dashboard = (): React.ReactElement => {
    const { isLoading, loggedInUser } = useAuth()

    // TODO: replace const with dynamic data per user
    const USER_PROGRAMS: UserProgram[] = [
        { name: 'CCC Plus', populations: 'Medicaid only' },
        { name: 'Medallion', populations: 'Medicaid + CHIP' },
    ]

    if (isLoading || !loggedInUser) {
        return <div>Loading User Info</div>
    }

    const handleNewSubmissionClick = () => {
        console.log('Implement redirect')
    }

    const ProgramContent = ({
        program,
    }: {
        program: UserProgram
    }): React.ReactElement => {
        return (
            <section key={program.name} className={styles.panel}>
                <div className={styles.panelHeading}>
                    <h2>Submissions</h2>
                    <Button type="button" onClick={handleNewSubmissionClick}>
                        Start new submission
                    </Button>
                </div>
                <div>
                    <h3>You have no submissions yet.</h3>
                </div>
            </section>
        )
    }

    return (
        <GridContainer className={styles.container} data-testid="dashboardPage">
            <Tabs className={styles.tabs}>
                {USER_PROGRAMS.map((program: UserProgram) => (
                    <TabPanel
                        key={program.name}
                        id={program.name}
                        tabName={program.name}
                    >
                        <ProgramContent key={program.name} program={program} />
                    </TabPanel>
                ))}
            </Tabs>
        </GridContainer>
    )
}
