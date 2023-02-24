import * as React from 'react'
import { isS3Error } from '../s3'
import { S3FileData } from '../components'
import type { S3ClientT } from '../s3'
import { BucketShortName } from '../s3/s3Amplify'

type S3ContextT = {
    handleUploadFile: (
        file: File,
        bucket: BucketShortName
    ) => Promise<S3FileData>
    handleScanFile: (
        key: string,
        bucket: BucketShortName
    ) => Promise<void | Error>
    handleDeleteFile: (key: string, bucket: BucketShortName) => Promise<void>
} & S3ClientT

const S3Context = React.createContext<S3ClientT| undefined>(undefined)

export type S3ProviderProps = {
    client: S3ClientT
    children: React.ReactNode
}

function S3Provider({ client, children }: S3ProviderProps): React.ReactElement {
    return <S3Context.Provider value={client} children={children} />
}

const useS3 = (): S3ContextT => {
    const context = React.useContext(S3Context)
    if (context === undefined) {
        throw new Error('useS3 can only be used within an S3Provider')
    }


    const { deleteFile, uploadFile, scanFile, getS3URL } = context


    const handleUploadFile = async (
        file: File,
        bucket: BucketShortName
    ): Promise<S3FileData> => {
        const s3Key = await uploadFile(file, bucket)

        if (isS3Error(s3Key)) {
            throw new Error(`Error in S3: ${file.name}`)
        }

        const s3URL = await getS3URL(s3Key, file.name, bucket)
        return { key: s3Key, s3URL: s3URL }
    }

    const handleScanFile = async (
        key: string,
        bucket: BucketShortName
    ): Promise<void | Error> => {
        try {
            await scanFile(key, bucket)
        } catch (e) {
            if (isS3Error(e)) {
                throw new Error(`Error in S3: ${key}`)
            }
            throw new Error('Scanning error: Scanning retry timed out')
        }
    }
    // We often don't want to actually delete a resource from s3 and that's what permanentFileKeys is for
    // e.g. document files that also exist on already submitted packages are part of permanent record, even if deleted on a later revision 
    const handleDeleteFile = async (key: string, bucket: BucketShortName, permanentFileKeys?: string[]) => {
        const shouldPreserveFile =
            permanentFileKeys &&
            Boolean(permanentFileKeys.some((testFileKey) => testFileKey === key))

        if (!shouldPreserveFile) {
            const result = await deleteFile(key, bucket)
            if (isS3Error(result)) {
                throw new Error(`Error in S3 key: ${key}`)
            }
        }
    return
    }

    return {...context, handleUploadFile, handleScanFile, handleDeleteFile}
}

export { S3Provider, useS3 }
