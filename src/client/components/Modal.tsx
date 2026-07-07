import { useRef, type PropsWithChildren, type ReactNode } from 'react';
import { useDialogController } from '../hooks/useDialogController';
import styles from './Modal.module.css';

export interface ModalProps extends PropsWithChildren {
    open: boolean;
    onClose: () => void;
    label: string;
    headerActions?: ReactNode;
}

export const Modal = ({ open, onClose, label, headerActions, children }: ModalProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    useDialogController(dialogRef, open);

    return (
        <dialog ref={dialogRef} className={styles.dialog} closedby="any" aria-label={label} onClose={onClose}>
            <div className={styles.header}>
                {headerActions}
                <button
                    type="button"
                    className={styles.closeButton}
                    aria-label="Close"
                    onClick={() => dialogRef.current?.close()}
                >
                    ✕
                </button>
            </div>
            <div className={styles.content}>{children}</div>
        </dialog>
    );
};
