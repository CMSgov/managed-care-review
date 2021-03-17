import React from 'react'
import { SubmissionCard } from './SubmissionCard'

export default {
    title: 'Components/SubmissionCard',
    component: SubmissionCard,
}

export const Draft = (): React.ReactElement => <SubmissionCard 
    number="VA-CCCPlus-0001" 
    description="Rates are being adjusted to reflect revised capitation rates based on more recent data as well as benefit changes approved by the General Assembly." 
    type="Contract action and rate certification" 
    submitted={false} 
    date=""
/>

export const Submitted = (): React.ReactElement => <SubmissionCard 
    number="VA-CCCPlus-0001" 
    description="Rates are being adjusted to reflect revised capitation rates based on more recent data as well as benefit changes approved by the General Assembly." 
    type="Contract action and rate certification" 
    submitted={true} 
    date="4/13/21"
/>