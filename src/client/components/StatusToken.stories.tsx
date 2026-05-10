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
            options: ['online', 'offline'],
        },
    },
} satisfies Meta<typeof StatusToken>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {
    args: {
        status: 'online',
    },
};

export const Offline: Story = {
    args: {
        status: 'offline',
    },
};

export const Error: Story = {
    args: {
        status: 'error',
    },
};