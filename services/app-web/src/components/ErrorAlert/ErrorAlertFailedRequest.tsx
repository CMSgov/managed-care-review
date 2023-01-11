import React from 'react'
import styles from './ErrorAlert.module.scss'
import { Alert, Link } from '@trussworks/react-uswds'
import { MAIL_TO_SUPPORT } from '../../constants/errors'

export type ErrorAlertFailedRequestProps = {
    message?: string
    heading?: string
}
// TODO: Refactor to use Error Alert and switchover components using GenericApiErrorBanner to use this
export const ErrorAlertFailedRequest = ({
    message,
}: ErrorAlertFailedRequestProps): React.ReactElement => {
    return (
        <Alert
            role="alert"
            type="error"
            heading="System error"
            headingLevel="h3"
            validation
            data-testid="error-alert"
        >
            <div className={styles.messageBodyText}>
                <p className="usa-alert__text">
                    <b>
                        {message || "We're having trouble loading this page."}
                    </b>
                </p>
                <p className="usa-alert__text">
                    <span>
                        Please refresh your browser and if you continue to
                        experience an error,&nbsp;
                    </span>
                    <Link href={MAIL_TO_SUPPORT}>let us know.</Link>
                </p>
            </div>
        </Alert>
    )
}
