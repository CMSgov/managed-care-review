import React from 'react'
import { useField } from 'formik'
import { Radio } from '@trussworks/react-uswds'

/**
 * This component renders a radio button
 *
 * It relies on the Formik useField hook to work, so it must ALWAYS be rendered
 * inside of a Formik form context.
 *
 * If you want to use these components outside a Formik form, you can use the
 * ReactUSWDS components directly.
 */

export type FieldRadioProps = {
    name: string
    label: string
    id: string
} & JSX.IntrinsicElements['input']

export const FieldRadio = ({
    name,
    label,
    id,
    value,
    ...inputProps
}: FieldRadioProps): React.ReactElement => {
    const [field] = useField({ name, value, type: 'radio' })
    const isRequired =
        inputProps['aria-required'] !== false && inputProps.required !== false // consumer must explicitly say this field is not required, otherwise we assume aria-required
    return (
        <Radio
            id={id}
            label={label}
            {...field}
            {...inputProps}
            name={name}
            aria-required={isRequired}
        />
    )
}
