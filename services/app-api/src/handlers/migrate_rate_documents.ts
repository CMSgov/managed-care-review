import { Handler } from 'aws-lambda'
import { configurePostgres } from './configuration'
import { NewPostgresStore } from '../postgres/postgresStore'
import { HealthPlanRevisionTable } from '@prisma/client'
import { HealthPlanFormDataType } from '../../../app-web/src/common-code/healthPlanFormDataType'
import { toDomain } from '../../../app-web/src/common-code/proto/healthPlanFormDataProto'
import { isStoreError, StoreError } from '../postgres/storeError'
import { Store } from '../postgres'

export const processRevisions = async (
    store: Store,
    revisions: HealthPlanRevisionTable[]
): Promise<void> => {
    for (const revision of revisions) {
        const pkgID = revision.pkgID
        const decodedFormDataProto = toDomain(revision.formDataProto)
        if (!(decodedFormDataProto instanceof Error)) {
            const formData = decodedFormDataProto as HealthPlanFormDataType
            // skip the submission with two rates
            if (formData.id !== 'ddd5dde1-0082-4398-90fe-89fc1bc148df') {
                // we know the other submissions have only a single rate document
                const ratesRelatedDocument = formData.documents.filter((doc) =>
                    doc.documentCategories.includes('RATES_RELATED')
                )
                formData.rateInfos[0].supportingDocuments = ratesRelatedDocument
                formData.documents = formData.documents.filter(
                    (doc) => !ratesRelatedDocument.includes(doc)
                )
            } else {
                const firstRateRelatedDocument = formData.documents.filter(
                    (doc) =>
                        doc.name ===
                        'Report12 - SFY 2022 Preliminary MississippiCAN Capitation Rates - Exhibits.xlsx'
                )
                const secondRateRelatedDocument = formData.documents.filter(
                    (doc) =>
                        doc.name ===
                        'Report13 - SFY 2023 Preliminary MississippiCAN Capitation Rates - Exhibits.xlsx'
                )
                formData.rateInfos[0].supportingDocuments =
                    firstRateRelatedDocument
                formData.rateInfos[1].supportingDocuments =
                    secondRateRelatedDocument
                formData.documents = formData.documents.filter(
                    (doc) =>
                        !firstRateRelatedDocument.includes(doc) &&
                        !secondRateRelatedDocument.includes(doc)
                )
            }
            try {
                const update = await store.updateHealthPlanRevision(
                    pkgID,
                    revision.id,
                    formData
                )
                if (isStoreError(update)) {
                    console.error(
                        `StoreError updating revision ${
                            revision.id
                        }: ${JSON.stringify(update)}`
                    )
                    throw new Error('Error updating revision')
                }
            } catch (err) {
                console.error(`Error updating revision ${revision.id}: ${err}`)
                throw err
            }
        } else {
            console.error(
                `Error decoding formDataProto for revision ${revision.id} in sha migration: ${decodedFormDataProto}`
            )
            throw new Error('Error decoding formDataProto in sha migration')
        }
    }
}

export const getDatabaseConnection = async (): Promise<Store> => {
    const dbURL = process.env.DATABASE_URL
    const secretsManagerSecret = process.env.SECRETS_MANAGER_SECRET

    if (!dbURL) {
        console.error('DATABASE_URL not set')
        throw new Error('Init Error: DATABASE_URL is required to run app-api')
    }
    if (!secretsManagerSecret) {
        console.error('SECRETS_MANAGER_SECRET not set')
    }

    const pgResult = await configurePostgres(dbURL, secretsManagerSecret)
    if (pgResult instanceof Error) {
        console.error(
            "Init Error: Postgres couldn't be configured in data exporter"
        )
        throw pgResult
    } else {
        console.info('Postgres configured in data exporter')
    }
    const store = NewPostgresStore(pgResult)

    return store
}

export const getRevisions = async (
    store: Store
): Promise<HealthPlanRevisionTable[]> => {
    const result: HealthPlanRevisionTable[] | StoreError =
        await store.findAllRevisions()
    if (isStoreError(result)) {
        console.error(`Error getting revisions from db ${result}`)
        throw new Error('Error getting records; cannot generate report')
    }

    return result
}

export const main: Handler = async (event, context) => {
    const store = await getDatabaseConnection()

    const revisions = await getRevisions(store)

    // Get the pkgID from the first revision in the list
    const pkgID = revisions[0].pkgID
    if (!pkgID) {
        console.error('Package ID is missing in the revisions')
        throw new Error('Package ID is required')
    }

    await processRevisions(store, revisions)

    console.info('rate document migration complete')
}
