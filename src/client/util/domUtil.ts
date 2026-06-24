export function calcClassNames(varClasses: Record<string, boolean>, baseClass?: string) {
    let cssClass = baseClass;    
    for(let key in varClasses) {        
        if (varClasses[key]) {
            cssClass += ` ${key}`;
        }
    }
    return cssClass ?? '';
}