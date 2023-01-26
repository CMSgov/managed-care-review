import classnames from 'classnames'
import React from 'react'
import styles from './ErrorAlert.module.scss'
import { Alert, Link } from '@trussworks/react-uswds'
import { MAIL_TO_SUPPORT } from '../../constants/errors'

export type ErrorAlertProps = {
    message?: React.ReactNode
    heading?: string
    calltoAction?: React.ReactNode
    appendLetUsKnow?: boolean
} & JSX.IntrinsicElements['div']

export const ErrorAlert = ({
    message,
    heading,
    appendLetUsKnow = false,
    className,
    ...divProps
}: ErrorAlertProps): React.ReactElement => {
    const classes = classnames(styles.messageBodyText, className)
    const showLink = appendLetUsKnow || !message // our default message includes the link
    return (
        <Alert
            role="alert"
            type="error"
            heading={heading || 'System error'}
            headingLevel="h4"
            data-testid="error-alert"
            className={classes}
            {...divProps}
        >
            <span>
                {message ||
                    "We're having trouble loading this page. Please refresh your browser and if you continue to experience an error,"}
            </span>

            {showLink && (
                <span>
                    &nbsp;email{' '}
                    <Link className={styles.nowrap} href={MAIL_TO_SUPPORT}>
                        {MAIL_TO_SUPPORT}
                    </Link>
                </span>
            )}
        </Alert>
    )
}
