import React, { useEffect, useState } from 'react'
import {
    Button,
    ButtonGroup,
    GridContainer,
    Grid,
    Link,
    Alert,
} from '@trussworks/react-uswds'
import { NavLink, useHistory } from 'react-router-dom'
import dayjs from 'dayjs'

import styles from './ReviewSubmit.module.scss'
import stylesForm from '../StateSubmissionForm.module.scss'

import {
    DraftSubmission,
    Document,
    useSubmitDraftSubmissionMutation,
} from '../../../gen/gqlClient'
import {
    AmendableItemsRecord,
    ContractTypeRecord,
    FederalAuthorityRecord,
    RateChangeReasonRecord,
    ManagedCareEntityRecord,
    SubmissionTypeRecord,
} from '../../../constants/submissions'
import PageHeading from '../../../components/PageHeading'
import { DataDetail } from '../../../components/DataDetail/DataDetail'
import { DoubleColumnRow } from '../../../components/DoubleColumnRow/DoubleColumnRow'
import { useS3 } from '../../../contexts/S3Context'

type DocumentWithLink = { url: string | null } & Document
export const ReviewSubmit = ({
    draftSubmission,
}: {
    draftSubmission: DraftSubmission
}): React.ReactElement => {
    const [refreshedDocs, setRefreshedDocs] = useState<DocumentWithLink[]>([])
    const { getURL, getKey } = useS3()

    const [userVisibleError, setUserVisibleError] = useState<
        string | undefined
    >(undefined)
    const history = useHistory()
    const [submitDraftSubmission] = useSubmitDraftSubmissionMutation({
        // An alternative to messing with the cache, just force refetch this query along with this one
        refetchQueries: ['indexSubmissions'],
    })

    useEffect(() => {
        const refreshDocuments = async () => {
            const newDocs = await Promise.all(
                draftSubmission.documents.map(async (doc) => {
                    const key = getKey(doc.s3URL)
                    if (!key)
                        return {
                            ...doc,
                            url: null,
                        }

                    const documentLink = await getURL(key)
                    return {
                        ...doc,
                        url: documentLink,
                    }
                })
            ).catch((err) => {
                console.log(err)
                return []
            })
            setRefreshedDocs(newDocs)
        }

        void refreshDocuments()
    }, [draftSubmission.documents, getKey, getURL])

    const SectionHeader = ({
        header,
        to,
    }: {
        header: string
        to: string
    }): React.ReactElement => {
        return (
            <div className={styles.reviewSectionHeader}>
                <h2>{header}</h2>
                <div>
                    <Link
                        variant="unstyled"
                        asCustom={NavLink}
                        className="usa-button usa-button--outline"
                        to={to}
                    >
                        Edit <span className="srOnly">{header}</span>
                    </Link>
                </div>
            </div>
        )
    }
    const documentsSummary = `${draftSubmission.documents.length} ${
        draftSubmission.documents.length === 1 ? 'file' : 'files'
    }`

    const showError = (error: string) => {
        setUserVisibleError(error)
    }

    const handleFormSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()

        try {
            const data = await submitDraftSubmission({
                variables: {
                    input: {
                        submissionID: draftSubmission.id,
                    },
                },
            })

            console.log("Got data: ", data)

            if (data.errors) {
                console.log(data.errors)
                showError('Error attempting to submit. Please try again.')
            }

            if (data.data?.submitDraftSubmission) {
                history.push(`/dashboard?justSubmitted=${draftSubmission.name}`)
            }
        } catch (error) {
            console.log(error)
            showError('Error attempting to submit. Please try again.')
        }
    }
    // Array of values from a checkbox field is displayed in a comma-separated list
    const createCheckboxList = ({
        list,
        dict,
        otherReasons,
    }: {
        list: string[] // Checkbox field array
        dict: Record<string, string> // A lang constant dictionary like ManagedCareEntityRecord or FederalAuthorityRecord,
        otherReasons?: (string | null)[] // additional "Other" text values
    }) => {
        const userFriendlyList = list
            .map((item) => {
                return dict[item] ?? dict[item]
            })
            .filter((el) => el !== null)
            .join(', ')
            .replace(/,\s*$/, '')

        return otherReasons
            ? `${userFriendlyList}, ${otherReasons
                  .filter((el) => el !== null)
                  .join(', ')
                  .replace(/,\s*$/, '')}`
            : userFriendlyList
    }

    const isContractAmendment = draftSubmission.contractType === 'AMENDMENT'

    const capitationRateChangeReason = (): string | null => {
        const capRates =
            draftSubmission?.contractAmendmentInfo?.capitationRatesAmendedInfo
        const changeReason = capRates?.reason
        if (!capRates) return null

        return capRates.otherReason
            ? `Other - ${capRates.otherReason}`
            : changeReason
            ? RateChangeReasonRecord[changeReason]
            : null
    }

    return (
        <GridContainer className={styles.reviewSectionWrapper}>
            {userVisibleError && (
                <Alert type="error" heading="Submission Error">
                    {userVisibleError}
                </Alert>
            )}
            <PageHeading className={stylesForm.formHeader} headingLevel="h2">
                Review and Submit
            </PageHeading>
            <section id="submissionType" className={styles.reviewSection}>
                <div className={styles.reviewSectionHeader}>
                    <h2 className={styles.submissionName}>
                        {draftSubmission.name}
                    </h2>
                    <div>
                        <Link
                            asCustom={NavLink}
                            to="type"
                            className="usa-button usa-button--outline"
                            variant="unstyled"
                        >
                            Edit
                            <span className="srOnly">Submission type</span>
                        </Link>
                    </div>
                </div>
                <dl>
                    <DoubleColumnRow
                        left={
                            <DataDetail
                                id="program"
                                label="Program"
                                data={draftSubmission.program.name}
                            />
                        }
                        right={
                            <DataDetail
                                id="submissionType"
                                label="Submission type"
                                data={
                                    SubmissionTypeRecord[
                                        draftSubmission.submissionType
                                    ]
                                }
                            />
                        }
                    />
                    <Grid row gap className={styles.reviewDataRow}>
                        <Grid col={12}>
                            <DataDetail
                                id="submissionDescription"
                                label="Submission description"
                                data={draftSubmission.submissionDescription}
                            />
                        </Grid>
                    </Grid>
                </dl>
            </section>
            <section id="contractDetails" className={styles.reviewSection}>
                <SectionHeader
                    header="Contract details"
                    to="contract-details"
                />
                <dl>
                    <DoubleColumnRow
                        left={
                            <DataDetail
                                id="contractType"
                                label="Contract action type"
                                data={
                                    draftSubmission.contractType
                                        ? ContractTypeRecord[
                                              draftSubmission.contractType
                                          ]
                                        : ''
                                }
                            />
                        }
                        right={
                            <DataDetail
                                id="contractEffectiveDates"
                                label="Contract effective dates"
                                data={`${dayjs(
                                    draftSubmission.contractDateStart
                                ).format('MM/DD/YYYY')} - ${dayjs(
                                    draftSubmission.contractDateEnd
                                ).format('MM/DD/YYYY')}`}
                            />
                        }
                    />
                    <DoubleColumnRow
                        left={
                            <DataDetail
                                id="managedCareEntities"
                                label="Managed care entities"
                                data={createCheckboxList({
                                    list: draftSubmission.managedCareEntities,
                                    dict: ManagedCareEntityRecord,
                                })}
                            />
                        }
                        right={
                            <DataDetail
                                id="federalAuthorities"
                                label="Federal authority your program operates under"
                                data={createCheckboxList({
                                    list: draftSubmission.federalAuthorities,
                                    dict: FederalAuthorityRecord,
                                })}
                            />
                        }
                    />
                    {isContractAmendment &&
                        draftSubmission.contractAmendmentInfo && (
                            <>
                                <DoubleColumnRow
                                    left={
                                        <DataDetail
                                            id="itemsAmended"
                                            label="Items being amended"
                                            data={createCheckboxList({
                                                list:
                                                    draftSubmission
                                                        .contractAmendmentInfo
                                                        .itemsBeingAmended,
                                                dict: AmendableItemsRecord,
                                                otherReasons: [
                                                    capitationRateChangeReason(),
                                                    draftSubmission
                                                        .contractAmendmentInfo
                                                        ?.otherItemBeingAmended
                                                        ? `Other - ${draftSubmission.contractAmendmentInfo?.otherItemBeingAmended}`
                                                        : null,
                                                ],
                                            })}
                                        />
                                    }
                                    right={
                                        <DataDetail
                                            id="covidRelated"
                                            label="Is this contract action related to the COVID-19 public health emergency"
                                            data={
                                                draftSubmission
                                                    .contractAmendmentInfo
                                                    .relatedToCovid19
                                                    ? 'Yes'
                                                    : 'No'
                                            }
                                        />
                                    }
                                />
                                {draftSubmission.contractAmendmentInfo
                                    .relatedToCovid19 && (
                                    <DoubleColumnRow
                                        left={
                                            <DataDetail
                                                id="vaccineRelated"
                                                label="Is this related to coverage and reimbursement for vaccine administration?"
                                                data={
                                                    draftSubmission
                                                        .contractAmendmentInfo
                                                        .relatedToVaccination
                                                        ? 'Yes'
                                                        : 'No'
                                                }
                                            />
                                        }
                                    />
                                )}
                            </>
                        )}
                </dl>
            </section>
            <section id="rateDetails" className={styles.reviewSection}>
                <dl>
                    <SectionHeader header="Rate details" to="rate-details" />
                    <DoubleColumnRow
                        left={
                            <DataDetail
                                id="rateType"
                                label="Rate certification type"
                                data={
                                    draftSubmission.rateAmendmentInfo
                                        ? 'Amendment to prior rate certification'
                                        : 'New rate certification'
                                }
                            />
                        }
                        right={
                            <DataDetail
                                id="ratingPeriod"
                                label={
                                    draftSubmission.rateAmendmentInfo
                                        ? 'Rating period of original rate certification'
                                        : 'Rating period'
                                }
                                data={`${dayjs(
                                    draftSubmission.rateDateStart
                                ).format('MM/DD/YYYY')} - ${dayjs(
                                    draftSubmission.rateDateEnd
                                ).format('MM/DD/YYYY')}`}
                            />
                        }
                    />
                    <DoubleColumnRow
                        left={
                            <DataDetail
                                id="dateCertified"
                                label={
                                    draftSubmission.rateAmendmentInfo
                                        ? 'Date certified for rate amendment'
                                        : 'Date certified'
                                }
                                data={dayjs(
                                    draftSubmission.rateDateCertified
                                ).format('MM/DD/YYYY')}
                            />
                        }
                        right={
                            draftSubmission.rateAmendmentInfo ? (
                                <DataDetail
                                    id="effectiveRatingPeriod"
                                    label="Effective dates of rate amendment"
                                    data={`${dayjs(
                                        draftSubmission.rateAmendmentInfo
                                            .effectiveDateStart
                                    ).format('MM/DD/YYYY')} - ${dayjs(
                                        draftSubmission.rateAmendmentInfo
                                            .effectiveDateEnd
                                    ).format('MM/DD/YYYY')}`}
                                />
                            ) : null
                        }
                    />
                </dl>
            </section>
            <section id="documents" className={styles.reviewSection}>
                <SectionHeader header="Documents" to="documents" />
                <span className="text-bold">{documentsSummary}</span>
                <ul>
                    {refreshedDocs.map((doc) => (
                        <li key={doc.name}>
                            {doc.url ? (
                                <Link
                                    aria-label={`${doc.name} (opens in new window)`}
                                    href={doc.url}
                                    variant="external"
                                    target="_blank"
                                >
                                    {doc.name}
                                </Link>
                            ) : (
                                <span>{doc.name}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            <div className={stylesForm.pageActions}>
                <Link
                    asCustom={NavLink}
                    className="usa-button usa-button--unstyled"
                    variant="unstyled"
                    to="/dashboard"
                >
                    Save as Draft
                </Link>
                <ButtonGroup type="default" className={stylesForm.buttonGroup}>
                    <Link
                        asCustom={NavLink}
                        className="usa-button usa-button--outline"
                        variant="unstyled"
                        to="documents"
                    >
                        Back
                    </Link>
                    <Button
                        type="button"
                        className={styles.submitButton}
                        onClick={handleFormSubmit}
                    >
                        Submit
                    </Button>
                </ButtonGroup>
            </div>
        </GridContainer>
    )
}

export type SectionHeaderProps = {
    header: string
    submissionName?: boolean
    href: string
}
