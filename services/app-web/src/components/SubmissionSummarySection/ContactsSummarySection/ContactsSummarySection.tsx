import { Grid, GridContainer, Link } from '@trussworks/react-uswds'
import styles from '../SubmissionSummarySection.module.scss'
import { SectionHeader } from '../../SectionHeader'
import {
    ActuaryFirmsRecord,
    ActuaryCommunicationRecord,
} from '../../../constants/healthPlanPackages'
import { HealthPlanFormDataType } from '../../../common-code/healthPlanFormDataType'
import { ActuaryContact } from '../../../common-code/healthPlanFormDataType'
import { DataDetailMissingField } from '../../DataDetail/DataDetailMissingField'
import { DataDetail } from '../../DataDetail'

export type ContactsSummarySectionProps = {
    submission: HealthPlanFormDataType
    navigateTo?: string
}

export const getActuaryFirm = (actuaryContact: ActuaryContact): string => {
    if (
        actuaryContact.actuarialFirmOther &&
        actuaryContact.actuarialFirm === 'OTHER'
    ) {
        return actuaryContact.actuarialFirmOther
    } else if (
        actuaryContact.actuarialFirm &&
        ActuaryFirmsRecord[actuaryContact.actuarialFirm]
    ) {
        return ActuaryFirmsRecord[actuaryContact.actuarialFirm]
    } else {
        return ''
    }
}

export const ContactsSummarySection = ({
    submission,
    navigateTo,
}: ContactsSummarySectionProps): React.ReactElement => {
    const isSubmitted = submission.status === 'SUBMITTED'

    return (
        <section id="stateContacts" className={styles.summarySection}>
            <dl>
                <SectionHeader
                    header="State contacts"
                    navigateTo={navigateTo}
                />

                <GridContainer>
                    <Grid row>
                        {submission.stateContacts.length > 0 ? (
                            submission.stateContacts.map(
                                (stateContact, index) => (
                                    <Grid col={6} key={'statecontact_' + index}>
                                        <span className="text-bold">
                                            Contact {index + 1}
                                        </span>
                                        <br />
                                        <address>
                                            {stateContact.name}
                                            <br />
                                            {stateContact.titleRole}
                                            <br />
                                            <Link
                                                href={`mailto:${stateContact.email}`}
                                                target="_blank"
                                                variant="external"
                                                rel="noreferrer"
                                            >
                                                {stateContact.email}
                                            </Link>
                                            <br />
                                        </address>
                                    </Grid>
                                )
                            )
                        ) : (
                            <DataDetailMissingField />
                        )}
                    </Grid>
                </GridContainer>
            </dl>

            {submission.submissionType === 'CONTRACT_AND_RATES' &&
                submission.addtlActuaryContacts && (
                    <>
                        <dl>
                            <SectionHeader header="Additional actuary contacts" />
                            <GridContainer>
                                <Grid row>
                                    {submission.addtlActuaryContacts.map(
                                        (actuaryContact, index) => (
                                            <Grid
                                                col={6}
                                                key={'actuarycontact_' + index}
                                            >
                                                <span className="text-bold">
                                                    Additional actuary contact
                                                </span>
                                                <br />
                                                <address>
                                                    {actuaryContact.name}
                                                    <br />
                                                    {actuaryContact.titleRole}
                                                    <br />
                                                    <Link
                                                        href={`mailto:${actuaryContact.email}`}
                                                        target="_blank"
                                                        variant="external"
                                                        rel="noreferrer"
                                                    >
                                                        {actuaryContact.email}
                                                    </Link>
                                                    <br />
                                                    {getActuaryFirm(
                                                        actuaryContact
                                                    )}
                                                </address>
                                            </Grid>
                                        )
                                    )}
                                </Grid>
                            </GridContainer>
                        </dl>
                        <dl>
                            <GridContainer>
                                <DataDetail
                                    id="communicationPreference"
                                    label="Actuaries’ communication preference"
                                    data={
                                        submission.addtlActuaryCommunicationPreference &&
                                        ActuaryCommunicationRecord[
                                            submission
                                                .addtlActuaryCommunicationPreference
                                        ]
                                    }
                                    explainMissingData={!isSubmitted}
                                />
                            </GridContainer>
                        </dl>
                    </>
                )}
        </section>
    )
}
