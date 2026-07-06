import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { IconButton } from './IconButton';
import ExpandIcon from '../images/expand-icon.svg';

const meta = {
    title: 'Components/Icon Button',
    component: IconButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        onClick: fn(),
    },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expand: Story = {
    args: {
        icon: <img src={ExpandIcon} alt="" />,
        label: 'Expand diagram',
    },
    play: async ({ canvas, args }) => {
        const button = canvas.getByRole('button', { name: 'Expand diagram' });
        expect(button).toBeInTheDocument();

        await userEvent.click(button);
        expect(args.onClick).toHaveBeenCalledOnce();
    },
};
