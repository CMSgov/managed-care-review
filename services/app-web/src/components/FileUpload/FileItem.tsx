import React from 'react'
import { Button } from '@trussworks/react-uswds'
import classnames from 'classnames'
import { SPACER_GIF } from './constants'

import styles from './FileUpload.module.scss'

export type FileStatus =
    | 'DUPLICATE_NAME_ERROR'
    | 'PENDING'
    | 'SCANNING'
    | 'SCANNING_ERROR'
    | 'UPLOAD_COMPLETE'
    | 'UPLOAD_ERROR'

export type FileItemT = {
    id: string
    name: string
    file?: File // only items that are not uploaded to s3 have this
    key?: string // only items uploaded to s3 have this
    s3URL?: string // only items uploaded to s3 have this
    status: FileStatus
}

const DocumentError = ({
    hasDuplicateNameError,
    hasScanningError,
    hasUploadError,
    hasUnexpectedError,
}: {
    hasDuplicateNameError: boolean
    hasScanningError: boolean
    hasUploadError: boolean
    hasUnexpectedError: boolean
}): React.ReactElement | null => {
    if (hasDuplicateNameError)
        return (
            <>
                <span className={styles.fileItemErrorMessage}>
                    Duplicate file
                </span>
                <span className={styles.fileItemErrorMessage}>
                    Please remove
                </span>
            </>
        )
    else if (hasScanningError && !hasUnexpectedError)
        return (
            <>
                <span className={styles.fileItemErrorMessage}>
                    Failed security scan, please remove
                </span>
            </>
        )
    else if (hasUploadError && !hasUnexpectedError)
        return (
            <>
                <span className={styles.fileItemErrorMessage}>
                    Upload failed
                </span>
                <span className={styles.fileItemErrorMessage}>
                    Please remove or retry
                </span>
            </>
        )
    else if (hasUnexpectedError) {
        return (
            <>
                <span className={styles.fileItemErrorMessage}>
                    Upload failed
                </span>
                <span className={styles.fileItemErrorMessage}>
                    Unexpected error. Please remove.
                </span>
            </>
        )
    } else {
        return null
    }
}

export type FileItemProps = {
    item: FileItemT
    deleteItem: (item: FileItemT) => void
    retryItem: (item: FileItemT) => void
}
export const FileItem = ({
    item,
    deleteItem,
    retryItem,
}: FileItemProps): React.ReactElement => {
    const { name, status, file } = item
    const hasDuplicateNameError = status === 'DUPLICATE_NAME_ERROR'
    const hasScanningError = status === 'SCANNING_ERROR'
    const hasUploadError = status === 'UPLOAD_ERROR'
    const hasUnexpectedError = status === 'UPLOAD_ERROR' && file === undefined
    const isLoading = status === 'PENDING'
    const isScanning = status === 'SCANNING'

    const isPDF = name.indexOf('.pdf') > 0
    const isWord = name.indexOf('.doc') > 0 || name.indexOf('.pages') > 0
    const isVideo = name.indexOf('.mov') > 0 || name.indexOf('.mp4') > 0
    const isExcel = name.indexOf('.xls') > 0 || name.indexOf('.numbers') > 0
    const isGeneric = !isPDF && !isWord && !isVideo && !isExcel

    const imageClasses = classnames('usa-file-input__preview-image', {
        'is-loading': isLoading || isScanning,
        'usa-file-input__preview-image--pdf': isPDF,
        'usa-file-input__preview-image--word': isWord,
        'usa-file-input__preview-image--video': isVideo,
        'usa-file-input__preview-image--excel': isExcel,
        'usa-file-input__preview-image--generic': isGeneric,
    })

    const handleDelete = (_e: React.MouseEvent) => {
        deleteItem(item)
    }

    const handleRetry = (_e: React.MouseEvent) => {
        retryItem(item)
    }

    return (
        <>
            <div className={styles.fileItemText}>
                <img
                    id={item.id}
                    data-testid="file-input-preview-image"
                    src={SPACER_GIF}
                    alt=""
                    className={imageClasses}
                />
                <span
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        fontSize: 'inherit',
                    }}
                >
                    <DocumentError
                        hasDuplicateNameError={hasDuplicateNameError}
                        hasScanningError={hasScanningError}
                        hasUploadError={hasUploadError}
                        hasUnexpectedError={hasUnexpectedError}
                    />
                    <span>{`${name}${
                        isLoading
                            ? ' - [loading]'
                            : isScanning
                            ? ' - [scanning]'
                            : ''
                    }`}</span>
                </span>
            </div>
            <div className={styles.fileItemButtons}>
                <Button
                    type="button"
                    size="small"
                    unstyled
                    onClick={handleDelete}
                >
                    Remove
                </Button>
                {hasUploadError && !hasUnexpectedError && (
                    <Button
                        type="button"
                        size="small"
                        unstyled
                        onClick={handleRetry}
                    >
                        Retry
                    </Button>
                )}
            </div>
        </>
    )
}
