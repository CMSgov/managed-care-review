import { S3UploadsClient } from '../deps/s3'
import { ClamAV } from '../deps/clamAV'
import { generateVirusScanTagSet, ScanStatus } from './tags'
import { scanFiles } from './scanFiles'

export async function scanFile(
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
    // tagObject replaces existing tags, so we get the tags, add the new ones, and then set them all back
    const currentTagsResult = await s3Client.getObjectTags(key, bucket)
    if (currentTagsResult instanceof Error) {
        console.error('Failed to get object tags', currentTagsResult)
        return currentTagsResult
    }

    const updatedTags = { TagSet: currentTagsResult.concat(tags.TagSet) }

    const err = await s3Client.tagObject(key, bucket, updatedTags)
    if (err instanceof Error) {
        console.error('Failed to tag object', err)
        return err
    }

    console.info('Tagged object ', tagResult)
}
