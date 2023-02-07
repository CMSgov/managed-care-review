import { User } from '../gen/gqlClient'
import {
    PageTitlesRecord,
    RouteT,
    STATE_SUBMISSION_FORM_ROUTES,
    STATE_SUBMISSION_SUMMARY_ROUTES,
} from './routes'

// TYPES
type TealiumDataObject = {
    content_language: string
    content_type: string
    page_name: string
    page_path: string
    site_domain: 'cms.gov'
    site_environment: string
    site_section: string
    logged_in: 'true' | 'false'
    userId?: string // custom attribute
    packageId?: string // custom attribute
    tealium_event?: TealiumEvent // this is required by tealium, TBD what allowed values aer here, usually this is supposed to be configured first .
}

type TealiumLinkDataObject = {
    tealium_event: TealiumEvent // event is required for user tracking links
} & Partial<TealiumDataObject>

type TealiumViewDataObject = TealiumDataObject // event default to page_view in useTealium hook

// CONSTANTS
const CONTENT_TYPE_BY_ROUTE: Record<RouteT | 'UNKNOWN_ROUTE', string> = {
    ROOT: 'root',
    AUTH: 'login',
    DASHBOARD: 'table',
    HELP: 'glossary',
    REPORTS: 'table',
    SUBMISSIONS: 'form',
    SUBMISSIONS_NEW: 'form',
    SUBMISSIONS_FORM: 'form',
    SUBMISSIONS_TYPE: 'form',
    SUBMISSIONS_CONTRACT_DETAILS: 'form',
    SUBMISSIONS_RATE_DETAILS: 'form',
    SUBMISSIONS_CONTACTS: 'form',
    SUBMISSIONS_DOCUMENTS: 'form',
    SUBMISSIONS_REVIEW_SUBMIT: 'form',
    SUBMISSIONS_SUMMARY: 'summary',
    SUBMISSIONS_REVISION: 'summary',
    SUBMISSIONS_QUESTIONS_AND_ANSWERS: 'summary',
    SUBMISSIONS_UPLOAD_QUESTION: 'form',
    UNKNOWN_ROUTE: '404',
}

type TealiumEvent =
    | 'search'
    | 'submission_view'
    | 'user_login'
    | 'user_logout'
    | 'save_draft'

// HELPER FUNCTIONS
function getTealiumEnv(stage: string) {
    switch (stage) {
        case 'prod':
            return 'prod'
        case 'val':
            return 'qa'
        case 'main':
            return 'dev'
        default:
            return 'dev'
    }
}

const getTealiumPageName = ({
    route,
    heading,
    user,
}: {
    route: RouteT | 'UNKNOWN_ROUTE'
    heading: string | undefined
    user: User | undefined
}) => {
    const addSubmissionNameHeading =
        STATE_SUBMISSION_FORM_ROUTES.includes(route) ||
        STATE_SUBMISSION_SUMMARY_ROUTES.includes(route)

    const formatPageName = ({
        heading,
        title,
    }: {
        title: string
        heading?: string
    }) => {
        const headingPrefix =
            heading && addSubmissionNameHeading ? `${heading}: ` : ''
        return `${headingPrefix}${title}`
    }
    switch (route) {
        case 'ROOT':
            if (!user) {
                return formatPageName({ title: 'Landing' })
            } else if (user.__typename === 'CMSUser') {
                return formatPageName({ heading, title: 'CMS Dashboard' })
            } else if (user.__typename === 'StateUser') {
                return formatPageName({
                    heading,
                    title: 'State dashboard',
                })
            }
            return formatPageName({ heading, title: PageTitlesRecord[route] })
        case 'DASHBOARD':
            if (user && user.__typename === 'CMSUser') {
                return formatPageName({ title: 'CMS Dashboard' })
            } else if (user && user.__typename === 'StateUser') {
                return formatPageName({
                    heading,
                    title: 'State dashboard',
                })
            }
            return formatPageName({ heading, title: PageTitlesRecord[route] })

        default:
            return formatPageName({ heading, title: PageTitlesRecord[route] })
    }
}

export { CONTENT_TYPE_BY_ROUTE, getTealiumEnv, getTealiumPageName }
export type { TealiumLinkDataObject, TealiumViewDataObject, TealiumEvent }
