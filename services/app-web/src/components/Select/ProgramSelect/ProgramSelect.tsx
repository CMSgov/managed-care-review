import React from 'react'
import styles from '../Select.module.scss'
import Select, { AriaOnFocus, Props } from 'react-select'
import { Program } from '../../../gen/gqlClient'
import { useField } from 'formik'

export type ProgramSelectPropType = {
    name: string
    statePrograms: Program[]
    programIDs: string[]
}

export interface ProgramOptionType {
    readonly value: string
    readonly label: string
    readonly isFixed?: boolean
    readonly isDisabled?: boolean
}

/**
 * This component renders the react-select combobox
 *
 * It relies on the Formik useField hook to work, so it must ALWAYS be rendered
 * inside of a Formik form context.
 */

export const ProgramSelect = ({
    name,
    statePrograms,
    programIDs,
    ...selectProps
}: ProgramSelectPropType & Props<ProgramOptionType, true>) => {
    const [_field, _meta, helpers] = useField({ name })
    const programOptions: ProgramOptionType[] = statePrograms.map((program) => {
        return { value: program.id, label: program.name }
    })

    const onFocus: AriaOnFocus<ProgramOptionType> = ({
        focused,
        isDisabled,
    }): string => {
        return `You are currently focused on option ${focused.label}${
            isDisabled ? ', disabled' : ''
        }`
    }

    return (
        <Select
            defaultValue={programIDs.map((programID) => {
                const program = statePrograms.find((p) => p.id === programID)
                if (!program) {
                    return {
                        value: programID,
                        label: 'Unknown Program',
                    }
                }
                return {
                    value: program.id,
                    label: program.name,
                }
            })}
            className={styles.multiSelect}
            classNamePrefix="select"
            id={`${name}-programSelect`}
            name={name}
            options={programOptions}
            isMulti
            ariaLiveMessages={{
                onFocus,
            }}
            onChange={(selectedOptions) =>
                helpers.setValue(
                    selectedOptions.map((item: { value: string }) => item.value)
                )
            }
            {...selectProps}
        />
    )
}
