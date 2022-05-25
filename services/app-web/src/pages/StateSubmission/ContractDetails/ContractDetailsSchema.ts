import * as Yup from 'yup'
import dayjs from 'dayjs'
import { validateDateFormat } from '../../../formHelpers'

Yup.addMethod(Yup.date, 'validateDateFormat', validateDateFormat)

// Formik setup
export const ContractDetailsFormSchema = Yup.object().shape({
    contractType: Yup.string().defined(
        'You must choose a contract action type'
    ),
    contractExecutionStatus: Yup.string().defined(
        'You must select a contract status'
    ),
    contractDateStart: Yup.date().when('contractType', (contractType) => {
        if (contractType) {
            return (
                Yup.date()
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    .validateDateFormat('YYYY-MM-DD', true)
                    .defined('You must enter a start date')
                    .typeError('The start date must be in MM/DD/YYYY format')
            )
        }
    }),
    contractDateEnd: Yup.date().when('contractType', (contractType) => {
        if (contractType) {
            return (
                Yup.date()
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    .validateDateFormat('YYYY-MM-DD', true)
                    .defined('You must enter an end date')
                    .typeError('The end date must be in MM/DD/YYYY format')
                    .when(
                        // ContractDateEnd must be at minimum the day after Start
                        'contractDateStart',
                        (contractDateStart: Date, schema: Yup.DateSchema) => {
                            const startDate = dayjs(contractDateStart)
                            if (startDate.isValid()) {
                                return schema.min(
                                    startDate.add(1, 'day'),
                                    'The end date must come after the start date'
                                )
                            }
                        }
                    )
            )
        }
    }),
    managedCareEntities: Yup.array().when('contractType', {
        is: (contractType: string | undefined) => contractType,
        then: Yup.array().min(1, 'You must select at least one entity'),
    }),
    federalAuthorities: Yup.array().when('contractType', {
        is: (contractType: string | undefined) => contractType,
        then: Yup.array().min(1, 'You must select at least one authority'),
    }),
    itemsAmended: Yup.array().when('contractType', {
        is: 'AMENDMENT',
        then: Yup.array().min(1, 'You must select at least one item'),
    }),
    otherItemAmended: Yup.string().when('itemsAmended', {
        is: (items: string[]) => items.includes('OTHER'),
        then: Yup.string().defined('You must enter a description'),
    }),
    capitationRates: Yup.string().when('itemsAmended', {
        is: (items: string[]) => items.includes('CAPITATION_RATES'),
        then: Yup.string()
            .nullable()
            .defined('You must select a reason for capitation rate change'),
    }),
    capitationRatesOther: Yup.string().when('capitationRates', {
        is: 'OTHER',
        then: Yup.string().defined('You must enter a description'),
    }),

    modifiedBenefitsProvided: Yup.string().when('contractType', {
        is: 'AMENDMENT',
        then: Yup.string().defined('You must select yes or no'),
    }),

    modifiedGeoAreaServed: Yup.string().when('contractType', {
        is: 'AMENDMENT',
        then: Yup.string().defined('You must select yes or no'),
    }),
})
