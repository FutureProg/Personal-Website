import { cloneElement, isValidElement } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import styles from './Badge.module.css';

type BadgeProps = {
    icon?: string | ReactNode;
    iconShape?: 'circle';
} & PropsWithChildren;

export const Badge = (props: BadgeProps) => {
    let icon;
    if (props.icon) {
        icon = typeof props.icon === 'string'
            ? <img className={styles.icon} src={props.icon} />
            : isValidElement(props.icon)
                ? cloneElement(props.icon, { className: styles.icon } as object)
                : props.icon;
    }
    return (
        <div className={styles.view}>
            {icon}
            <div>{props.children}</div>       
        </div>
    )
}