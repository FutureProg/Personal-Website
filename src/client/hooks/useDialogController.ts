import { useEffect, type RefObject } from 'react';

export const useDialogController = (dialogRef: RefObject<HTMLDialogElement | null>, open: boolean) => {
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [dialogRef, open]);

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
    }, [dialogRef]);
};
