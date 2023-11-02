import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
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
    Column,
    FilterFn,
} from '@tanstack/react-table'
import { useAtom } from 'jotai/react'
import { atom } from 'jotai'
import { atomWithHash } from 'jotai-location'
import { loadable } from 'jotai/vanilla/utils'
import {
    HealthPlanPackageStatus,
    Program,
    RelatedContractRevisions,
} from '../../../gen/gqlClient'
import styles from '../../../components/HealthPlanPackageTable/HealthPlanPackageTable.module.scss'
import { Table, Tag, Link } from '@trussworks/react-uswds'
import { NavLink } from 'react-router-dom'
import dayjs from 'dayjs'
import qs from 'qs'
import {
    FilterAccordion,
    FilterSelect,
    FilterSelectedOptionsType,
    FilterOptionType,
    FilterDateRange,
} from '../../../components/FilterAccordion'
import { pluralize } from '../../../common-code/formatters'
import { DoubleColumnGrid } from '../../../components'
import { FilterDateRangeRef } from '../../../components/FilterAccordion/FilterDateRange/FilterDateRange'
import { Loading } from '../../../components'

declare module '@tanstack/table-core' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        dataTestID: string
    }
    interface FilterFns {
        startDateFilter: FilterFn<unknown>
        endDateFilter: FilterFn<unknown>
    }
}

export type RateInDashboardType = {
    id: string
    name: string
    submittedAt: string
    updatedAt: Date
    status: HealthPlanPackageStatus
    programs: Program[]
    rateType: string
    rateDateStart: Date
    rateDateEnd: Date
    stateName: string
    contractRevisions: RelatedContractRevisions[]
}

export type RateTableProps = {
    tableData: RateInDashboardType[]
    showFilters?: boolean
    caption?: string
}

function rateURL(rate: RateInDashboardType): string {
    return `/rates/${rate.id}`
}

const rateTypeOptions = [
    {
        label: 'Certification',
        value: 'Certification',
    },
    {
        label: 'Amendment',
        value: 'Amendment',
    },
]

/* To keep the memoization from being refreshed every time, this needs to be
    created outside the render function */
const columnHelper = createColumnHelper<RateInDashboardType>()

type ReadableFilters = {
    [key: string]: string[]
}

const fromColumnFiltersToReadableUrl = (input?: ColumnFiltersState) => {
    const output: ReadableFilters = {}
    if (input) {
        input.forEach((element) => {
            output[element.id] = element.value as string[]
        })
    }
    return qs.stringify(output, { arrayFormat: 'comma', encode: false })
}

const fromReadableUrlToColumnFilters = (input?: string): ColumnFiltersState => {
    if (!input) {
        return []
    }
    const parsed = qs.parse(input) as { [key: string]: string }
    return Object.entries(parsed).map(([id, value]) => ({
        id,
        value: value.split(','),
    }))
}

/* We have two atomWithHash with an initial value on first render.
  - columnHash is initialized with [], which is used with for setting column filter state in react table. Setting
    the initialized value as undefined breaks react table since it does not accept undefined.
  - initWithNullColumnHash is initialized with undefined, this is used for setting the defaultValues for the filters
    on load. We need this separate hash because if first render is always [], then it will cause table flickering.
    initWithNullColumnHash is used in `loadable` from jotai to return loading state we can then use this to show
    a loading component until filters from the url have been parsed and returned.
*/
const columnHash = atomWithHash('filters', [] as ColumnFiltersState, {
    serialize: fromColumnFiltersToReadableUrl,
    deserialize: fromReadableUrlToColumnFilters,
})

const initWithNullColumnHash = atomWithHash('filters', undefined, {
    serialize: fromColumnFiltersToReadableUrl,
    deserialize: fromReadableUrlToColumnFilters,
})

/* This loadableColumnHash helps us control our loading logic for table filters from the url. This is to prevent table
    flickering from the initial atomWithHash value */
const loadableColumnHash = loadable(
    atom(async (get) => get(initWithNullColumnHash))
)

/* transform react-table's ColumnFilterState (stringified, formatted, and stored in the URL) to react-select's FilterOptionType
    and return only the items matching the FilterSelect component that's calling the function*/
const getSelectedFiltersFromColumnState = (
    columnFilters: ColumnFiltersState,
    id: string
) => {
    type TempRecord = { value: string; label: string; id: string }
    const valuesFromUrl = [] as TempRecord[]
    columnFilters.forEach((filter) => {
        if (Array.isArray(filter.value)) {
            filter.value.forEach((value) => {
                valuesFromUrl.push({
                    value: value,
                    label: value,
                    id: filter.id,
                })
            })
        }
    })

    const filterValues = valuesFromUrl
        .filter((item) => item.id === id)
        .map((item) => ({ value: item.value, label: item.value }))

    return filterValues as FilterOptionType[]
}

const getDateRangeFilterFromUrl = (
    columnFilters: ColumnFiltersState,
    id: string
): string | undefined => {
    const filterLookup: { [key: string]: string[] } = {}
    columnFilters.forEach(
        (filter) => (filterLookup[filter.id] = filter.value as string[])
    )

    if (filterLookup[id]) {
        return filterLookup[id][0]
    }
    return undefined
}

// Even though both date filters are similar we don't want to combine into one function because we don't always know
// what the columnId will be. These could be used on the contract table which have different column names, so we cannot
// use column names to check greater or less than.
const startDateFilter: FilterFn<unknown> = (row, columnId, value) => {
    if (!value) {
        return true
    }
    const columnDate = new Date(row.getValue(columnId)).getTime()
    const filterDate = new Date(value).getTime()
    return columnDate >= filterDate
}

const endDateFilter: FilterFn<unknown> = (row, columnId, value, addMeta) => {
    if (!value) {
        return true
    }
    const columnDate = new Date(row.getValue(columnId)).getTime()
    const filterDate = new Date(value).getTime()
    return columnDate <= filterDate
}

type TableVariantConfig = {
    tableName: string
    rowIDName: string
}
export const RateReviewsTable = ({
    caption,
    tableData,
    showFilters = false,
}: RateTableProps): React.ReactElement => {
    const lastClickedElement = useRef<string | null>(null)
    const filterDateRangeRef = useRef<FilterDateRangeRef>(null)
    const [columnFilters, setColumnFilters] = useAtom(columnHash)
    const [defaultFiltersFromUrl] = useAtom(loadableColumnHash)
    const [defaultColumnState, setFiltersFromUrl] = useState<
        ColumnFiltersState | undefined
    >(undefined)

    const tableConfig: TableVariantConfig = {
        tableName: 'Rate Reviews',
        rowIDName: 'rate',
    }

    /* we store the last clicked element in a ref so that when the url is updated and the page rerenders
        we can focus that element.  this useEffect (with no dependency array) will run once on each render.
        Note that the React-y way to do this is to use forwardRef, but the clearFilters button is deeply nested
        and we'd wind up passing down the ref through several layers to achieve what we can do here in a few lines
        with DOM methods */
    useEffect(() => {
        const currentValue = lastClickedElement?.current
        if (!currentValue) {
            return
        }
        /* if the last clicked element had a label, it was a react-select component and the label will match our
        naming convention */
        const labels = document.getElementsByTagName('label')
        const labelNames = Array.from(labels).map((item) => item.htmlFor)
        const indexOfLabel = labelNames.indexOf(
            `${currentValue}-filter-select-input`
        )
        if (indexOfLabel > -1) {
            labels[indexOfLabel].focus()
            /* if the last clicked element was NOT a label, then it was the clear filters button, which we can look
            up by id */
        } else {
            const element = document.getElementById(currentValue)
            if (element) {
                element.focus()
            }
        }
        lastClickedElement.current = null
    })

    const [tableCaption, setTableCaption] = useState<React.ReactNode | null>()

    const tableColumns = React.useMemo(
        () => [
            columnHelper.accessor((row) => row, {
                header: 'Rate review',
                cell: (info) => (
                    <Link
                        key={`${tableConfig.rowIDName}-id-${
                            info.getValue().id
                        }`}
                        asCustom={NavLink}
                        to={rateURL(info.getValue())}
                    >
                        {info.getValue().name}
                    </Link>
                ),
                meta: {
                    dataTestID: `${tableConfig.rowIDName}-id`,
                },
            }),
            columnHelper.accessor('stateName', {
                id: 'stateName',
                header: 'State',
                cell: (info) => <span>{info.getValue()}</span>,
                meta: {
                    dataTestID: `${tableConfig.rowIDName}-stateName`,
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
                    dataTestID: `${tableConfig.rowIDName}-programs`,
                },
            }),
            columnHelper.accessor('rateType', {
                id: 'rateType',
                header: 'Rate type',
                cell: (info) => <span>{info.getValue()}</span>,
                meta: {
                    dataTestID: 'rate-type',
                },
                filterFn: `arrIncludesSome`,
            }),
            columnHelper.accessor('rateDateStart', {
                id: 'rateDateStart',
                header: 'Rate period start date',
                cell: (info) =>
                    info.getValue()
                        ? dayjs(info.getValue()).format('MM/DD/YYYY')
                        : '',
                meta: {
                    dataTestID: `${tableConfig.rowIDName}-date`,
                },
                filterFn: 'startDateFilter',
            }),
            columnHelper.accessor('rateDateEnd', {
                id: 'rateDateEnd',
                header: 'Rate period end date',
                cell: (info) =>
                    info.getValue()
                        ? dayjs(info.getValue()).format('MM/DD/YYYY')
                        : '',
                meta: {
                    dataTestID: `${tableConfig.rowIDName}-date`,
                },
                filterFn: 'endDateFilter',
            }),
            columnHelper.accessor('submittedAt', {
                header: 'Submission date',
                cell: (info) =>
                    info.getValue()
                        ? dayjs(info.getValue()).format('MM/DD/YYYY')
                        : '',
                meta: {
                    dataTestID: `${tableConfig.rowIDName}-date`,
                },
            }),
        ],
        [tableConfig.rowIDName]
    )

    const reactTable = useReactTable({
        data: tableData.sort((a, b) =>
            a['updatedAt'] > b['updatedAt'] ? -1 : 1
        ),
        columns: tableColumns,
        filterFns: {
            startDateFilter: startDateFilter,
            endDateFilter: endDateFilter,
        },
        state: {
            columnFilters,
        },
        getCoreRowModel: getCoreRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    const filteredRows = reactTable.getRowModel().rows
    const hasFilteredRows = filteredRows.length > 0

    const stateColumn = reactTable.getColumn(
        'stateName'
    ) as Column<RateInDashboardType>
    const rateTypeColumn = reactTable.getColumn(
        'rateType'
    ) as Column<RateInDashboardType>
    const rateDateStartColumn = reactTable.getColumn(
        'rateDateStart'
    ) as Column<RateInDashboardType>
    const rateDateEndColumn = reactTable.getColumn(
        'rateDateEnd'
    ) as Column<RateInDashboardType>

    // Filter options based on table data instead of static list of options.
    const stateFilterOptions = Array.from(
        stateColumn.getFacetedUniqueValues().keys()
    ).map((state) => ({
        value: state,
        label: state,
    }))

    const filterLength = columnFilters.flatMap((filter) => filter.value).length
    const filtersApplied = `${filterLength} ${pluralize(
        'filter',
        filterLength
    )} applied`

    const submissionCount = !showFilters
        ? `${tableData.length} ${pluralize('rate', tableData.length)}`
        : `Displaying ${filteredRows.length} of ${tableData.length} ${pluralize(
              'rate',
              tableData.length
          )}`

    const updateFilters = (
        column: Column<RateInDashboardType>,
        selectedOptions: FilterSelectedOptionsType,
        filterRefName: string
    ) => {
        lastClickedElement.current = filterRefName
        setTableCaption(null)
        column.setFilterValue(
            selectedOptions.map((selection) => selection?.value)
        )
    }

    const updateRatingPeriodFilter = (
        date: string | undefined,
        filterName: 'rateDateStart' | 'rateDateEnd'
    ) => {
        const filterColumn =
            filterName === 'rateDateStart'
                ? rateDateStartColumn
                : rateDateEndColumn
        const filterElRefName =
            filterName === 'rateDateStart'
                ? 'ratingPeriodDateStart'
                : 'ratingPeriodDateEnd'

        lastClickedElement.current = filterElRefName
        setTableCaption(null)
        if (!date) {
            filterColumn.setFilterValue([])
        } else {
            filterColumn.setFilterValue([date])
        }
    }

    const clearFilters = () => {
        setTableCaption(null)
        setColumnFilters([])
        if (filterDateRangeRef.current) {
            filterDateRangeRef.current.clearFilter()
        }
        lastClickedElement.current = 'clearFiltersButton'
    }

    //Store caption element in state in order for screen readers to read dynamic captions.
    useEffect(() => {
        setTableCaption(
            <caption className={caption ? '' : styles.srOnly}>
                {caption ?? tableConfig.tableName}
                {showFilters && (
                    <span
                        className={styles.srOnly}
                    >{`, ${filtersApplied}`}</span>
                )}
                <span className={styles.srOnly}>{`, ${submissionCount}.`}</span>
            </caption>
        )
    }, [
        filtersApplied,
        submissionCount,
        caption,
        showFilters,
        tableConfig.tableName,
    ])

    // This sets filters from the url to be used as defaultValues for all the filters
    useLayoutEffect(() => {
        // state if `hasData` does not mean the data is not undefined, but that the atom value has the data field. The field
        // only is available when loading is finished and there was not errors.
        if (defaultFiltersFromUrl.state === 'hasData' && !defaultColumnState) {
            /* Dashboard urls can have #filters= or not, both mean no filters. When #filters= is not present then the
                data will be undefined, at which we set to [] so we do not run this hook again. When just #filters= is
                present data will be [] so we can just set defaultColumnState as the data value.*/
            setFiltersFromUrl(defaultFiltersFromUrl.data ?? [])
        }
    }, [defaultFiltersFromUrl, defaultColumnState])

    if (defaultColumnState === undefined) {
        return <Loading />
    }

    return (
        <>
            {tableData.length ? (
                <>
                    {showFilters && (
                        <FilterAccordion
                            onClearFilters={clearFilters}
                            filterTitle="Filters"
                        >
                            <DoubleColumnGrid>
                                <FilterSelect
                                    value={getSelectedFiltersFromColumnState(
                                        columnFilters,
                                        'stateName'
                                    )}
                                    defaultValue={getSelectedFiltersFromColumnState(
                                        defaultColumnState,
                                        'stateName'
                                    )}
                                    name="state"
                                    label="State"
                                    filterOptions={stateFilterOptions}
                                    onChange={(selectedOptions) =>
                                        updateFilters(
                                            stateColumn,
                                            selectedOptions,
                                            'state'
                                        )
                                    }
                                />
                                <FilterSelect
                                    value={getSelectedFiltersFromColumnState(
                                        columnFilters,
                                        'rateType'
                                    )}
                                    defaultValue={getSelectedFiltersFromColumnState(
                                        defaultColumnState,
                                        'rateType'
                                    )}
                                    name="rateType"
                                    label="Rate Type"
                                    filterOptions={rateTypeOptions}
                                    onChange={(selectedOptions) =>
                                        updateFilters(
                                            rateTypeColumn,
                                            selectedOptions,
                                            'rateType'
                                        )
                                    }
                                />
                            </DoubleColumnGrid>
                            <FilterDateRange
                                ref={filterDateRangeRef}
                                name={'ratingPeriod'}
                                label={'Rating period start date'}
                                startDateDefaultValue={getDateRangeFilterFromUrl(
                                    defaultColumnState,
                                    'rateDateStart'
                                )}
                                endDateDefaultValue={getDateRangeFilterFromUrl(
                                    defaultColumnState,
                                    'rateDateEnd'
                                )}
                                onStartChange={(date) =>
                                    updateRatingPeriodFilter(
                                        date,
                                        'rateDateStart'
                                    )
                                }
                                onEndChange={(date) =>
                                    updateRatingPeriodFilter(
                                        date,
                                        'rateDateEnd'
                                    )
                                }
                            />
                        </FilterAccordion>
                    )}
                    <div aria-live="polite" aria-atomic>
                        {showFilters && (
                            <div className={styles.filterCount}>
                                {filtersApplied}
                            </div>
                        )}
                        <div className={styles.filterCount}>
                            {submissionCount}
                        </div>
                    </div>
                    <Table fullWidth>
                        <thead>
                            {reactTable.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th scope="col" key={header.id}>
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
                            {filteredRows.map((row) => (
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
                        {tableCaption}
                    </Table>
                    {!hasFilteredRows && (
                        <div
                            data-testid="dashboard-table"
                            className={styles.panelEmptyNoFilteredResults}
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
                    data-testid="rate-reviews-table"
                    className={styles.panelEmptyNoSubmissionsYet}
                >
                    <h3>
                        You have no {tableConfig.tableName.toLowerCase()} yet
                    </h3>
                </div>
            )}
        </>
    )
}
