/**
 * Contains a list of all our feature flags in Launch Darkly each flag should contain a default value. This is used to
 * give us type safety around flag names when we're enabling/disabling features in our code.
 *
 * This list is also used to generate Types for our Unit and Cypress tests. Our Cypress LD integration heavily relies
 * on this list to help constrain tests to flag's in LD, autocompletion, generate Types and flag state management
 */

export const featureFlags = {
    /**
     Toggles the site maintenance alert on the landing page
    */
    SITE_MAINTENANCE_BANNER: {
        flag: 'site-maintenance-banner',
        defaultValue: false,
    },
    /**
     Toggles the site maintenance alert on the landing page
    */
    SITE_UNDER_MAINTENANCE_BANNER: {
        flag: 'site-under-maintenance-banner',
        defaultValue: 'OFF',
    },
    /**
     Enables the modal that alerts the user to an expiring session
    */
    SESSION_EXPIRING_MODAL: {
        flag: 'session-expiring-modal',
        defaultValue: true,
    },
    /**
     The number of minutes before the session expires
    */
    MINUTES_UNTIL_SESSION_EXPIRES: {
        flag: 'session-expiration-minutes',
        defaultValue: 30,
    },
    /**
     The number of minutes before session expiration that the warning modal appears
    */
    MODAL_COUNTDOWN_DURATION: {
        flag: 'modal-countdown-duration',
        defaultValue: 2,
    },
    /**
     * Enables filter on CMS dashboard
     */
    CMS_DASHBOARD_FILTER: {
        flag: 'cms-dashboard-filter',
        defaultValue: false,
    },
    /**
     * Enables rate cert assurance workflow
     */
    RATE_CERT_ASSURANCE: {
        flag: 'rate-cert-assurance',
        defaultValue: false,
    },
    /**
     * Enables state and CMS Q&A features
     */
    CMS_QUESTIONS: {
        flag: 'cms-questions',
        defaultValue: false,
    },
    /**
     * Enables Chip-only form changes
     */
    CHIP_ONLY_FORM: {
        flag: 'chip-only-form',
        defaultValue: false,
    },
    /**
     * Used in testing to simulate errors in fetching flag value.
     * This flag does not exist in LaunchDarkly dashboard so fetching this will return the defaultValue.
     */
    TEST_ERROR_FETCHING_FLAG: {
        flag: 'test-error-fetching-flag',
        defaultValue: undefined,
    },
} as const

export type FlagEnumType = keyof typeof featureFlags

/**
 * featureFlags object top level property keys in an array. Used for LD integration into Cypress
 */
export const featureFlagEnums: FlagEnumType[] = Object.keys(featureFlags).map(
    (flag): keyof typeof featureFlags => flag as FlagEnumType
)

/**
 * Get a union type of all `flag` values of `featureFlags`. This type will constrain code to only use feature flags defined
 * in the featureFlag object. Mainly used in testing to restrict testing to actual feature flags.
 */
export type FeatureFlagTypes =
    typeof featureFlags[keyof typeof featureFlags]['flag']

/**
 * Flag value types from Launch Darkly and used to restrict feature flag default types as well as values in testing.
 */
export type FlagValueTypes = boolean | string | number | object | []
