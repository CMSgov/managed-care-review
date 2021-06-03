import React from 'react'
import { useField } from 'formik'
import { Checkbox } from '@trussworks/react-uswds'

/**
 * This component renders a checkbox
 *
 * It relies on the Formik useField hook to work, so it must ALWAYS be rendered
 * inside of a Formik form context.
 *
 * If you want to use these components outside a Formik form, you can use the
 * ReactUSWDS components directly.
 */

export type FieldCheckboxProps = {
    name: string
    label: string
    id: string
} & JSX.IntrinsicElements['input']

export const FieldCheckbox = ({
    name,
    label,
    id,
    ...inputProps
}: FieldCheckboxProps): React.ReactElement => {
    const [field] = useField({ name })
    return (
        <Checkbox
            id={id}
            label={label}
            {...field}
            {...inputProps}
            name={name}
        />
    )
}
