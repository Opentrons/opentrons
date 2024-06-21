import * as React from 'react'
import { useArgs } from '@storybook/preview-api'
import { Tabs as TabsComponent } from '.'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof TabsComponent> = {
  title: 'Library/Molecules/Tabs',
  component: TabsComponent,

  argTypes: {
    tabs: {
      control: {
        type: 'array',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof TabsComponent>

export const Tabs: Story = {
  args: {
    tabs: [
      {
        text: 'Setup',
        isActive: true,
        disabled: false,
        onClick: () => {},
      },
      {
        text: 'Parameters',
        isActive: false,
        disabled: false,
        onClick: () => {},
      },
      {
        text: 'Module Controls',
        isActive: false,
        disabled: false,
        onClick: () => {},
      },
      {
        text: 'Run Preview',
        isActive: false,
        disabled: false,
        onClick: () => {},
      },
    ],
  },
  render: function TabsStory() {
    const [args, setArgs] = useArgs<
      React.ComponentProps<typeof TabsComponent>
    >()

    const modifiedButtons = args.tabs.map((button, index) => {
      const modifiedButton = {
        ...button,
        onClick: () => {
          const updatedButtons = args.tabs.map((btn, i) => ({
            ...btn,
            isActive: i === index,
          }))
          setArgs({ ...args, tabs: updatedButtons })
          button.onClick()
        },
      }
      return modifiedButton
    })

    return <TabsComponent tabs={modifiedButtons} />
  },
}
