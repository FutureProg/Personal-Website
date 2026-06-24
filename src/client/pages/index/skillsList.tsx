import TypescriptIcon from '../../images/ts-logo-round-128.svg';
import ReactIcon from '../../images/react-logo.svg';

export default Object.entries({
    'TypeScript': TypescriptIcon,
    'React': ReactIcon,
    'NextJS': undefined,
    'NodeJS': undefined,
    'Deno': undefined,
    'Claude': undefined,
    'Vite': undefined,
    'CSS': undefined,
    'Storybook': undefined,
    'AWS': undefined,
    'PostgreSQL': undefined,
}).map(([key, val]) => ({
    name: key,
    icon: val
}));