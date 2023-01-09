import React from 'react'
import { DataDetail } from './DataDetail'

export default {
    title: 'Components/DataDetail',
    component: DataDetail,
    parameters: {
        componentSubtitle:
            'DataDetail displays definition terms and descriptions using semantic HTML. This is useful for summarizing static data.',
    },
}

export const WithString = (): React.ReactElement => (
    <dl>
        <DataDetail
            id="rainfall"
            label="Average rainfall in May"
            data="31.58 inches"
        />
    </dl>
)
export const WithAddress = (): React.ReactElement => (
    <dl>
        <DataDetail
            id="disney"
            label="Disney World Contact Info"
            data={
                <address>
                    Mickey Mouse
                    <br />
                    <a href="mailto:mickey@disney.com">mickey@disney.com</a>
                    <br />
                    <a href="tel:555-555-5555">555-555-5555</a>
                </address>
            }
        />
    </dl>
)

export const WithMissingField = (): React.ReactElement => (
    <dl>
        <DataDetail
            id="crystal-ball"
            label="The secret to the future"
            data={undefined}
            explainMissingData
        />
    </dl>
)

export const WithCheckboxList = (): React.ReactElement => (
    <dl>
        <DataDetail
            id="crystal-ball"
            label="The secret to the future"
            data={['THIS', 'THAT', 'THE_OTHER']}
            explainMissingData
        />
    </dl>
)
