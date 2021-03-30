import {
    attribute,
    hashKey,
    table,
} from '@aws/dynamodb-data-mapper-annotations'

import { SubmissionType } from '../../app-web/src/common-code/domain-models'

// Data mapper annotations are meant to go on your domain models, and we might use them that way at some point
// but for now, especially since we probably want to rip out all the dynamodb stuf eventually anyway, we're going to keep
// the dynamodb specific stuff inside the store package
@table('wml-fix-502-draft-submissions')
export class DraftSubmissionStoreType {
    @hashKey()
    id: string

    @attribute()
    submissionDescription: string

    @attribute()
    submissionType: SubmissionType

    @attribute()
    createdAt: Date

    @attribute()
    programID: string

    @attribute({
        indexKeyConfigurations: {
            StateStateNumberIndex: 'HASH',
        },
    })
    stateCode: string

    @attribute({
        indexKeyConfigurations: {
            StateStateNumberIndex: 'RANGE',
        },
    })
    stateNumber: number

    constructor() {
        this.id = ''
        this.submissionDescription = ''
        this.submissionType = 'CONTRACT_ONLY'
        this.createdAt = new Date()
        this.stateCode = ''
        this.programID = ''
        this.stateNumber = -1
    }
}
