import * as React from 'react'
import { Tabs as TabComponent } from './Tabs'
import type { Meta, StoryObj } from '@storybook/react'
import { useArgs } from '@storybook/preview-api';

const meta: Meta<typeof TabComponent> = {
    title: 'Library/Molecules/Tabs',
    component: TabComponent,

    argTypes: {
        buttons: {
            control: {
                type: 'array',
            },
        },
    },
}

export default meta

type Story = StoryObj<typeof TabComponent>

export const Tabs: (Story) = {
    args: {
        buttons: [
            {
                text: 'Setup',
                isActive: false,
                disabled: false,
                onClick: () => { },
            },
            {
                text: 'Parameters',
                isActive: false,
                disabled: false,
                onClick: () => { },
            },
            {
                text: 'Module Controls',
                isActive: false,
                disabled: false,
                onClick: () => { },
            },
            {
                text: 'Run Preview',
                isActive: false,
                disabled: false,
                onClick: () => { },
            },
        ]
    },
    render: function TabsStory() {
        const [args, setArgs] = useArgs<React.ComponentProps<typeof TabComponent>>()

        const modifiedButtons = args.buttons.map((button, index) => {
            const modifiedButton = {
              ...button,
              onClick: () => {
                const updatedButtons = args.buttons.map((btn, i) => ({
                  ...btn,
                  isActive: i === index,
                }))
                setArgs({ ...args, buttons: updatedButtons })
                button.onClick()
              },
            }
            return modifiedButton
          })
        
          return <TabComponent buttons={modifiedButtons} />

    },
}


