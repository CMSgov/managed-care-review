import { Table } from '@trussworks/react-uswds'
import React, { useCallback, useMemo } from 'react'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import Select, { OnChangeValue } from 'react-select'
import {
    CmsUser,
    useIndexUsersQuery,
    Division,
    useUpdateCmsUserMutation,
} from '../../../gen/gqlClient'

import styles from '../Settings.module.scss'
import { Loading } from '../../../components'
import { SettingsErrorAlert } from '../SettingsErrorAlert'

import { wrapApolloResult } from '../../../gqlHelpers/apolloQueryWrapper'
import { handleGQLErrors } from '../../../gqlHelpers/apolloErrors'

type DivisionSelectOptions = {
    label: string
    value: Division
}

function DivisionSelect({
    currentAssignment,
    user,
    setDivision,
}: {
    currentAssignment: Division | null | undefined
    user: CmsUser
    setDivision: SetDivisionCallbackType
}): React.ReactElement {
    async function handleChange(
        selectedOption: OnChangeValue<DivisionSelectOptions, false>,
        row: CmsUser
    ) {
        if (selectedOption && 'value' in selectedOption) {
            await setDivision(row.id, selectedOption.value)
        }
    }

    const options: DivisionSelectOptions[] = [
        { label: 'DMCO', value: 'DMCO' },
        { label: 'DMCP', value: 'DMCP' },
        { label: 'OACT', value: 'OACT' },
    ]

    const findOptionByValue = (
        value: Division | null | undefined
    ): DivisionSelectOptions | null => {
        if (!value) return null
        return options.find((option) => option.value === value) || null
    }
    const defaultOption = findOptionByValue(currentAssignment)

    return (
        <Select
            value={defaultOption}
            options={options}
            onChange={(selectedOption) => handleChange(selectedOption, user)}
        />
    )
}

// useReactTable wants to be called with data, preferably
function CMSUserTableWithData({
    cmsUsers,
    setDivision,
}: {
    cmsUsers: CmsUser[]
    setDivision: SetDivisionCallbackType
}): React.ReactElement {
    const columns = useMemo(() => {
        const columnHelper = createColumnHelper<CmsUser>()
        return [
            columnHelper.accessor('familyName', {
                id: 'familyName',
                cell: (info) => info.getValue(),
                header: () => 'Family Name',
            }),
            columnHelper.accessor('givenName', {
                id: 'givenName',
                cell: (info) => info.getValue(),
                header: () => 'Given Name',
            }),
            columnHelper.accessor('email', {
                id: 'email',
                cell: (info) => info.getValue(),
                header: () => 'Email',
            }),
            columnHelper.accessor('divisionAssignment', {
                id: 'divisionAssignment',
                cell: (info) => {
                    return (
                        <DivisionSelect
                            currentAssignment={info.getValue()}
                            user={info.row.original}
                            setDivision={setDivision}
                        />
                    )
                },
                header: () => 'Division',
            }),
        ]
    }, [setDivision])

    const table = useReactTable({
        data: cmsUsers,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <Table>
            <caption className="srOnly">CMS Users</caption>
            <thead className={styles.header}>
                {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <th key={header.id}>
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                      )}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>
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
    )
}

type SetDivisionCallbackType = (
    userID: string,
    division: Division
) => Promise<void>

export const CMSUsersTable = (): React.ReactElement => {
    const { result } = wrapApolloResult(
        useIndexUsersQuery({
            fetchPolicy: 'cache-and-network',
        })
    )

    const [updateCmsUser] = useUpdateCmsUserMutation()

    const setDivisionCallback: SetDivisionCallbackType = useCallback(
        async (userID: string, division: Division) => {
            const res = await updateCmsUser({
                variables: {
                    input: {
                        cmsUserID: userID,
                        stateAssignments: [],
                        divisionAssignment: division,
                    },
                },
            })

            if (res.errors) {
                console.error('Errored attempting to update user: ', res.errors)
                handleGQLErrors(res.errors)
            }
        },
        [updateCmsUser]
    )

    if (result.status === 'LOADING') {
        return (
            <div className={styles.table}>
                <h2>CMS users</h2>
                <Loading />
            </div>
        )
    }

    if (result.status === 'ERROR') {
        return <SettingsErrorAlert error={result.error} />
    }

    // filter to just CMS users
    const cmsUsers = result.data.indexUsers.edges
        .filter((edge) => edge.node.__typename === 'CMSUser')
        .map((edge) => edge.node as CmsUser)

    return (
        <div className={styles.table}>
            <h2>CMS users</h2>
            {cmsUsers.length ? (
                <CMSUserTableWithData
                    cmsUsers={cmsUsers}
                    setDivision={setDivisionCallback}
                />
            ) : (
                <div>
                    <p>No CMS users to display</p>
                </div>
            )}
        </div>
    )
}

CMSUsersTable.whyDidYouRender = true
