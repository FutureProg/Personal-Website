import TypescriptIcon from '../../images/ts-logo-round-128.svg';
import ReactIcon from '../../images/react-logo.svg';
import NextJSIcon from '../../images/nextjs-icon.svg';
import NodeJSIcon from '../../images/nodejs-icon.svg';
import DenoIcon from '../../images/deno-icon.svg';
import ClaudeIcon from '../../images/claude-icon.svg';
import ViteIcon from '../../images/vite-icon.svg';
import CSSIcon from '../../images/css-icon.svg';
import StorybookIcon from '../../images/storybook-icon.svg';
import AWSIcon from '../../images/aws-icon.svg';
import PostgreSQLIcon from '../../images/postgresql-icon.svg';

export default Object.entries({
    'TypeScript': TypescriptIcon,
    'React': ReactIcon,
    'NextJS': NextJSIcon,
    'NodeJS': NodeJSIcon,
    'Deno': DenoIcon,
    'Claude': ClaudeIcon,
    'Vite': ViteIcon,
    'CSS': CSSIcon,
    'Storybook': StorybookIcon,
    'AWS': AWSIcon,
    'PostgreSQL': PostgreSQLIcon,
}).map(([key, val]) => ({
    name: key,
    icon: val
}));