import { Meta, StoryObj } from '@storybook/react'

import { ResizableContainer } from './'
import styles from './resizablecontainer.stories.module.css'

const meta: Meta<typeof ResizableContainer> = {
  title: 'Helix/Molecules/ResizableContainer',
  component: ResizableContainer,
  argTypes: {
    edge: {
      control: 'radio',
      options: ['left', 'right'],
    },
  },
}

export default meta

type Story = StoryObj<typeof ResizableContainer>

export const TwoColumnLayout: Story = {
  render: () => (
    <div className={styles.layout}>
      <ResizableContainer
        minWidth={150}
        maxWidth={400}
        edge="right"
        defaultWidth={250}
      >
        <div className={styles.side_content}>
          <h3>Left Column</h3>
        </div>
      </ResizableContainer>

      <main className={styles.main}>
        <div>
          <h2>Main Content Area</h2>
          <p>This is the center content</p>
          <p>The width of this part is decided by the left col</p>
        </div>
      </main>
    </div>
  ),
}

export const ThreeColumnLayout: Story = {
  render: () => (
    <div className={styles.layout}>
      <ResizableContainer
        minWidth={150}
        maxWidth={400}
        edge="right"
        defaultWidth={250}
      >
        <div className={styles.sideContent}>
          <h3>Left Column</h3>
        </div>
      </ResizableContainer>

      <main className={styles.main}>
        <div>
          <h2>Main Content Area</h2>
          <p>This is the center content</p>
          <p>
            The width of this part is decided by the right col and the left col
          </p>
        </div>
      </main>

      <ResizableContainer
        minWidth={200}
        maxWidth={500}
        edge="left"
        defaultWidth={300}
      >
        <div className={styles.sideContent}>
          <h3>Right Column</h3>
        </div>
      </ResizableContainer>
    </div>
  ),
}
