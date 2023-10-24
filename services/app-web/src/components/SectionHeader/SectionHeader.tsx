import { Link } from '@trussworks/react-uswds'
import { NavLink } from 'react-router-dom'
import styles from './SectionHeader.module.scss'

export type SectionHeaderProps = {
    header: string
    navigateTo?: string
    children?: React.ReactNode
    subHeaderComponent?: React.ReactNode
    sectionId?: string
    headerId?: string
    hideBorder?: boolean
}

export const SectionHeader = ({
    header,
    subHeaderComponent,
    navigateTo,
    children,
    sectionId,
    headerId,
    hideBorder,
}: SectionHeaderProps & JSX.IntrinsicElements['div']): React.ReactElement => {
    return (
        <div
            className={`${styles.summarySectionHeader} ${
                !hideBorder ? styles.summarySectionHeaderBorder : ''
            } ${subHeaderComponent ? styles.alignTop : ''}`}
            id={sectionId}
        >
            <div>
                <h2 id={headerId}>{header}</h2>
                {subHeaderComponent}
            </div>
            <div>
                {navigateTo && (
                    <Link
                        variant="unstyled"
                        asCustom={NavLink}
                        className="usa-button usa-button--outline"
                        to={navigateTo}
                    >
                        Edit <span className="srOnly">{header}</span>
                    </Link>
                )}
                {children}
            </div>
        </div>
    )
}
