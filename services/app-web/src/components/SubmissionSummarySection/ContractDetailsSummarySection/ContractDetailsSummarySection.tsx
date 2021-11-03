import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import styles from '../SubmissionSummarySection.module.scss'
import { Document } from '../../../gen/gqlClient'
import {
    AmendableItemsRecord,
    ContractTypeRecord,
    FederalAuthorityRecord,
    RateChangeReasonRecord,
    ManagedCareEntityRecord,
} from '../../../constants/submissions'
import { SectionHeader } from '../../../components/SectionHeader'
import { Link } from '@trussworks/react-uswds'
import { DataDetail } from '../../../components/DataDetail'
import { DoubleColumnRow } from '../../../components/DoubleColumnRow'
import { DraftSubmission, StateSubmission } from '../../../gen/gqlClient'
import { useS3 } from '../../../contexts/S3Context'

type DocumentWithLink = { url: string | null } & Document

export type ContractDetailsSummarySectionProps = {
    submission: DraftSubmission | StateSubmission
    navigateTo?: string
}

const createCheckboxList = ({
    list,
    dict,
    otherReasons = [],
}: {
    list: string[] // Checkbox field array
    dict: Record<string, string> // A lang constant dictionary like ManagedCareEntityRecord or FederalAuthorityRecord,
    otherReasons?: (string | null)[] // additional "Other" text values
}) => {
    const userFriendlyList = list.map((item) => {
        return dict[item] ? dict[item] : null
    })

    const listToDisplay = otherReasons
        ? userFriendlyList.concat(otherReasons)
        : userFriendlyList

    return (
        <ul>
            {listToDisplay.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    )
}

export const ContractDetailsSummarySection = ({
    submission,
    navigateTo,
}: ContractDetailsSummarySectionProps): React.ReactElement => {
    const { getURL, getKey } = useS3()
    useEffect(() => {
        const refreshDocuments = async () => {
            const newContractDocs = await Promise.all(
                submission.contractDocuments.map(async (doc) => {
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
            setRefreshedDocs(newContractDocs)
        }

        void refreshDocuments()
    }, [submission, getKey, getURL])

    const [refreshedDocs, setRefreshedDocs] = useState<DocumentWithLink[]>([])

    // Array of values from a checkbox field is displayed in an unordered list

    const capitationRateChangeReason = (): string | null => {
        const { reason, otherReason } =
            submission?.contractAmendmentInfo?.capitationRatesAmendedInfo || {}
        if (!reason) return null

        return otherReason
            ? `${AmendableItemsRecord['CAPITATION_RATES']} (${otherReason})`
            : `${AmendableItemsRecord['CAPITATION_RATES']} (${RateChangeReasonRecord[reason]})`
    }

    // Capture the "other" fields in Items being amended
    // Including Capitation rates (Other) and Other
    // to pass through to multi checkbox list
    const itemsAmendedOtherList = []

    if (
        submission?.contractAmendmentInfo?.itemsBeingAmended.includes(
            'CAPITATION_RATES'
        ) &&
        capitationRateChangeReason() !== null
    ) {
        itemsAmendedOtherList.push(capitationRateChangeReason())
    }

    if (submission.contractAmendmentInfo?.otherItemBeingAmended) {
        const amendedOtherReason = `Other (${submission.contractAmendmentInfo?.otherItemBeingAmended})`
        itemsAmendedOtherList.push(amendedOtherReason)
    }

    return (
        <section id="contractDetailsSection" className={styles.summarySection}>
            <SectionHeader header="Contract details" navigateTo={navigateTo} />
            <dl>
                <DoubleColumnRow
                    left={
                        <DataDetail
                            id="contractType"
                            label="Contract action type"
                            data={
                                submission.contractType
                                    ? ContractTypeRecord[
                                          submission.contractType
                                      ]
                                    : ''
                            }
                        />
                    }
                    right={
                        <DataDetail
                            id="contractEffectiveDates"
                            label="Contract effective dates"
                            data={`${dayjs(submission.contractDateStart).format(
                                'MM/DD/YYYY'
                            )} - ${dayjs(submission.contractDateEnd).format(
                                'MM/DD/YYYY'
                            )}`}
                        />
                    }
                />
                <DoubleColumnRow
                    left={
                        <DataDetail
                            id="managedCareEntities"
                            label="Managed care entities"
                            data={createCheckboxList({
                                list: submission.managedCareEntities,
                                dict: ManagedCareEntityRecord,
                            })}
                        />
                    }
                    right={
                        <DataDetail
                            id="federalAuthorities"
                            label="Federal authority your program operates under"
                            data={createCheckboxList({
                                list: submission.federalAuthorities,
                                dict: FederalAuthorityRecord,
                            })}
                        />
                    }
                />
                {submission.contractType === 'AMENDMENT' &&
                    submission.contractAmendmentInfo && (
                        <>
                            <DoubleColumnRow
                                left={
                                    <DataDetail
                                        id="itemsAmended"
                                        label="Items being amended"
                                        data={createCheckboxList({
                                            list: submission.contractAmendmentInfo.itemsBeingAmended.filter(
                                                (item) =>
                                                    item !==
                                                        'CAPITATION_RATES' &&
                                                    item !== 'OTHER'
                                            ),
                                            dict: AmendableItemsRecord,
                                            otherReasons: itemsAmendedOtherList,
                                        })}
                                    />
                                }
                                right={
                                    <DataDetail
                                        id="covidRelated"
                                        label="Is this contract action related to the COVID-19 public health emergency"
                                        data={
                                            submission.contractAmendmentInfo
                                                .relatedToCovid19
                                                ? 'Yes'
                                                : 'No'
                                        }
                                    />
                                }
                            />
                            {submission.contractAmendmentInfo
                                .relatedToCovid19 && (
                                <DoubleColumnRow
                                    left={
                                        <DataDetail
                                            id="vaccineRelated"
                                            label="Is this related to coverage and reimbursement for vaccine administration?"
                                            data={
                                                submission.contractAmendmentInfo
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
            <ul>
                <span className="text-bold">Contract</span>
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
    )
}
