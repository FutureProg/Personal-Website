import { cloneElement, isValidElement } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import styles from './Badge.module.css';
import { calcClassNames } from "../util/domUtil";

type BadgeProps = {    
    /**
     * When providing a react image node, any alt text provided will be removed as any images 
     * should be purely decorative
     */
    icon?: string | ReactNode;
    iconShape?: 'circle';
} & PropsWithChildren;

export const Badge = (props: BadgeProps) => {
    let icon;        
    if (props.icon) {
        const className = calcClassNames({
            [styles.circular]: props.iconShape === 'circle'
        }, styles.icon);
        icon = typeof props.icon === 'string'
            ? <img className={className} src={props.icon} alt="" />
            : isValidElement(props.icon)
                ? cloneElement(props.icon, { className, alt: '' } as object)
                : props.icon;
    }
    return (
        <div className={styles.view}>
            {icon}
            <div>{props.children}</div>       
        </div>
    )
}