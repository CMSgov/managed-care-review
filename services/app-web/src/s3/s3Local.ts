import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { parseKey } from '../common-code/s3URLEncoding'
import { S3ClientT } from './s3Client'
import type { S3Error } from './s3Error'

export function newLocalS3Client(
    endpoint: string,
    bucketName: string
): S3ClientT {
    const s3Client = new S3Client({
        forcePathStyle: true,
        apiVersion: '2006-03-01',
        credentials: {
            accessKeyId: 'S3RVER', // This specific key is required when working offline
            secretAccessKey: 'S3RVER', // pragma: allowlist secret; pre-set by serverless-s3-offline
        },
        endpoint: endpoint,
        region: 'us-east', // This region cannot be undefined and any string here will work.
    })

    return {
        uploadFile: async (file: File): Promise<string | S3Error> => {
            const filename = `${Date.now()}-${file.name}`
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: filename,
                Body: file,
            })

            try {
                if (file.name === 'upload_error.pdf') {
                    const err: S3Error = {
                        code: 'NETWORK_ERROR',
                        message: 'Network error',
                    }
                    throw err
                }
                await s3Client.send(command)

                return filename
            } catch (err) {
                if (err.code === 'NetworkingError') {
                    return {
                        code: 'NETWORK_ERROR',
                        message: 'Error saving file to the cloud.',
                    }
                }

                console.log('Log: Unexpected Error putting file to S3', err)
                return err
            }
        },

        deleteFile: async (s3Key: string): Promise<void | S3Error> => {
            const command = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
            })
            try {
                await s3Client.send(command)

                return
            } catch (err) {
                if (err.code === 'NetworkingError') {
                    return {
                        code: 'NETWORK_ERROR',
                        message: 'Error saving file to the cloud.',
                    }
                }

                console.log('Log: Unexpected Error deleting file on S3', err)
                return err
            }
        },
        scanFile: async (s3Key: string): Promise<void | S3Error> => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve()
                }, 1000)
            })
        },
        getKey: (s3URL: string) => {
            const key = parseKey(s3URL)
            return key instanceof Error ? null : key
        },
        getS3URL: async (s3key: string, filename: string): Promise<string> => {
            // ignore what's passed in as the bucket and use whats in LocalS3Client
            return `s3://${bucketName}/${s3key}/${filename}`
        },
        getURL: async (s3key: string): Promise<string> => {
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: s3key,
            })
            // Create the presigned URL.
            const signedUrl = await getSignedUrl(s3Client, command)
            return signedUrl
        },
        getBulkDlURL: async (
            keys: string[],
            filename: string
        ): Promise<string | Error> => {
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: filename,
            })
            const signedUrl = await getSignedUrl(s3Client, command)
            return signedUrl
        },
    }
}
