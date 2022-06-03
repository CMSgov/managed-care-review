import { Story } from '@storybook/react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { FieldYesNo, FieldYesNoProps } from './FieldYesNo'

export default {
    title: 'Components/Forms/FieldYesNo',
    component: FieldYesNo,
}

interface YesNoStoryParams {
    fieldProps: FieldYesNoProps[]
    initialValues: { [key: string]: string }
}

const Template: Story<YesNoStoryParams> = (args) => {
    const innerSchema: { [key: string]: Yup.AnySchema } = {}

    for (const fieldArg of args.fieldProps) {
        innerSchema[fieldArg.name] = Yup.string().required(
            'You must select yes or no'
        )
    }

    const storyFormikSchema = Yup.object().shape(innerSchema)

    return (
        <Formik
            initialValues={args.initialValues}
            validationSchema={storyFormikSchema}
            onSubmit={(values) => console.log('submitted', values)}
            validateOnMount={true}
        >
            <form>
                {args.fieldProps.map((fieldArg) => (
                    <FieldYesNo {...fieldArg} />
                ))}
            </form>
        </Formik>
    )
}

export const Default = Template.bind({})

Default.args = {
    fieldProps: [
        {
            name: 'modifiedBenefitsProvided',
            id: 'modifiedBenefitsProvided',
            label: 'Benefits provided have been modified',
            showError: false,
        },
    ],
    initialValues: {
        modifiedBenefitsProvided: '',
    },
}

export const Erroring = Template.bind({})

Erroring.args = {
    fieldProps: [
        {
            name: 'modifiedBenefitsProvided',
            id: 'modifiedBenefitsProvided',
            label: 'Benefits provided have been modified',
            showError: true,
        },
    ],
    initialValues: {
        modifiedBenefitsProvided: '',
    },
}

export const Multiple = Template.bind({})

Multiple.args = {
    fieldProps: [
        {
            name: 'modifiedBenefitsProvided',
            id: 'modifiedBenefitsProvided',
            label: 'Benefits provided by the managed care plans',
            showError: false,
        },
        {
            name: 'modifiedGeoArea',
            id: 'modifiedGeoArea',
            label: 'Geographic areas served by the managed care plans',
            showError: true,
        },
        {
            name: 'modifiedSomething',
            id: 'modifiedSomething',
            label: 'Medicaid beneficiaries served by the managed care plans (e.g. eligibility or enrollment criteria)',
            showError: true,
        },
    ],
    initialValues: {
        modifiedBenefitsProvided: 'NO',
        modifiedGeoArea: 'YES',
        modifiedSomething: '',
    },
}
