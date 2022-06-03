import React from 'react'
import { useField } from 'formik'
import { Fieldset } from '@trussworks/react-uswds'
import { FieldRadio } from '../FieldRadio/FieldRadio'
import { PoliteErrorMessage } from '../../'

import styles from './FieldYesNo.module.scss'

/**
 * This component renders a pair of radio buttons with Yes and No as the options.
 *
 * It relies on the Formik useField hook to work, so it must ALWAYS be rendered
 * inside of a Formik form context.
 *
 * If you want to use these components outside a Formik form, you can use the
 * ReactUSWDS components directly.
 */

export type FieldYesNoProps = {
    name: string
    label: string
    showError: boolean
    id: string
} & JSX.IntrinsicElements['input']

export const FieldYesNo = ({
    name,
    label,
    showError,
    id,
    ...inputProps
}: FieldYesNoProps): React.ReactElement => {
    const [_field, meta] = useField({ name })

    const isRequired =
        inputProps['aria-required'] !== false && inputProps.required !== false // consumer must explicitly say this field is not required, otherwise we assume aria-required
    return (
        <Fieldset
            role="radiogroup"
            aria-required={isRequired}
            id={id}
            className={styles.yesnofield}
        >
            <span className={styles.label}>{label}</span>
            {showError && meta.error && (
                <PoliteErrorMessage>{meta.error}</PoliteErrorMessage>
            )}
            <span className={styles.optionsContainer}>
                <FieldRadio
                    id={id + 'Yes'}
                    className={styles.yes}
                    name={name}
                    label="Yes"
                    aria-required={isRequired}
                    value="YES"
                />
                <FieldRadio
                    id={id + 'No'}
                    className={styles.no}
                    name={name}
                    label="No"
                    aria-required={isRequired}
                    value="NO"
                />
            </span>
        </Fieldset>
    )
}
