import {
    isValidStateCode,
    StateCodeType,
} from '../../../../../app-web/src/common-code/healthPlanFormDataType'
import { ParameterStore } from '../../awsParameterStore'

type StateAnalystsWithState = {
    stateCode: StateCodeType
    emails: string[]
}[]

const getStateAnalystsSettings = async (
    stateCodes: StateCodeType[]
): Promise<StateAnalystsWithState | Error> => {
    console.info('getStateAnalystsSettings: input ', JSON.stringify(stateCodes))
    const names = stateCodes.map(
        (code) => `/configuration/${code}/stateanalysts/email`
    )
    const stateAnalysts = await ParameterStore.getParameters(names)
    console.info(
        'getStateAnalystsSettings: returned value from getParameters ',
        JSON.stringify(stateAnalysts)
    )
    if (stateAnalysts instanceof Error) {
        console.info('getStateAnalystsSettings: analysts error')
        return stateAnalysts
    }

    // Make sure we are only returning valid states and clean parameter store value
    const cleanedStateAnalysts: StateAnalystsWithState = []

    stateAnalysts.forEach(
        (stateAnalyst: { name: string; value: string; type: string }) => {
            // Format values string into array
            const value = stateAnalyst.value
                .split(',')
                .map((email) => email.trim())

            const stateCode = stateAnalyst.name
                .replace('/configuration/', '')
                .replace('/stateanalysts/email', '')
            console.info(
                'isValidStateCode: ',
                stateCode,
                isValidStateCode(stateCode)
            )
            if (isValidStateCode(stateCode)) {
                cleanedStateAnalysts.push({
                    stateCode: stateCode,
                    emails: value,
                })
            } else {
                console.error(
                    `getStateAnalystsSettings: invalid state code ${stateCode}`
                )
            }
        }
    )
    console.info('getStateAnalystsSettings: output ', cleanedStateAnalysts)
    return cleanedStateAnalysts
}

const getStateAnalystsSettingsLocal = async (
    stateCodes: StateCodeType[]
): Promise<StateAnalystsWithState | Error> => {
    return [
        {
            stateCode: 'MN',
            emails: [`"MN State Analyst 1" <MNStateAnalyst1@example.com>`],
        },
        {
            stateCode: 'FL',
            emails: [`"FL State Analyst 1" <FLStateAnalyst1@example.com>`],
        },
    ]
}

export { getStateAnalystsSettings, getStateAnalystsSettingsLocal }
export type { StateAnalystsWithState }
