import React from 'react'
import Select, { AriaOnFocus, Props } from 'react-select'
import styles from '../../components/Select/Select.module.scss'
import { StateUser, useIndexRatesQuery } from '../../gen/gqlClient'
import { useField } from 'formik'
import { useAuth } from '../../contexts/AuthContext'
import { programNames } from '../../common-code/healthPlanFormDataType'
import { formatCalendarDate } from '../../common-code/dateHelpers'

export interface LinkRateOptionType {
    readonly value: string
    readonly label: React.ReactElement
    readonly isFixed?: boolean
    readonly isDisabled?: boolean
}

export type LinkRateSelectPropType = {
    name: string
    initialValues: string[]
}

export const LinkRateSelect = ({
    name,
    initialValues,
    ...selectProps
}: LinkRateSelectPropType & Props<LinkRateOptionType, true>) => {
    const [_field, _meta, helpers] = useField({ name })
    const { data, loading, error } = useIndexRatesQuery()
    const { loggedInUser } = useAuth()
    const user = loggedInUser as StateUser
    const statePrograms = user.state.programs

    const rateNames = data?.indexRates.edges
        .map((edge) => {
            const revision = edge.node.revisions[0]
            return {
                value: revision.id,
                label: (
                    <>
                        <strong>
                            {revision.formData.rateCertificationName}
                        </strong>
                        <div style={{ lineHeight: '50%', fontSize: '14px' }}>
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
                                -
                                {formatCalendarDate(
                                    revision.formData.rateDateEnd
                                )}
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
        .reverse()

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

    //Need this to make the label searchable since it's buried in a react element
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterOptions = ({ label }: any, input: string) =>
        label.props.children[0].props.children
            ?.toLowerCase()
            .includes(input.toLowerCase())

    return (
        <>
            <Select
                defaultMenuIsOpen
                value={defaultValues}
                className={styles.multiSelect}
                options={error || loading ? undefined : rateNames}
                isSearchable
                isMulti
                maxMenuHeight={405}
                aria-label="linked rates (required)"
                ariaLiveMessages={{
                    onFocus,
                }}
                noOptionsMessage={() => noOptionsMessage()}
                classNamePrefix="select"
                id={`${name}-linkRateSelect`}
                inputId=""
                placeholder={
                    loading ? 'Loading rate certifications...' : 'Select...'
                }
                loadingMessage={() => 'Loading rate certifications...'}
                name={name}
                onChange={(selectedOptions) =>
                    helpers.setValue(
                        selectedOptions.map(
                            (item: { value: string }) => item.value
                        )
                    )
                }
                filterOption={filterOptions}
                {...selectProps}
            />
        </>
    )
}
