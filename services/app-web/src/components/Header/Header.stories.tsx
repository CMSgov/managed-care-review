import React from 'react'
import { Story } from '@storybook/react'
import { Header, HeaderProps } from './Header'

export default {
    title: 'Components/Header',
    component: Header,
}

const Template: Story<HeaderProps> = (args) => <Header {...args} />

export const CMSHeader = Template.bind({})

CMSHeader.args = {
    loggedIn: true,
    stateCode: 'MN',
    user: {
        name: 'Bob test user',
        email: 'bob@dmas.mn.gov',
    },
}
