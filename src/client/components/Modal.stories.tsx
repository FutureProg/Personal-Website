import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Modal } from './Modal';
import { IconButton } from './IconButton';

const ModalDemo = ({ label, headerActions }: { label: string; headerActions?: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    return (
        <div>
            <button type="button" onClick={() => setOpen(true)}>Open modal</button>
            <Modal open={open} onClose={() => setOpen(false)} label={label} headerActions={headerActions}>
                <p style={{ padding: 24 }}>Modal content goes here.</p>
            </Modal>
        </div>
    );
};

const meta = {
    title: 'Components/Modal',
    component: ModalDemo,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ModalDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// Escape-to-close and backdrop-click-to-close are native <dialog> behaviors
// (via closedby="any") implemented by the browser itself, not by this
// component's code. They aren't exercised here: userEvent dispatches
// synthetic (untrusted) DOM events, and browsers only run those native
// default actions for genuinely trusted input — so a real user's keypress
// works, but a simulated one in this harness can't verify it.
export const ClosedByCloseButton: Story = {
    args: {
        label: 'Example modal',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }));
        expect(canvas.getByRole('dialog', { name: 'Example modal' })).toBeInTheDocument();

        await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
        expect(canvas.queryByRole('dialog', { name: 'Example modal' })).not.toBeInTheDocument();
    },
};

export const WithHeaderActions: Story = {
    args: {
        label: 'Diagram viewer',
        headerActions: (
            <>
                <IconButton icon={<span aria-hidden>+</span>} label="Zoom in" />
                <IconButton icon={<span aria-hidden>-</span>} label="Zoom out" />
            </>
        ),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }));

        expect(canvas.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
        expect(canvas.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    },
};
