import * as React from 'react'
import { isS3Error } from '../s3'
import { S3FileData } from '../components'
import type { S3ClientT } from '../s3'
import { BucketShortName } from '../s3/s3Amplify'
import { recordJSException } from '../otelHelpers'
import { useAuth } from './AuthContext'

type S3ContextT = {
    handleUploadFile: (
        file: File,
        bucket: BucketShortName
    ) => Promise<S3FileData>
    handleScanFile: (
        key: string,
        bucket: BucketShortName
    ) => Promise<void | Error>
} & S3ClientT

const S3Context = React.createContext<S3ClientT | undefined>(undefined)

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
        const error = new Error('useS3 can only be used within an S3Provider')
        recordJSException(error)
        throw error
    }

    const { uploadFile, scanFile, getS3URL } = context
    const { checkAuth, logout } = useAuth()

    const handleUploadFile = async (
        file: File,
        bucket: BucketShortName
    ): Promise<S3FileData> => {
        try {
            const s3Key = await uploadFile(file, bucket)

            if (isS3Error(s3Key)) {
                const error = new Error(`Error in S3: ${file.name}`)
                recordJSException(error)
                // s3 file upload failing could be due to IDM session timeout
                // double check the user still has their session, if not, logout to update the React state with their login status
                const responseCheckAuth = await checkAuth()
                if (responseCheckAuth instanceof Error) {
                    await logout({ type: 'TIMEOUT' })
                }
                throw error
            }
            const s3URL = await getS3URL(s3Key, file.name, bucket)
            return { key: s3Key, s3URL: s3URL }
        } catch (err) {
            console.error(`uploadFile error ${err}`)
            throw err
        }
    }

    const handleScanFile = async (
        key: string,
        bucket: BucketShortName
    ): Promise<void | Error> => {
        try {
            const s3Key = await scanFile(key, bucket)
            if (isS3Error(s3Key)) {
                const error = Error(`Error in S3: ${key}`)
                recordJSException(error)

                // s3 file upload failing could be due to IDM session timeout
                // double check the user still has their session, if not, logout to update the React state with their login status
                const responseCheckAuth = await checkAuth()
                if (responseCheckAuth instanceof Error) {
                    await logout({ type: 'TIMEOUT' })
                }
                return error
            }
        } catch (e) {
            const error = new Error(`handleScanFile error: ${e}`)
            console.error(error)
            throw error
        }
    }

    return { ...context, handleUploadFile, handleScanFile }
}

export { S3Provider, useS3 }
