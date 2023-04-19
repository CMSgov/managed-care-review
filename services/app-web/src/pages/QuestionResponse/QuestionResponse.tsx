import React, { useEffect } from 'react'
import { GridContainer, Link } from '@trussworks/react-uswds'
import styles from './QuestionResponse.module.scss'

import { SectionHeader } from '../../components'
import { NavLink, useLocation, useOutletContext } from 'react-router-dom'
import { usePage } from '../../contexts/PageContext'
import { SideNavOutletContextType } from '../SubmissionSideNav/SubmissionSideNav'
import {
    QuestionResponseSubmitBanner,
    UserAccountWarningBanner,
} from '../../components/Banner'
import { QATable, QuestionData, Division } from './QATable/QATable'
import { CmsUser, QuestionEdge, StateUser } from '../../gen/gqlClient'
import { CMSUserType } from 'app-api/src/domain-models'

type divisionQuestionDataType = {
    division: Division
    questions: QuestionData[]
}

const extractQuestions = (edges?: QuestionEdge[]): QuestionData[] => {
    if (!edges) {
        return []
    }
    return edges.map(({ node }) => ({
        ...node,
        addedBy: node.addedBy as CmsUser,
        responses: node.responses.map((response) => ({
            ...response,
            addedBy: response.addedBy as StateUser,
        })),
    }))
}

const getUserDivision = (user: CMSUserType): Division | undefined =>
    user.divisionAssignment

const getDivisionOrder = (division?: Division): Division[] => {
    const order = ['DMCO', 'DMCP', 'OACT'] as Division[]
    if (division) {
        order.splice(order.indexOf(division), 1)
        order.unshift(division)
    }
    return order
}

export const QuestionResponse = () => {
    // router context
    const location = useLocation()
    const submitType = new URLSearchParams(location.search).get('submit')
    const { user, packageName, pkg } =
        useOutletContext<SideNavOutletContextType>()
    let division: Division | undefined = undefined

    // page context
    const { updateHeading } = usePage()
    const isCMSUser = user?.role === 'CMS_USER'

    useEffect(() => {
        updateHeading({ customHeading: packageName })
    }, [packageName, updateHeading])

    if (isCMSUser) {
        division = getUserDivision(user as CMSUserType)
    }

    const divisionOrder = getDivisionOrder(division)
    const questions: divisionQuestionDataType[] = []

    divisionOrder.forEach(
        (division) =>
            pkg.questions?.[`${division}Questions`].totalCount &&
            questions.push({
                division: division,
                questions: extractQuestions(
                    pkg.questions?.[`${division}Questions`].edges
                ),
            })
    )

    const mapQASections = () =>
        questions.map((divisionQuestions) => (
            <section
                key={divisionQuestions.division}
                className={styles.questionSection}
                data-testid={`${divisionQuestions.division.toLowerCase()}-qa-section`}
            >
                <h4>{`Asked by ${divisionQuestions.division}`}</h4>
                {divisionQuestions.questions.map((question, index) => (
                    <QATable
                        key={question.id}
                        question={question}
                        division={divisionQuestions.division}
                        round={divisionQuestions.questions.length - index}
                        user={user}
                    />
                ))}
            </section>
        ))

    return (
        <div className={styles.background}>
            <GridContainer className={styles.container}>
                {isCMSUser && !division && (
                    <UserAccountWarningBanner
                        header={'Missing division'}
                        message={`You must be assigned to a division in order to ask questions about a submission. Contact mc-review@cms.hhs.gov to add your division.`}
                    />
                )}
                {submitType && (
                    <QuestionResponseSubmitBanner submitType={submitType} />
                )}
                <section>
                    <SectionHeader header="Contract questions" hideBorder>
                        {isCMSUser && division && (
                            <Link
                                asCustom={NavLink}
                                className="usa-button"
                                variant="unstyled"
                                to={`./${division.toLowerCase()}/upload-questions`}
                            >
                                Add questions
                            </Link>
                        )}
                    </SectionHeader>
                </section>
                {questions.length ? (
                    mapQASections()
                ) : (
                    <section key={division} className={styles.questionSection}>
                        <div>
                            <p>No questions have been submitted yet</p>
                        </div>
                    </section>
                )}
            </GridContainer>
        </div>
    )
}
