import React from 'react'
import classnames from 'classnames'
import { FileItem, FileItemT, FileStatus } from '../FileItem/FileItem'
import styles from '../FileUpload.module.scss'

export const FileItemsList = ({
    fileItems,
    deleteItem,
    retryItem,
}: {
    fileItems: FileItemT[]
    deleteItem: (id: FileItemT) => void
    retryItem: (item: FileItemT) => void
}): React.ReactElement => {
    const liClasses = (status: FileStatus): string => {
        const hasError =
            status === 'UPLOAD_ERROR' ||
            status === 'SCANNING_ERROR' ||
            status === 'DUPLICATE_NAME_ERROR'
        return classnames(styles.fileItem, {
            'bg-secondary-lighter border-secondary margin-top-1px': hasError,
            'usa-file-input__preview': !hasError,
        })
    }

    return (
        <ul
            data-testid="file-input-preview-list"
            className={styles.fileItemsList}
            id="file-items-list"
            tabIndex={-1}
        >
            {fileItems.map((item) => (
                <li
                    key={item.id}
                    id={item.id}
                    className={liClasses(item.status)}
                >
                    <FileItem
                        deleteItem={deleteItem}
                        retryItem={retryItem}
                        item={item}
                    />
                </li>
            ))}
        </ul>
    )
}
