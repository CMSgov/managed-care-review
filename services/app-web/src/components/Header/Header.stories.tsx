import React from 'react'

import { Header } from './Header'

export default {
    title: 'Components/Header',
    component: Header,
}

export const StateUserHeader = (): React.ReactElement => (
    <Header stateCode="TN" />
)
