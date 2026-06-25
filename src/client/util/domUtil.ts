export function calcClassNames(varClasses: Record<string, unknown>, baseClass?: string) {
    let cssClass = baseClass;    
    for(let key in varClasses) {        
        if (varClasses[key]) {
            cssClass += ` ${key}`;
        }
    }
    return cssClass ?? '';
}