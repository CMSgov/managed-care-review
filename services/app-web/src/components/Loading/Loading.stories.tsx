import React from 'react'
import { Story } from '@storybook/react'

import ProvidersDecorator from '../../../.storybook/providersDecorator'
import { Loading } from './Loading'

export default {
    title: 'Components/Loading',
    component: Loading,
}

const Template: Story = (args) => <Loading {...args} />

export const LoadingDefault = Template.bind({})
LoadingDefault.decorators = [(Story) => ProvidersDecorator(Story, {})]

// export const CMSHeaderLoggedIn = Template.bind({})

// CMSHeaderLoggedIn.decorators = [
//     (Story) =>
//         ProvidersDecorator(Story, {
//             apolloProvider: {
//                 mocks: [getCurrentUserMock({ statusCode: 200 })],
//             },
//         }),
// ]
