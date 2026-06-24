import type { Meta, StoryObj } from '@storybook/react-vite';
import TypescriptIcon from '../images/ts-logo-round-128.svg';
import ReactIcon from '../images/react-logo.svg';

import { Badge } from './Badge';

const meta = {
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'TypeScript',
    icon: ReactIcon
  }
};