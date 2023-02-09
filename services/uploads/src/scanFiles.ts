import path from 'path';
import crypto from 'crypto'
import { ClamAV } from "./clamAV";
import { S3UploadsClient } from "./s3";

// returns a list of aws keys that are infected
async function scanFiles(s3Client: S3UploadsClient, clamAV: ClamAV, keys: string[], bucket: string, scanDir: string): Promise<string[] | Error> {

    // fetch definition files
    console.info('Download AV Definitions')
    const defsRes = await clamAV.downloadAVDefinitions()
    if (defsRes) {
        console.error('failed to fetch definitions')
        return defsRes
    }


    // clamScan wants files to be top level in the scanned directory, so we map each key to a UUID
    const filemap: { [filename: string]: string } = {}
    for (const key of keys) {
        console.info('Downloading file to be scanned', key)
        const scanFileName = `${crypto.randomUUID()}.tmp`
        const scanFilePath = path.join(scanDir, scanFileName)

        filemap[scanFileName] = key

        const err = await s3Client.downloadFileFromS3(key, bucket, scanFilePath)
        if (err instanceof Error) {
            console.error('failed to download one of the scan files', err)
            return err
        }
    }

    console.info('Scanning Files')
    const res = clamAV.scanForInfectedFiles(scanDir);
    console.info('VIRUSES SCANNED', res)

    if (res instanceof Error) {
        return res
    }

    return res.map((filename) => filemap[filename])

}

export {
    scanFiles,
}
