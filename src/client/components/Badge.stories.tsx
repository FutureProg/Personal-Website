import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
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
    icon: TypescriptIcon,
  }
};

/** Icon passed as a string src — rendered via <img>. */
export const ImageSrc: Story = {
  args: {
    children: 'React',
    icon: ReactIcon,
  },
  play: async ({ canvas }) => {
    const img = canvas.getByRole('img');
    const style = getComputedStyle(img);
    expect(style.display).toBe('inline-block');
    expect(parseFloat(style.height)).toBeGreaterThan(0);
  },
};

/** Icon passed as a ReactElement — class is merged via cloneElement. */
export const DomElement: Story = {
  args: {
    children: 'React',
    icon: <img src={ReactIcon} alt="React logo" />,
  },
  play: async ({ canvas }) => {
    const img = canvas.getByRole('img');
    const style = getComputedStyle(img);
    expect(style.display).toBe('inline-block');
    expect(parseFloat(style.height)).toBeGreaterThan(0);
  },
};

/** Both variants must render icons with identical computed styles. */
export const IconClassParity: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Badge icon={ReactIcon}>String Src</Badge>
      <Badge icon={<img src={ReactIcon} alt="React logo" />}>DOM element</Badge>
    </div>
  ),
  play: async ({ canvas }) => {
    const [imgSrc, imgDom] = canvas.getAllByRole('img') as [HTMLElement, HTMLElement];
    const styleA = getComputedStyle(imgSrc);
    const styleB = getComputedStyle(imgDom);
    for (const prop of ['display', 'height', 'width', 'clipPath'] as const) {
      expect(styleA[prop], `${prop} should match between string-src and dom-element variants`).toBe(styleB[prop]);
    }
  },
};

/** iconShape="circle" clips the icon into a circle. */
export const CircularIcon: Story = {
  args: {
    children: 'TypeScript',
    icon: TypescriptIcon,
    iconShape: 'circle',
  },
};
