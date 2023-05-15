import { LDService } from '../launchDarkly/launchDarkly'
import {
    FeatureFlagLDConstant,
    FeatureFlagSettings,
} from '@managed-care-review/common-code/featureFlags'

import { defaultFeatureFlags } from '../launchDarkly/launchDarkly'

function testLDService(mockFeatureFlags?: FeatureFlagSettings): LDService {
    const featureFlags = defaultFeatureFlags

    //Update featureFlags with mock flag values.
    if (mockFeatureFlags) {
        for (const flag in mockFeatureFlags) {
            const featureFlag = flag as FeatureFlagLDConstant
            featureFlags[featureFlag] = mockFeatureFlags[
                featureFlag
            ] as FeatureFlagSettings
        }
    }

    return {
        getFeatureFlag: async (user, flag) => featureFlags[flag],
    }
}

export { testLDService }
