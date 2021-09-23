import { ReactComponent as FlIcon } from '../../assets/icons/fl-icon.svg'
import { ReactComponent as InIcon } from '../../assets/icons/in-icon.svg'
import { ReactComponent as MsIcon } from '../../assets/icons/ms-icon.svg'
import { ReactComponent as VaIcon } from '../../assets/icons/va-icon.svg'
import { ReactComponent as MnIcon } from '../../assets/icons/mn-icon.svg'
import { ReactComponent as AsIcon } from '../../assets/icons/as-icon.svg'
import { ReactComponent as AkIcon } from '../../assets/icons/ak-icon.svg'

export type StateIconProps = {
    code: 'FL' | 'IN' | 'MN' | 'MS' | 'VA' | 'AS' | 'AK'
}
export const StateIcon = ({ code }: StateIconProps): React.ReactElement => {
    switch (code) {
        case 'FL':
            return <FlIcon />
        case 'IN':
            return <InIcon />
        case 'MN':
            return <MnIcon />
        case 'MS':
            return <MsIcon />
        case 'VA':
            return <VaIcon />
        case 'AS':
            return <AsIcon />
        case 'AK':
            return <AkIcon />
        default:
            return <span>STATE UNKNOWN</span>
    }
}
