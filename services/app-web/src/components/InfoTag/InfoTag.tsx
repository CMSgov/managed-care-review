import React, { ComponentProps } from 'react'
import { Tag as USWDSTag } from '@trussworks/react-uswds'
import classNames from 'classnames'

import styles from './InfoTag.module.scss'

/* 
Main application-wide tag to draw attention to key info. 
  This is a react-uswds Tag enhanced with CMS styles.
*/
export type TagProps = {
    color: 'green' | 'gold' | 'cyan' | 'blue'
} & ComponentProps<typeof USWDSTag>

export const InfoTag = ({
    color,
    className,
    children,
}: TagProps): React.ReactElement | null => {
    const tagClasses = classNames(
        'usa-tag',
        {
            [styles['green']]: color === 'green',
            [styles['cyan']]: color === 'cyan',
            [styles['gold']]: color === 'gold',
            [styles['blue']]: color === 'blue',
        },

        className
    )
    return (
        <>
            <USWDSTag className={tagClasses}>{children}</USWDSTag>
        </>
    )
}
