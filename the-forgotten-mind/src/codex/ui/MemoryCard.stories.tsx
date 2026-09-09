import type { Meta, StoryObj } from '@storybook/react';
import { MemoryCard } from './MemoryCard';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Ember/MemoryCard',
  component: MemoryCard,
  parameters: { maturity: 'experimental', layout: 'padded' },
  args: {
    id: 'm-014',
    title: 'The migration that ran for six hours',
    category: 'work',
    year: 2022,
    excerpt:
      'Moving eleven million rows without a maintenance window. The plan worked; the rollback plan is the part I actually rehearsed.',
  },
} satisfies Meta<typeof MemoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Linked: Story = { args: { href: '/codex/projects/ledger' } };

/** The state that matters most: locked, and never a dead end. */
export const Locked: Story = { args: { locked: true } };

export const Categories: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      <MemoryCard {...args} id="c1" category="work" title="Shipping under a deadline that moved twice" />
      <MemoryCard {...args} id="c2" category="learning" title="Learning Go by rewriting the wrong service" />
      <MemoryCard {...args} id="c3" category="failure" title="The cache I invalidated at the wrong layer" />
      <MemoryCard {...args} id="c4" category="people" title="The reviewer who taught me to write smaller commits" />
      <MemoryCard {...args} id="c5" category="craft" title="Why the second rewrite was shorter" />
      <MemoryCard {...args} id="c6" category="life" title="The year I stopped working weekends" />
    </div>
  ),
};

/** Torture: a title far past the server-side cap, and no excerpt at all. */
export const LongTitle: Story = {
  render: ({ excerpt: _excerpt, ...args }) => (
    <MemoryCard
      {...args}
      title="The incident review that turned into a three-week refactor of the scheduling engine, the write-up nobody asked for, and the runbook that outlived the service it documented"
    />
  ),
};

export const Arabic: Story = {
  globals: { direction: 'rtl' },
  args: {
    title: 'الترحيل الذي استغرق ست ساعات',
    excerpt: 'نقل أحد عشر مليون سجل دون نافذة صيانة. الخطة نجحت، لكن خطة التراجع هي ما تدرّبت عليه فعلاً.',
  },
};

/** The zero state this grid degrades to — the Impatience Detector's landing. */
export const NothingRecovered: StoryObj = {
  render: () => (
    <EmptyState
      headline="Nothing recovered yet"
      body="The world holds a hundred memories; I can open them all now if you would rather not walk."
      actionLabel="Reveal everything"
    />
  ),
};
