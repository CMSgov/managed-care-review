import path from 'path'
import { NewClamAV } from './clamAV'
import { mkdtemp, rm, readdir } from 'fs/promises'
import { NewTestS3UploadsClient } from './s3'
import { scanFiles } from './scanFiles'

describe('scanFiles', () => {
    it('will scan a set of files', async () => {
        console.info('OUR FILESNEM', __dirname)
        const thisDir = __dirname

        const tmpDefsDir = await mkdtemp('/tmp/clamscan-')

        const s3Client = NewTestS3UploadsClient()

        const clamAV = NewClamAV(
            {
                bucketName: 'test-av-definitions',
                definitionsPath: 'lambda/s3-antivirus/av-definitions',

                pathToClamav: '/usr/local/clamav/bin/clamscan',
                pathToFreshclam: '/usr/local/clamav/bin/freshclam',
                pathToConfig: path.join(thisDir, 'testData', 'freshclam.conf'),
                pathToDefintions: tmpDefsDir,
            },
            s3Client
        )

        // upload test objects to s3
        const testFilesToScanPath = path.join(thisDir, 'clamAV', 'testData')
        const testFilesToScan = await readdir(testFilesToScanPath)

        const testKeys = []
        for (const testFile of testFilesToScan) {
            const testKey = path.join('allusers', testFile)
            const testPath = path.join(testFilesToScanPath, testFile)
            const res = await s3Client.uploadObject(
                testKey,
                'test-uploads',
                testPath
            )
            testKeys.push(testKey)
            if (res) {
                throw res
            }
        }

        const tmpScanDir = await mkdtemp('/tmp/scanFiles-')

        // TEST
        const scannedFiles = await scanFiles(
            s3Client,
            clamAV,
            testKeys,
            'test-uploads',
            tmpScanDir
        )
        if (scannedFiles instanceof Error) {
            throw scannedFiles
        }

        expect(scannedFiles).toHaveLength(2)
        expect(scannedFiles).toContain('allusers/badList.csv')
        expect(scannedFiles).toContain('allusers/badDummy.pdf')

        await rm(tmpDefsDir, { force: true, recursive: true })
        await rm(tmpScanDir, { force: true, recursive: true })
    })

    it('will return an empty array for clean files', async () => {
        console.info('OUR FILESNEM', __dirname)
        const thisDir = __dirname

        const tmpDefsDir = await mkdtemp('/tmp/clamscan-')

        const s3Client = NewTestS3UploadsClient()

        const clamAV = NewClamAV(
            {
                bucketName: 'test-av-definitions',
                definitionsPath: 'lambda/s3-antivirus/av-definitions',

                pathToClamav: '/usr/local/clamav/bin/clamscan',
                pathToFreshclam: '/usr/local/clamav/bin/freshclam',
                pathToConfig: path.join(thisDir, 'testData', 'freshclam.conf'),
                pathToDefintions: tmpDefsDir,
            },
            s3Client
        )

        // upload test objects to s3
        const testFilesToScanPath = path.join(thisDir, 'clamAV', 'testData')
        const allTestFiles = await readdir(testFilesToScanPath)
        const testFilesToScan = allTestFiles.filter(
            (name) => !name.startsWith('bad')
        )

        const testKeys = []
        for (const testFile of testFilesToScan) {
            const testKey = path.join('allusers', testFile)
            const testPath = path.join(testFilesToScanPath, testFile)
            const res = await s3Client.uploadObject(
                testKey,
                'test-uploads',
                testPath
            )
            testKeys.push(testKey)
            if (res) {
                throw res
            }
        }

        const tmpScanDir = await mkdtemp('/tmp/scanFiles-')

        // TEST
        const scannedFiles = await scanFiles(
            s3Client,
            clamAV,
            testKeys,
            'test-uploads',
            tmpScanDir
        )
        if (scannedFiles instanceof Error) {
            throw scannedFiles
        }

        expect(scannedFiles).toEqual([])

        await rm(tmpDefsDir, { force: true, recursive: true })
        await rm(tmpScanDir, { force: true, recursive: true })
    })
})
