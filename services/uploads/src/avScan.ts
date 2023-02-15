import { Context, S3Event } from 'aws-lambda'
import { NewS3UploadsClient, S3UploadsClient } from './s3'

import { NewClamAV, ClamAV } from './clamAV'
import { generateVirusScanTagSet, ScanStatus } from './tags'
import { scanFiles } from './scanFiles'

async function avScanLambda(event: S3Event, _context: Context) {
    console.info('-----Start Antivirus Lambda function-----')

    // Check on the values for our required config
    const clamAVBucketName = process.env.CLAMAV_BUCKET_NAME
    if (!clamAVBucketName || clamAVBucketName === '') {
        throw new Error('Configuration Error: CLAMAV_BUCKET_NAME must be set')
    }

    const clamAVDefintionsPath = process.env.PATH_TO_AV_DEFINITIONS
    if (!clamAVDefintionsPath || clamAVDefintionsPath === '') {
        throw new Error(
            'Configuration Error: PATH_TO_AV_DEFINITIONS must be set'
        )
    }

    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '314572800')

    const s3Client = NewS3UploadsClient()

    const clamAV = NewClamAV(
        {
            bucketName: clamAVBucketName,
            definitionsPath: clamAVDefintionsPath,
        },
        s3Client
    )

    const record = event.Records[0]
    if (!record) {
        throw new Error('no record in request')
    }

    const s3ObjectKey = record.s3.object.key
    const s3ObjectBucket = record.s3.bucket.name

    console.info('Scanning ', s3ObjectKey, s3ObjectBucket)
    const err = await scanFile(
        s3Client,
        clamAV,
        s3ObjectKey,
        s3ObjectBucket,
        maxFileSize,
        '/tmp/downloads'
    )
    if (err) {
        throw err
    }

    return 'FILE SCANNED'
}

async function scanFile(
    s3Client: S3UploadsClient,
    clamAV: ClamAV,
    key: string,
    bucket: string,
    maxFileSize: number,
    scanDir: string
): Promise<undefined | Error> {
    //You need to verify that you are not getting too large a file
    //currently lambdas max out at 500MB storage.
    const fileSize = await s3Client.sizeOf(key, bucket)
    if (fileSize instanceof Error) {
        if (fileSize.name === 'NotFound') {
            console.error('Object not found with Key: ', key)
        }
        return fileSize
    }

    let tagResult: ScanStatus | undefined = undefined
    if (fileSize > maxFileSize) {
        console.warn('S3 File is too big. Size: ', fileSize)
        // tag with skipped.
        tagResult = 'SKIPPED'
    } else {
        const infectedFiles = await scanFiles(
            s3Client,
            clamAV,
            [key],
            bucket,
            scanDir
        )

        if (infectedFiles instanceof Error) {
            tagResult = 'ERROR'
        } else {
            if (infectedFiles.length === 0) {
                tagResult = 'CLEAN'
            } else {
                tagResult = 'INFECTED'
            }
        }
    }

    const tags = generateVirusScanTagSet(tagResult)
    const err = await s3Client.tagObject(key, bucket, tags)
    if (err instanceof Error) {
        console.error('Failed to tag object', err)
        return err
    }

    console.info('Tagged object ', tagResult)
}

export { avScanLambda, scanFile }
