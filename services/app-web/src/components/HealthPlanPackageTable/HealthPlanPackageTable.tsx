import React from 'react'
import {
    ColumnFiltersState,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    RowData,
    useReactTable,
    getFacetedUniqueValues,
} from '@tanstack/react-table'
import { HealthPlanPackageStatus, Program, User } from '../../gen/gqlClient'
import styles from './HealthPlanPackageTable.module.scss'
import { Table, Tag, Link } from '@trussworks/react-uswds'
import { NavLink } from 'react-router-dom'
import dayjs from 'dayjs'
import { SubmissionStatusRecord } from '../../constants/healthPlanPackages'
import { FilterAccordion, FilterSelect } from '../FilterAccordion'
import statePrograms from '../../common-code/data/statePrograms.json'
import { InfoTag, TagProps } from '../InfoTag/InfoTag'

declare module '@tanstack/table-core' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        dataTestID: string
    }
}

export type PackageInDashboardType = {
    id: string
    name: string
    submittedAt?: string
    updatedAt: Date
    status: HealthPlanPackageStatus
    programs: Program[]
    submissionType?: string
    stateName?: string
}

export type PackageTableProps = {
    tableData: PackageInDashboardType[]
    user: User
    showFilters?: boolean
}

const isSubmitted = (status: HealthPlanPackageStatus) =>
    status === 'SUBMITTED' || status === 'RESUBMITTED'

function submissionURL(
    id: PackageInDashboardType['id'],
    status: PackageInDashboardType['status'],
    userType: User['__typename']
): string {
    if (userType === 'CMSUser') {
        return `/submissions/${id}`
    } else if (status === 'DRAFT') {
        return `/submissions/${id}/edit/type`
    } else if (status === 'UNLOCKED') {
        return `/submissions/${id}/edit/review-and-submit`
    }
    return `/submissions/${id}`
}

const StatusTag = ({
    status,
}: {
    status: HealthPlanPackageStatus
}): React.ReactElement => {
    let color: TagProps['color'] = 'gold'
    if (isSubmitted(status)) {
        color = 'green'
    } else if (status === 'UNLOCKED') {
        color = 'blue'
    }

    const statusText = isSubmitted(status)
        ? SubmissionStatusRecord.SUBMITTED
        : SubmissionStatusRecord[status]

    return <InfoTag color={color}>{statusText}</InfoTag>
}

const stateOptions = statePrograms.states
    .map(({ name }) => ({
        label: name,
        value: name,
    }))
    .filter((option) => option.value !== 'American Samoa')

const submissionTypeOptions = [
    {
        label: 'Contract action only',
        value: 'Contract action only',
    },
    {
        label: 'Contract action and rate certification',
        value: 'Contract action and rate certification',
    },
]

export const HealthPlanPackageTable = ({
    tableData,
    user,
    showFilters = false,
}: PackageTableProps): React.ReactElement => {
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([])
    const columnHelper = createColumnHelper<PackageInDashboardType>()

    const tableColumns = [
        columnHelper.accessor((row) => row, {
            header: 'ID',
            cell: (info) => (
                <Link
                    key={`submission-id-${info.getValue().id}`}
                    asCustom={NavLink}
                    to={submissionURL(
                        info.getValue().id,
                        info.getValue().status,
                        user.__typename
                    )}
                >
                    {info.getValue().name}
                </Link>
            ),
            meta: {
                dataTestID: 'submission-id',
            },
        }),
        columnHelper.accessor('stateName', {
            id: 'stateName',
            header: 'State',
            cell: (info) => <span>{info.getValue()}</span>,
            meta: {
                dataTestID: 'submission-stateName',
            },
            filterFn: `arrIncludesSome`,
        }),
        columnHelper.accessor('submissionType', {
            id: 'submissionType',
            header: 'Submission type',
            cell: (info) => <span>{info.getValue()}</span>,
            meta: {
                dataTestID: 'submission-type',
            },
            filterFn: `arrIncludesSome`,
        }),
        columnHelper.accessor('programs', {
            header: 'Programs',
            cell: (info) =>
                info.getValue().map((program) => {
                    return (
                        <Tag
                            data-testid="program-tag"
                            key={program.id}
                            className={`radius-pill ${styles.programTag}`}
                        >
                            {program.name}
                        </Tag>
                    )
                }),
            meta: {
                dataTestID: 'submission-programs',
            },
        }),
        columnHelper.accessor('submittedAt', {
            header: 'Submission date',
            cell: (info) =>
                info.getValue()
                    ? dayjs(info.getValue()).format('MM/DD/YYYY')
                    : '',
            meta: {
                dataTestID: 'submission-date',
            },
        }),
        columnHelper.accessor('updatedAt', {
            header: 'Last updated',
            cell: (info) =>
                info.getValue()
                    ? dayjs(info.getValue()).format('MM/DD/YYYY')
                    : '',
            meta: {
                dataTestID: 'submission-last-updated',
            },
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: (info) => <StatusTag status={info.getValue()} />,
            meta: {
                dataTestID: 'submission-status',
            },
        }),
    ]

    const reactTable = useReactTable({
        data: tableData.sort((a, b) =>
            a['updatedAt'] > b['updatedAt'] ? -1 : 1
        ),
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        state: {
            columnFilters,
            columnVisibility: {
                stateName: user.__typename !== 'StateUser',
                submissionType: user.__typename !== 'StateUser',
            },
        },
        onColumnFiltersChange: setColumnFilters,
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    const stateColumn = reactTable.getColumn('stateName')
    const submissionTypeColumn = reactTable.getColumn('submissionType')

    // Filter options based on table data instead of static list of options.
    // const stateFilterOptions: FilterOptionType[] = Array.from(stateColumn.getFacetedUniqueValues().keys()).map(state => ({
    //     value: state,
    //     label: state
    // }))
    //
    // const typeFilterOptions: FilterOptionType[] = Array.from(submissionTypeColumn.getFacetedUniqueValues().keys()).map(type => ({
    //     value: type,
    //     label: type
    // }))

    const filterTitle = `Filters ${
        columnFilters.length
            ? `(${
                  columnFilters.flatMap((filter) => filter.value).length
              } applied)`
            : ''
    }`

    return (
        <>
            {tableData.length ? (
                <>
                    {showFilters && (
                        <FilterAccordion
                            onClearFilters={() => {
                                setColumnFilters([])
                            }}
                            filterTitle={filterTitle}
                        >
                            <FilterSelect
                                name="state"
                                label="State"
                                filterOptions={stateOptions}
                                onChange={(selectedOptions) =>
                                    stateColumn.setFilterValue(
                                        selectedOptions.map(
                                            (selection) => selection.value
                                        )
                                    )
                                }
                            />
                            <FilterSelect
                                name="submissionType"
                                label="Submission type"
                                filterOptions={submissionTypeOptions}
                                onChange={(selectedOptions) =>
                                    submissionTypeColumn.setFilterValue(
                                        selectedOptions.map(
                                            (selection) => selection.value
                                        )
                                    )
                                }
                            />
                        </FilterAccordion>
                    )}
                    <Table fullWidth>
                        <thead>
                            {reactTable.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {reactTable.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    data-testid={`row-${row.original.id}`}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            data-testid={
                                                cell.column.columnDef.meta
                                                    ?.dataTestID
                                            }
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {!reactTable.getRowModel().rows.length && (
                        <div
                            data-testid="dashboard-table"
                            className={styles.panelEmpty}
                        >
                            <h3>No results found</h3>
                            <p>
                                Adjust your filter to find what you are looking
                                for.
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <div
                    data-testid="dashboard-table"
                    className={styles.panelEmpty}
                >
                    <h3>You have no submissions yet</h3>
                </div>
            )}
        </>
    )
}
