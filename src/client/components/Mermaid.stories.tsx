import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Mermaid } from './Mermaid';

const meta = {
    title: 'Components/Mermaid',
    component: Mermaid,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Mermaid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flowchart: Story = {
    args: {
        chart: 'graph TD;\nA-->B;\nB-->C;',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => {
            expect(canvasElement.querySelector('svg')).toBeInTheDocument();
        });

        expect(canvas.getByRole('button', { name: 'Expand diagram' })).toBeInTheDocument();
    },
};

export const OpensExpandedView: Story = {
    args: {
        chart: 'graph TD;\nA-->B;\nB-->C;',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => {
            expect(canvasElement.querySelector('svg')).toBeInTheDocument();
        });

        await userEvent.click(canvas.getByRole('button', { name: 'Expand diagram' }));

        const dialog = canvas.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog.querySelector('svg')).toBeInTheDocument();
    },
};

export const ClosesExpandedView: Story = {
    args: {
        chart: 'graph TD;\nA-->B;\nB-->C;',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => {
            expect(canvasElement.querySelector('svg')).toBeInTheDocument();
        });

        await userEvent.click(canvas.getByRole('button', { name: 'Expand diagram' }));
        expect(canvas.getByRole('dialog')).toBeInTheDocument();

        await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
        expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    },
};

export const ZoomsInOnExpandedView: Story = {
    args: {
        chart: 'graph TD;\nA-->B;\nB-->C;',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => {
            expect(canvasElement.querySelector('svg')).toBeInTheDocument();
        });

        await userEvent.click(canvas.getByRole('button', { name: 'Expand diagram' }));
        const dialog = canvas.getByRole('dialog');
        const content = dialog.querySelector<HTMLElement>('.react-transform-component');
        expect(content).toBeInTheDocument();
        const initialTransform = content!.style.transform;

        await userEvent.click(canvas.getByRole('button', { name: 'Zoom in' }));

        await waitFor(() => {
            expect(content!.style.transform).not.toBe(initialTransform);
        });
    },
};

export const ExpandedViewFillsModal: Story = {
    args: {
        chart: 'graph TD;\nA-->B;\nB-->C;',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => {
            expect(canvasElement.querySelector('svg')).toBeInTheDocument();
        });

        await userEvent.click(canvas.getByRole('button', { name: 'Expand diagram' }));
        const dialog = canvas.getByRole('dialog');

        // The pan/zoom viewport (`.react-transform-wrapper`) must fill the
        // available space, not shrink-to-fit the diagram's natural size —
        // otherwise zooming in grows the content past its own clipping box
        // and the diagram appears cropped instead of panning within it.
        // Checking rendered layout size (not just the inline style string),
        // since a percentage height only resolves if every ancestor in the
        // chain has a definite height.
        const wrapper = dialog.querySelector<HTMLElement>('.react-transform-wrapper');
        expect(wrapper).toBeInTheDocument();
        const wrapperRect = wrapper!.getBoundingClientRect();
        const dialogRect = dialog.getBoundingClientRect();
        expect(wrapperRect.height).toBeGreaterThan(dialogRect.height * 0.5);
    },
};
