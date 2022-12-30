/*
    This file contains lang constants related to user facing error messages across the application. 
    - Use caution editing this file, you could be changing content used across multiple pages
*/
const ERROR_MESSAGES = {
    generic_error: "We're having trouble loading this page.",
    submit_error_heading: 'Submission error',
    submit_error_suggestion:
        'Please provide the required information before submitting.',
    submit_error_generic: 'Error attempting to submit.',
    submit_missing_field: 'Your submission is missing information.',
    unlock_error_heading: 'Unlock error',
    unlock_error_generic: 'Error attempting to unlock.',
    unlock_invalid_package_status:
        'Error attempting to unlock. Submission may be already unlocked.',
    resubmit_error_heading: 'Resubmission error',
}

const MAIL_TO_SUPPORT =
    'mailto: mc-review@cms.hhs.gov, mc-review-team@truss.works'

export { MAIL_TO_SUPPORT, ERROR_MESSAGES }
