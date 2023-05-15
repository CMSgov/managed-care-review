import { formatCalendarDate } from '@managed-care-review/common-code/dateHelpers'
import { DataDetailMissingField } from '../DataDetailMissingField'

// Intended for use as children passed to DataDetail
export const DataDetailDateRange = ({
    startDate,
    endDate,
}: {
    startDate?: Date
    endDate?: Date
}): React.ReactElement => {
    if (!startDate || !endDate) return <DataDetailMissingField />
    return (
        <>{`${formatCalendarDate(startDate)} to ${formatCalendarDate(
            endDate
        )}`}</>
    )
}
