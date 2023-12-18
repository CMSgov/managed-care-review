/**
 * Source of truth for feature flags in application.
 * Ensures some type safety around flag names when we're enabling/disabling features in our code.
 *
 * This file also used to generate types for our Jest unit tests, Cypress tests, and for Yup validation logic.
 */

const featureFlags = {
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
     The number of minutes before the session expires and countdown modal appears
    */
    MINUTES_UNTIL_SESSION_EXPIRES: {
        flag: 'session-expiration-minutes',
        defaultValue: 30,
    },
    /**
     * Enables state and CMS Q&A features
     */
    CMS_QUESTIONS: {
        flag: 'cms-questions',
        defaultValue: false,
    },
    CONTRACT_438_ATTESTATION: {
        flag: '438-attestation',
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

/**
 * Feature flags constants used in application. Uppercased and snake_cased
 */
const featureFlagKeys = Object.keys(featureFlags).map(
    (flag): keyof typeof featureFlags => flag as FlagKey
)

/**
 * Feature flag constants used in Launch Darkly. Lowercased and kebab-cased
 */
type FeatureFlagLDConstant =
    (typeof featureFlags)[keyof typeof featureFlags]['flag']

type FlagKey = keyof typeof featureFlags
type FlagValue = boolean | string | number | object | [] // this is  an approximate mapping to available LD flag value types

type FeatureFlagSettings = Partial<Record<FeatureFlagLDConstant, FlagValue>>

export type { FlagKey, FlagValue, FeatureFlagLDConstant, FeatureFlagSettings }

export { featureFlagKeys, featureFlags }
