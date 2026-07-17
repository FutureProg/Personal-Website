import { useRef, type PropsWithChildren } from 'react';
import { useDialogController } from '../hooks/useDialogController';
import styles from './NavDrawer.module.css';

export interface NavDrawerProps extends PropsWithChildren {
    open: boolean;
    onClose: () => void;
    label: string;
}

export const NavDrawer = ({ open, onClose, label, children }: NavDrawerProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    useDialogController(dialogRef, open);

    return (
        <dialog ref={dialogRef} className={styles.dialog} closedby="any" aria-label={label} onClose={onClose}>
            <div className={styles.header}>
                <button
                    type="button"
                    className={styles.closeButton}
                    aria-label="Close"
                    onClick={() => dialogRef.current?.close()}
                >
                    ✕
                </button>
            </div>
            <div
                className={styles.content}
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest('a')) dialogRef.current?.close();
                }}
            >
                {children}
            </div>
        </dialog>
    );
};
