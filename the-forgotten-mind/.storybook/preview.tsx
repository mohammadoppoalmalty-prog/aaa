import type { Preview } from '@storybook/react';
import '../app/globals.css';

/* Storybook is the design system's living documentation, so it renders on the
   product's own ground rather than on Storybook's white default — a component
   reviewed against the wrong background is reviewed against nothing. */
const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    controls: { expanded: true },
    a11y: { test: 'error' },
    layout: 'centered',
  },
  globalTypes: {
    direction: {
      description: 'Writing direction — Arabic is a first-class locale, not a mirror',
      defaultValue: 'ltr',
      toolbar: {
        title: 'Direction',
        items: [
          { value: 'ltr', title: 'LTR · English' },
          { value: 'rtl', title: 'RTL · العربية' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const dir = context.globals.direction === 'rtl' ? 'rtl' : 'ltr';
      return (
        <div dir={dir} style={{ padding: '2rem', background: 'var(--tfm-color-canvas)' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
