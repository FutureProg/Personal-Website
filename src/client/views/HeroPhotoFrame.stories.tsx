import type { Meta, StoryObj } from '@storybook/react-vite';

import { HeroPhotoFrame } from './HeroPhotoFrame';

const meta = {
  title: "Views/Hero Photo Frame",
  component: HeroPhotoFrame,
} satisfies Meta<typeof HeroPhotoFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false
    }
  },
};
