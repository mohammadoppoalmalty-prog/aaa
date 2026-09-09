import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

/**
 * The state matrix is this component's contract (STANDARDS §3). Every applicable
 * state has a story, because a component without all of them does not merit a
 * version — and because these are the states that are never exercised by hand.
 */
const meta = {
  title: 'Ember/Button',
  component: Button,
  parameters: {
    maturity: 'stable',
    docs: {
      description: {
        component:
          'Disabled is `aria-disabled` and stays focusable, so a keyboard user can reach it and read why. ' +
          'Loading locks the measured label width before swapping in the spinner, so the layout never jumps.',
      },
    },
  },
  args: { children: 'Enter the world' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <Button {...args} variant="primary">Enter the world</Button>
      <Button {...args} variant="ghost">I have five minutes</Button>
      <Button {...args} variant="quiet">Not now</Button>
    </div>
  ),
};

export const Hover: Story = {
  parameters: { pseudo: { hover: true } },
  args: { children: 'Hover is never the only affordance' },
};

export const FocusVisible: Story = {
  args: { children: 'Tab to me' },
  parameters: {
    docs: { description: { story: 'Focus is drawn for `:focus-visible` only — a mouse click must not draw a ring.' } },
  },
};

export const Pressed: Story = {
  args: { children: 'Pressed', className: undefined },
  parameters: { pseudo: { active: true } },
};

export const Disabled: Story = {
  args: {
    children: 'Continue',
    isDisabled: true,
    disabledReason: 'No save found on this device yet.',
  },
};

export const Loading: Story = {
  args: { children: 'Reveal everything', isLoading: true, loadingLabel: 'Opening the Codex…' },
};

export const Selected: Story = {
  args: { children: 'High', isSelected: true },
};

/** Torture story: 200 characters in the label slot, per STANDARDS 3.8. */
export const LongLabel: Story = {
  args: {
    children:
      'Open the entire Codex including every recovered memory, every project, every failure written down beside it, and the contact address at the bottom of the page, without walking a single metre of the world',
  },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}><Story /></div>],
};

export const Arabic: Story = {
  globals: { direction: 'rtl' },
  args: { children: 'ادخل إلى العالم' },
};
