import type { Preview } from '@storybook/react-vite'
import React from 'react';
import '../styles/index.css';
import { sb } from 'storybook/test';

sb.mock(import('../src/client/hooks/useGithubActivity.ts'));

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    backgrounds: {
      disable: true, // Disable the backgrounds toolbar since we're using our own theme toggle
    },
  },

  globalTypes: {
    theme: {
      description: 'Global theme for components',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      const backgroundColor = theme === 'dark' ? '#1a1a1a' : 'var(--bg-page)';
      
      // Apply theme to the document
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.style.backgroundColor = backgroundColor;
      }

      // Wrap story in a container with the themed background
      return React.createElement(
        'div',
        {
          style: {
            backgroundColor
          }
        },
        React.createElement(Story)
      );
    },
  ],
};

export default preview;