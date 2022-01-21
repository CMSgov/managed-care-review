import React from 'react'
import { useField } from 'formik'
import { Label, Textarea, FormGroup } from '@trussworks/react-uswds'
import { PoliteErrorMessage } from '../..'

/**
 * This component renders a ReactUSWDS TextArea component inside of a FormGroup,
 * with a Label and ErrorMessage.
 *
 * It relies on the Formik useField hook to work, so it must ALWAYS be rendered
 * inside of a Formik form context.
 *
 * If you want to use these components outside a Formik form, you can use the
 * ReactUSWDS components directly.
 */

export type TextAreaProps = {
    label: string
    id: string
    hint?: React.ReactNode
    error?: string
    showError: boolean
    name: string
} & JSX.IntrinsicElements['textarea']

export const FieldTextarea = ({
    label,
    id,
    hint,
    error,
    showError,
    name,
    ...inputProps
}: TextAreaProps): React.ReactElement => {
    const [field, meta] = useField({ name })
    return (
        <FormGroup error={showError}>
            <Label htmlFor={id} error={showError}>
                {label}
            </Label>
            {showError && meta.error && (
                <PoliteErrorMessage>{meta.error}</PoliteErrorMessage>
            )}
            {hint && (
                <div aria-labelledby={id} className="usa-hint margin-top-1">
                    {hint}
                </div>
            )}
            <Textarea
                {...field}
                {...inputProps}
                id={id}
                name={name}
                error={showError}
            />
        </FormGroup>
    )
}
