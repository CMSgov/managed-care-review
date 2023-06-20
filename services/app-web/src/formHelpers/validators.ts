/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs'
import * as Yup from 'yup'
import { FileItemT } from '../components'

/*
    validateDateFormat is a custom Yup method
    This is needed to transform manual user input format MM/DD/YYYY to YYYY-MM-DD
    and display specific errors when date is invalid
    More on this approach: https://github.com/jquense/yup#yupaddmethodschematype-schema-name-string-method--schema-void

*/
function validateDateFormat(
    this: Yup.DateSchema<
        Date | undefined,
        Record<string, any>,
        Date | undefined
    >,
    formats: string,
    parseStrict: boolean
): Yup.DateSchema<Date | undefined, Record<string, any>, Date | undefined> {
    return this.transform(function (value, originalValue) {
        if (this.isType(value)) return value
        value = dayjs(originalValue, formats, parseStrict)
        return value.isValid() ? value.toDate() : new Date('') // force return 'Invalid Date'
    })
}

const validateDateRange12Months = (
    startDateField: string,
    endDateField: string
): boolean => {
    const startDate = dayjs(startDateField)
    const isStartDateLeapDay =
        startDate.isLeapYear() &&
        startDate.month() === 1 &&
        startDate.date() === 29
    const oneYearLater = isStartDateLeapDay
        ? startDate.add(1, 'year')
        : startDate.add(1, 'year').subtract(1, 'day')
    return dayjs(endDateField).isSame(oneYearLater, 'day')
}

const isDateRangeEmpty = (startDate?: string, endDate?: string) =>
    !startDate && !endDate

const validateFileUpload = ({ required }: { required: boolean }) => {
    return Yup.mixed()
        .test(
            'is-not-empty',
            'You must upload at least one document',
            (value) => (required ? _hasAtLeastOneFile(value) : true)
        )
        .test(
            'is-not-loading',
            'You must wait for all documents to finish uploading before continuing',
            (value) => _hasNoLoadingFiles(value)
        )
        .test(
            'is-error-free',
            'You must remove all documents with error messages before continuing',
            (value) => _hasNoFileErrors(value)
        )
}
const _hasNoLoadingFiles = (fileItems: FileItemT[]) =>
    fileItems.every(
        (item) => item.status !== 'PENDING' && item.status !== 'SCANNING'
    )

const _hasNoFileErrors = (fileItems: FileItemT[]) =>
    fileItems.every(
        (item) =>
            item.status !== 'DUPLICATE_NAME_ERROR' &&
            item.status !== 'UPLOAD_ERROR' &&
            item.status !== 'SCANNING_ERROR'
    )

const _hasAtLeastOneFile = (fileItems: FileItemT[]) => fileItems.length > 0

export {
    isDateRangeEmpty,
    validateDateFormat,
    validateDateRange12Months,
    validateFileUpload,
}
