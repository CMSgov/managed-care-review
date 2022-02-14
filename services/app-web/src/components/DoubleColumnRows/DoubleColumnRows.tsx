import React from 'react'
import { Grid } from '@trussworks/react-uswds'
import styles from './DoubleColumnRows.module.scss'

export type ChildrenType = (React.ReactChild | React.ReactFragment | React.ReactPortal)
export type ChildrenPairType = ChildrenType[][]

export type DoubleColumnRowsProps = {
    children: React.ReactNode
}

export const pairedChildren = (children: ChildrenType[]) => {
    return children.reduce((pairedChildren: ChildrenPairType, child, index, array) => {
        if (index % 2 === 0) {
            pairedChildren.push(array.slice(index, index + 2))
        }
        return pairedChildren
    }, [])
}

export const DoubleColumnRows = ({
    children,
}: DoubleColumnRowsProps): React.ReactElement => {
    const rows: ChildrenPairType = pairedChildren(React.Children.toArray(children))
    return (
        <>
            {rows.map((childrenPairs, rIndex) => (
                    <Grid
                        row
                        gap
                        className={styles.row}
                        key={`grid-row-${rIndex}`}
                        data-testid={`grid-row-${rIndex}`}
                    >
                        {childrenPairs.map((child, cIndex) => (
                                <Grid
                                    tablet={{col: 6}}
                                    key={`grid-row-${rIndex}-column-${cIndex}`}
                                >
                                    {child}
                                </Grid>
                            )
                        )}
                    </Grid>
                ))
            }
        </>
    )
}
