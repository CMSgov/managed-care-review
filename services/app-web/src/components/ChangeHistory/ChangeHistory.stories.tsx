import { mockContractPackageSubmitted } from '../../testHelpers/apolloMocks'
import { ChangeHistory } from './ChangeHistory'

export default {
    title: 'Components/ChangeHistory',
    component: ChangeHistory,
}

const contractData = mockContractPackageSubmitted()

export const DemoListUploadSuccess = (): React.ReactElement => {
    return <ChangeHistory contract={contractData} />
}
