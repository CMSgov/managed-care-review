import React from 'react'
import {
    Button,
    ButtonGroup,
    Modal as UswdsModal,
    ModalFooter,
    ModalHeading,
    ModalRef,
    ModalProps as UswdsModalProps,
    ModalToggleButton,
} from '@trussworks/react-uswds'
import styles from './Modal.module.scss'

interface ModalComponentProps {
    id: string
    modalHeading?: string
    onSubmit?: React.MouseEventHandler<HTMLButtonElement> | undefined
    onCancel?: () => void
    onSubmitText?: string
    onCancelText?: string
    className?: string
    modalRef: React.RefObject<ModalRef>
    submitButtonProps?: JSX.IntrinsicElements['button']
}

export type ModalProps = ModalComponentProps & UswdsModalProps

export const Modal = ({
    id,
    children,
    modalHeading,
    onSubmit,
    onCancel,
    className,
    modalRef,
    submitButtonProps,
    onSubmitText,
    onCancelText,
    ...divProps
}: ModalProps): React.ReactElement => {
    const cancelHandler = (e: React.MouseEvent): void => {
        if (onCancel) {
            onCancel()
        }
        modalRef.current?.toggleModal(undefined, false)
    }

    return (
        <UswdsModal
            aria-labelledby={`${id}-heading`}
            aria-describedby={`${id}-description`}
            {...divProps}
            id={id}
            ref={modalRef}
            className={`${styles.modal} ${className}`}
        >
            {modalHeading && (
                <ModalHeading id={`${id}-heading`}>{modalHeading}</ModalHeading>
            )}
            <div id={`${id}-modal-description`}>{children}</div>
            <ModalFooter>
                <ButtonGroup className="float-right">
                    {/* <ModalToggleButton
                        data-testid={`${id}-modal-cancel`}
                        modalRef={modalRef}
                        id={`${id}-closer`}
                        closer
                        outline
                    >
                        {onCancelText || 'Cancel'}
                    </ModalToggleButton> */}
                    <Button
                        type="button"
                        aria-label={`${onCancelText || 'Cancel'}`}
                        data-testid={`${id}-modal-cancel`}
                        id={`${id}-cancel`}
                        onClick={cancelHandler}
                        outline
                    >
                        {onCancelText || 'Cancel'}
                    </Button>
                    <Button
                        type="button"
                        aria-label={`${onSubmitText || 'Submit'}`}
                        data-testid={`${id}-modal-submit`}
                        id={`${id}-submit`}
                        onClick={onSubmit}
                        {...submitButtonProps}
                    >
                        {onSubmitText || 'Submit'}
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </UswdsModal>
    )
}
