import React from 'react'
import styles from './DataDetail.module.scss'

type DataDetailProps = {
    id: string
    label: string
    data: React.ReactNode
}

/*
    DataDetail displays definition terms and descriptions using semantic HTML.
    This is useful for summarizing static data. Should be used inside a <dl>
*/
export const DataDetail = ({
    id,
    label,
    data,
}: DataDetailProps): React.ReactElement | null => {
    if (!data) return null
    return (
        <div className={styles.dataDetail}>
            <dt id={id}>{label}</dt>
            <dd role="definition" aria-labelledby={id}>
                {Array.isArray(data) ? data.join(', ').toUpperCase() : data}
            </dd>
        </div>
    )
}
