import React from 'react'
import Select, { ActionMeta, AriaOnFocus, Props } from 'react-select'
import styles from '../../components/Select/Select.module.scss'
import { StateUser, useIndexRatesQuery } from '../../gen/gqlClient'
import { useAuth } from '../../contexts/AuthContext'
import { programNames } from '../../common-code/healthPlanFormDataType'
import { formatCalendarDate } from '../../common-code/dateHelpers'
import { FormikRateForm } from '../StateSubmission/RateDetails/V2/RateDetailsV2'
import { convertGQLRateToRateForm } from '../StateSubmission/RateDetails/V2/rateDetailsHelpers'
import { useS3 } from '../../contexts/S3Context'

export interface LinkRateOptionType {
    readonly value: string
    readonly label: React.ReactElement
    readonly isFixed?: boolean
    readonly isDisabled?: boolean
}

export type LinkRateSelectPropType = {
    name: string
    initialValues: string[]
    autofill: (rateForm: FormikRateForm) => void // used for multi-rates, when called will FieldArray replace the existing form fields with new data
}

export const LinkRateSelect = ({
    name,
    initialValues,
    autofill,
    ...selectProps
}: LinkRateSelectPropType & Props<LinkRateOptionType, true>) => {
    const { data, loading, error } = useIndexRatesQuery()
    const { getKey } = useS3()
    const { loggedInUser } = useAuth()
    const user = loggedInUser as StateUser
    const statePrograms = user.state.programs

    const rates = data?.indexRates.edges.map((e) => e.node) || []

    const rateNames = rates.map((rate) => {
        const revision = rate.revisions[0]
        return {
            value: revision.id,
            label: (
                <>
                    <h4>{revision.formData.rateCertificationName}</h4>
                    <div style={{ lineHeight: '50%' }}>
                        <p>
                            Programs:&nbsp;
                            {programNames(
                                statePrograms,
                                revision.formData.rateProgramIDs
                            ).join(', ')}
                        </p>
                        <p>
                            Rating period:&nbsp;
                            {formatCalendarDate(
                                revision.formData.rateDateStart
                            )}
                            -{formatCalendarDate(revision.formData.rateDateEnd)}
                        </p>
                        <p>
                            Certification date:&nbsp;
                            {formatCalendarDate(
                                revision.formData.rateDateCertified
                            )}
                        </p>
                    </div>
                </>
            ),
        }
    })

    const onFocus: AriaOnFocus<LinkRateOptionType> = ({
        focused,
        isDisabled,
    }): string => {
        return `You are currently focused on option ${focused.label}${
            isDisabled ? ', disabled' : ''
        }`
    }

    const defaultValues =
        initialValues.length && rateNames?.length
            ? initialValues.map((rateId) => {
                  const rateName = rateNames?.find(
                      (names) => names.value === rateId
                  )?.label.props.children[0].props.children

                  if (!rateName) {
                      return {
                          value: rateId,
                          label: 'Unknown rate',
                      }
                  }

                  return {
                      value: rateId,
                      label: rateName,
                  }
              })
            : []

    const noOptionsMessage = () => {
        if (loading) {
            return 'Loading rate certifications...'
        }
        if (error) {
            return 'Could not load rate certifications. Please refresh your browser.'
        }
        if (!data) {
            return 'No rate certifications found'
        }
    }

    const onInputChange = (
        newValue: LinkRateOptionType,
        { action }: ActionMeta<LinkRateOptionType>
    ) => {
        if (action === 'select-option') {
            const linkedRateID = newValue.value
            // const linkedRateName = newValue.label
            const linkedRate = rates?.find((rate) => rate.id === linkedRateID)
            const linkedRateForm: FormikRateForm = convertGQLRateToRateForm(
                getKey,
                linkedRate
            )
            // put already selected fields back in place
            linkedRateForm.ratePreviouslySubmitted = 'YES'
            linkedRateForm.linkedRates = [
                {
                    rateId: linkedRateID,
                    rateName: 'LOOK_FOR_ME', // linkedRateName,
                },
            ]

            autofill(linkedRateForm)
        } else if (action === 'clear') {
            const emptyRateForm = convertGQLRateToRateForm(getKey)

            // put already selected fields back in place
            emptyRateForm.ratePreviouslySubmitted = 'YES'

            autofill(emptyRateForm)
        }
    }

    return (
        <>
            <Select
                value={defaultValues}
                className={styles.multiSelect}
                options={error || loading ? undefined : rateNames}
                isSearchable
                maxMenuHeight={169}
                aria-label="linked rates (required)"
                ariaLiveMessages={{
                    onFocus,
                }}
                isClearable
                noOptionsMessage={() => noOptionsMessage()}
                classNamePrefix="select"
                id={`${name}-linkRateSelect`}
                inputId=""
                placeholder={
                    loading ? 'Loading rate certifications...' : 'Select...'
                }
                loadingMessage={() => 'Loading rate certifications...'}
                name={name}
                {...selectProps}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={onInputChange as any} // TODO see why the types definitions are messed up for react-select "single" (not multi) onChange - may need to upgrade dep if this bug was fixed
            />
        </>
    )
}
