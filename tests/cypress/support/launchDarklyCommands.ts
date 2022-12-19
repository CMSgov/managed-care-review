import '@testing-library/cypress/add-commands'
import {
    featureFlags,
    featureFlagEnums,
    FeatureFlagTypes,
    FlagValueTypes,
} from '../../../services/app-web/src/common-code/featureFlags';

/**
 * The code below was taken from this blog post and modified a bit for our use of Types in feature flags.
 * https://dev.to/muratkeremozcan/effective-test-strategies-for-testing-front-end-applications-using-launchdarkly-feature-flags-and-cypress-part2-testing-2c72#stubbing-a-feature-flag
 */

// Intercepting LD "GET" calls for feature flag values and returns our default flags and values.
Cypress.Commands.add('interceptFeatureFlags', (toggleFlags?: Partial<Record<FeatureFlagTypes, FlagValueTypes>>) => {
    // Create feature flag object with default values and update values of flags passed in toggleFlags argument.
    // defaultFeatureFlags contains all valid feature flags along with default values. toggleFlags is restricted to flag's
    // contained in app-web/src/common-code/featureFlags/flags.ts.
    const featureFlagObject: Partial<Record<FeatureFlagTypes, FlagValueTypes>> = {}
    featureFlagEnums.forEach(flagEnum => {
        let key: FeatureFlagTypes = featureFlags[flagEnum].flag
        let value = toggleFlags && toggleFlags[key] ? toggleFlags[key] : featureFlags[flagEnum].defaultValue
        featureFlagObject[key] = value
    })

    //Writing feature flags and values to store.
    cy.writeFile('tests/cypress/fixtures/stores/featureFlagStore.json', JSON.stringify(featureFlagObject) )

    // Intercepts LD request and returns with our own feature flags and values.
    return cy
        .intercept({ method: 'GET', hostname: /\.*app.launchdarkly.com\/sdk\/evalx/ }, (req) =>
            req.reply(({ body }) =>
                Cypress._.map(featureFlagObject, (ffValue, ffKey) => {
                    body[ffKey] = { value: ffValue };
                    return body;
                })
            )
        )
        .as('LDApp');
})

// Intercepting feature flag api calls and returns some response. This should stop the app from calling making requests to LD.
Cypress.Commands.add('stubFeatureFlags', () => {
    // ignore api calls to events endpoint
    cy.intercept(
        { method: 'POST', hostname: /\.*events.launchdarkly.com/ },
        { body: {} }
    ).as('LDEvents');

    // turn off push updates from LaunchDarkly (EventSource)
    cy.intercept(
        { method: 'GET', hostname: /\.*clientstream.launchdarkly.com/ },
        // access the request handler and stub a response
        (req) =>
            req.reply('data: no streaming feature flag data here\n\n', {
                'content-type': 'text/event-stream; charset=utf-8',
            })
    ).as('LDClientStream');

    ///sdk/evalx
    //app.launchdarkly.com/sdk/goals/6261b53059c624156bacfd88
    cy.intercept({ method: 'OPTIONS', hostname: /\.*app.launchdarkly.com\/sdk\/goals/ }, []).as('LDAppOptionRequest');

    // Intercept feature flag calls and generates default feature flag values in store.
    cy.interceptFeatureFlags()
})

//Command to get feature flag values from the featureFlagStore.json file.
Cypress.Commands.add('getFeatureFlagStore', (featureFlags?: FeatureFlagTypes[]) => {
    cy.readFile('tests/cypress/fixtures/stores/featureFlagStore.json').then((store: Record<FeatureFlagTypes, FlagValueTypes>): Partial<Record<FeatureFlagTypes, FlagValueTypes>> => {
        if (featureFlags && featureFlags.length) {
            const selectedFlags: Partial<Record<FeatureFlagTypes, FlagValueTypes>> = {}
            featureFlags.forEach(flag => {
                selectedFlags[flag] = store[flag]
            })
            return selectedFlags
        }
        return store
    })
})
