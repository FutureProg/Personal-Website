import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    icon: ReactNode;
    label: string;
}

export const IconButton = ({ icon, label, className, ...rest }: IconButtonProps) => {
    const classes = [styles.view, className].filter(Boolean).join(' ');

    return (
        <button type="button" aria-label={label} className={classes} {...rest}>
            {icon}
        </button>
    );
};
