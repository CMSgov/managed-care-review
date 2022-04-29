import React from 'react'
import { Alert } from '@trussworks/react-uswds'

import styles from './Dashboard.module.scss'

export function MaintenanceMessage({
    message,
}: {
    message: string
}): React.ReactElement {
    return (
        <div className={styles.alertContainer}>
            <Alert type="info" heading={message} validation={true} />
        </div>
    )
}
