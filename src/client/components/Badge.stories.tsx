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
  }
};

/** Icon passed as a string src — rendered via <img>. */
export const ImageSrc: Story = {
  args: {
    children: 'React',
    icon: ReactIcon,
  },
  play: async ({ canvas }) => {
    const img = canvas.getByAltText('');
    expect(img.tagName).toMatch(/img/i);
    const style = getComputedStyle(img);
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
    const elems = canvas.getAllByAltText('');
    expect(elems).toHaveLength(1);
    const img = elems[0]!;
    expect(img.tagName).toMatch(/img/i);
    const style = getComputedStyle(img);
    expect(parseFloat(style.height)).toBeGreaterThan(0);
  },
};

/** Both variants must render icons with identical computed styles. */
export const IconClassParity: Story = {
  render: () => (
    <div>
      String: <br/><Badge icon={ReactIcon}>Element Text</Badge><br/>
      Dom: <br/><Badge icon={<img src={ReactIcon} alt="React logo" />}>Element Text</Badge>
    </div>
  )
};

/** iconShape="circle" clips the icon into a circle. */
export const CircularIcon: Story = {
  args: {
    children: 'TypeScript',
    icon: TypescriptIcon,
    iconShape: 'circle',
  },
};
