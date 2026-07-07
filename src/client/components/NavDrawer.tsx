import { useEffect, useRef, type PropsWithChildren } from 'react';
import styles from './NavDrawer.module.css';

export interface NavDrawerProps extends PropsWithChildren {
    open: boolean;
    onClose: () => void;
    label: string;
}

export const NavDrawer = ({ open, onClose, label, children }: NavDrawerProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    useEffect(() => {
        // `closedby="any"` (light-dismiss on backdrop click) isn't supported in Safari yet.
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/closedBy
        const dialog = dialogRef.current;
        if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;

        const onBackdropClick = (e: MouseEvent) => {
            if (e.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            const withinContent =
                rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
            if (!withinContent) dialog.close();
        };
        dialog.addEventListener('click', onBackdropClick);
        return () => dialog.removeEventListener('click', onBackdropClick);
    }, []);

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
            <div className={styles.content}>{children}</div>
        </dialog>
    );
};
