import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

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
            options: ['online', 'offline', 'error'],
        },
    },
} satisfies Meta<typeof StatusToken>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {
    args: {
        status: 'online',
    },
    play: async ({ canvas }) => {
        expect(canvas.getByText('ONLINE')).toBeInTheDocument();
    },
};

export const Offline: Story = {
    args: {
        status: 'offline',
    },
    play: async ({ canvas }) => {
        expect(canvas.getByText('OFFLINE')).toBeInTheDocument();
    },
};

export const Error: Story = {
    args: {
        status: 'error',
    },
    play: async ({ canvas }) => {
        expect(canvas.getByText('ERROR')).toBeInTheDocument();
    },
};
