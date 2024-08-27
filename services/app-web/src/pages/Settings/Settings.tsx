import React from 'react'
import { Grid, GridContainer } from '@trussworks/react-uswds'
import { useAuth } from '../../contexts/AuthContext'
import styles from './Settings.module.scss'
import { Tabs, TabPanel, Loading } from '../../components'
import { EmailSettingsTable } from './EmailSettingsTables/EmailSettingsTables'
import { CMSUsersTable } from './CMSUsersTable/CMSUsersTable'
import { SettingsErrorAlert } from './SettingsErrorAlert'
import { useLocation } from 'react-router-dom'
import { recordJSException } from '../../otelHelpers'
import {
    hasAdminUserPermissions,
    hasCMSUserPermissions,
} from '../../gqlHelpers'
import { useLDClient } from 'launchdarkly-react-client-sdk'
import { featureFlags } from '../../common-code/featureFlags'

export const TestMonitoring = (): null => {
    const location = useLocation()
    const monitoringTest = new URLSearchParams(location.search).get('test')
    if (monitoringTest) {
        if (monitoringTest === 'crash') {
            throw new Error(
                'This is a force JS error - should catch in error boundary and log to monitoring'
            )
        } else if (monitoringTest === 'error') {
            recordJSException(new Error('Test error logging'))
        }
    }
    return null
}
export const Settings = (): React.ReactElement => {
    const { loginStatus, loggedInUser } = useAuth()
    const ldClient = useLDClient()

    const showReadWriteStateAssignments = ldClient?.variation(
        featureFlags.READ_WRITE_STATE_ASSIGNMENTS.flag,
        featureFlags.READ_WRITE_STATE_ASSIGNMENTS.defaultValue
    )

    const isAuthenticated = loginStatus === 'LOGGED_IN'
    const isAllowedToSeeSettings =
        hasAdminUserPermissions(loggedInUser) ||
        (hasCMSUserPermissions(loggedInUser) && showReadWriteStateAssignments)

    const loading = loginStatus === 'LOADING' || !loggedInUser

    return (
        <GridContainer className={styles.pageContainer}>
            {loading ? (
                <Loading />
            ) : !isAuthenticated || !isAllowedToSeeSettings ? (
                <SettingsErrorAlert
                    isAuthenticated={isAuthenticated}
                    isAdmin={isAllowedToSeeSettings}
                />
            ) : (
                <Grid>
                    <h2>MC Review Settings</h2>
                    <Tabs className={styles.tabs}>
                        <TabPanel id="cms-users" tabName="CMS users">
                            <CMSUsersTable />
                        </TabPanel>

                        <TabPanel
                            id="automated-emails"
                            tabName="Automated emails"
                        >
                            <EmailSettingsTable type="GENERAL" />
                        </TabPanel>
                        <TabPanel id="analysts" tabName="State analysts">
                            <EmailSettingsTable type="ANALYSTS" />
                        </TabPanel>
                        <TabPanel id="support-emails" tabName="Support emails">
                            <EmailSettingsTable type="SUPPORT" />
                        </TabPanel>
                    </Tabs>
                    <TestMonitoring />
                </Grid>
            )}
        </GridContainer>
    )
}
