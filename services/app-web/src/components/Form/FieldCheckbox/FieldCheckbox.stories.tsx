import { Story } from '@storybook/react'
import { Formik } from 'formik'
import { FieldCheckbox, FieldCheckboxProps } from './FieldCheckbox'

export default {
    title: 'Components/Forms/FieldCheckbox',
    component: FieldCheckbox,
}

const Template: Story<FieldCheckboxProps> = (args) => (
    <Formik
        initialValues={{ input1: '' }}
        onSubmit={(e) => console.log('submitted')}
    >
        <FieldCheckbox {...args} />
    </Formik>
)

export const Default = Template.bind({})

Default.args = {
    name: 'managedCareEntity',
    id: 'mco',
    label: 'Managed Care Organization (MCO)',
}
