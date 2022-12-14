import { S3ClientT } from '../s3'
import { parseKey } from '../common-code/s3URLEncoding'

export const testS3Client: () => S3ClientT = () => {
    console.log('jj using test client')
    return {
        uploadFile: async (file: File): Promise<string> => {
            return `${Date.now()}-${file.name}`
        },
        deleteFile: async (filename: string): Promise<void> => {
            return
        },
        scanFile: async (filename: string): Promise<void> => {
            return
        },
        getKey: (s3URL: string) => {
            const key = parseKey(s3URL)
            return key instanceof Error ? null : key
        },
        getS3URL: async (s3key: string, fileName: string): Promise<string> => {
            return `s3://fake-bucket/${s3key}/${fileName}`
        },
        getURL: async (s3key: string): Promise<string> => {
            return `https://fakes3.com/${s3key}?sekret=deadbeef`
        },
        getBulkDlURL: async (
            keys: string[],
            fileName: string
        ): Promise<string> => {
            const s3Key = keys[0]
            return `https://fakes3.com/${s3Key}.zip`
        },
    }
}
