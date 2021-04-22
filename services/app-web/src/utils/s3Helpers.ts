import { S3ClientT } from '../s3'

export const testS3Client: S3ClientT = {
    uploadFile: async (file: File): Promise<string> => {
        return `${Date.now()}-${file.name}`
    },
    getURL: async (s3key: string): Promise<string> => {
        return `https://fakes3.com/${s3key}?sekret=deadbeef`
    },
}
