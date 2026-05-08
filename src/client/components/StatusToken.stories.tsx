import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatusToken } from './StatusToken';

const meta = {
    title: 'Components/Status Token',
    component: StatusToken,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        status: {
            control: 'select',
            options: ['live', 'offline'],
        },
    },
} satisfies Meta<typeof StatusToken>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {
    args: {
        status: 'live',
    },
};

export const Offline: Story = {
    args: {
        status: 'offline',
    },
};
