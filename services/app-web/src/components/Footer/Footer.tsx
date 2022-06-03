import React from 'react'

import medicaidLogo from '../../assets/images/medicaidgovlogo.png'
import { ReactComponent as HHSIcon } from '../../assets/icons/depthealthhumanservices_usa.svg'
import styles from './Footer.module.scss'
import { Logo } from '../Logo'
import { GridContainer, Grid } from '@trussworks/react-uswds'

/**
 * CMS Footer
 */
export const Footer = (): React.ReactElement => {
    return (
        <footer>
            <div className={styles.logosRow}>
                <GridContainer>
                    <Grid row className="flex-justify flex-align-center">
                        <div className={styles.cmsLogos}>
                            <Logo
                                src={medicaidLogo}
                                alt="Medicaid.gov-Keeping America Healthy"
                            />
                        </div>
                        <span className={styles.federalLogos}>
                            <HHSIcon title="Federal government website" />
                            <span>
                                A federal government website managed and paid
                                for by the U.S. Centers for Medicare and
                                Medicaid Services and part of the MACPro suite.
                            </span>
                        </span>
                    </Grid>
                </GridContainer>
            </div>
            <div className={styles.contactRow}>
                <GridContainer>
                    <Grid row className="flex-justify flex-align-center">
                        <span>
                            Email&nbsp;  
                            <a href="mailto: mc-review@cms.hhs.gov" className="usa-link">mc-review@cms.hhs.gov</a>
                            &nbsp;to get help or send feedback
                        </span>
                        <span>7500 Security Boulevard Baltimore, MD 21244</span>
                    </Grid>
                </GridContainer>
            </div>
        </footer>
    )
}
