import React, { useEffect, useState } from 'react'
import { GridContainer } from '@trussworks/react-uswds'
import { useParams } from 'react-router-dom'
import { packageName } from '../../common-code/healthPlanFormDataType'
import { makeDateTableFromFormData } from '../../documentHelpers/makeDocumentDateLookupTable'
import { Loading } from '../../components/Loading'
import {
    ContactsSummarySection,
    ContractDetailsSummarySection,
    RateDetailsSummarySection,
    SubmissionTypeSummarySection,
    SupportingDocumentsSummarySection,
} from '../../components/SubmissionSummarySection'
import { usePage } from '../../contexts/PageContext'
import { GenericErrorPage } from '../Errors/GenericErrorPage'
import { Error404 } from '../Errors/Error404Page'
import { dayjs } from '../../common-code/dateHelpers'
import styles from './SubmissionRevisionSummary.module.scss'
import { PreviousSubmissionBanner } from '../../components'
import { recordJSException } from '../../otelHelpers/tracingHelper'
import { useFetchHealthPlanPackageWrapper } from '../../gqlHelpers'

export const SubmissionRevisionSummary = (): React.ReactElement => {
    // Page level state
    const { id, revisionVersion } = useParams<{
        id: string
        revisionVersion: string
    }>()
    if (!id) {
        throw new Error(
            'PROGRAMMING ERROR: id param not set in state submission form.'
        )
    }
    const { updateHeading } = usePage()
    const [pkgName, setPkgName] = useState<string | undefined>(undefined)

    const fetchResult = useFetchHealthPlanPackageWrapper(id)

    useEffect(() => {
        updateHeading({ customHeading: pkgName })
    }, [pkgName, updateHeading])

    if (fetchResult.status === 'LOADING') {
        return (
            <GridContainer>
                <Loading />
            </GridContainer>
        )
    }

    if (fetchResult.status === 'ERROR') {
        // Log something about the error?
        recordJSException(fetchResult.error)
        console.error('Error from API fetch', fetchResult.error)
        return <GenericErrorPage /> // api failure or protobuf decode failure
    }

    const pkg = fetchResult.data.fetchHealthPlanPackage.pkg

    // fetchHPP returns null if no package is found with the given ID
    if (!pkg) {
        return <Error404 />
    }

    //We offset version by +1 of index, remove offset to find revision in revisions
    const revisionIndex = Number(revisionVersion) - 1
    //Reversing revisions to get correct submission order
    const revision = [...pkg.revisions].reverse()[revisionIndex].node

    if (!revision) {
        console.info('no revision found at index', revisionIndex)
        return <Error404 />
    }
    const packageData = revision.formData

    const statePrograms = pkg.state.programs
    const name = packageName(packageData, statePrograms)
    if (pkgName !== name) {
        setPkgName(name)
    }

    // Generate the document date table
    // revisions are correctly ordered so we can map into the form data
    const formDatasInOrder = pkg.revisions.map((rEdge) => {
        return rEdge.node.formData
    })
    const documentDates = makeDateTableFromFormData(formDatasInOrder)

    const submitInfo = revision.submitInfo || undefined

    const isContractActionAndRateCertification =
        packageData.submissionType === 'CONTRACT_AND_RATES'

    return (
        <div className={styles.background}>
            <GridContainer
                data-testid="submission-summary"
                className={styles.container}
            >
                <PreviousSubmissionBanner link={`/submissions/${id}`} />

                <SubmissionTypeSummarySection
                    submission={packageData}
                    statePrograms={statePrograms}
                    submissionName={packageName(packageData, statePrograms)}
                    headerChildComponent={
                        submitInfo && (
                            <p
                                className={styles.submissionVersion}
                                data-testid="revision-version"
                            >
                                {`${dayjs
                                    .utc(submitInfo?.updatedAt)
                                    .tz('America/New_York')
                                    .format('MM/DD/YY h:mma')} ET version`}
                            </p>
                        )
                    }
                />

                <ContractDetailsSummarySection
                    submission={packageData}
                    documentDateLookupTable={documentDates}
                    submissionName={packageName(packageData, statePrograms)}
                />

                {isContractActionAndRateCertification && (
                    <RateDetailsSummarySection
                        submission={packageData}
                        documentDateLookupTable={documentDates}
                        submissionName={packageName(packageData, statePrograms)}
                        statePrograms={statePrograms}
                    />
                )}

                <ContactsSummarySection submission={packageData} />

                <SupportingDocumentsSummarySection submission={packageData} />
            </GridContainer>
        </div>
    )
}

export type SectionHeaderProps = {
    header: string
    submissionName?: boolean
    href: string
}
