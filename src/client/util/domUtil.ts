export function calcClassNames(varClasses: Record<string, unknown>, baseClass?: string) {
    let cssClass = baseClass ?? '';
    for(const key of Object.keys(varClasses)) {        
        if (varClasses[key]) {
            cssClass += ` ${key}`;
        }
    }
    return cssClass ?? '';
}