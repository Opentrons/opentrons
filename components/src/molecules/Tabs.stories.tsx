import * as React from 'react'
import { Tabs as TabComponent } from './Tabs'
import type { Meta, StoryObj } from '@storybook/react'

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

    decorators: [
        Story => (
            <Story />
        ),
    ],
}

export default meta
type Story = StoryObj<typeof TabComponent>

export const Tabs: Story = {
    args: {
        buttons: [
            {
                text: 'Setup',
                isActive: false,
                disabled: false,
                onClick: () => {
                    console.log('Tab 1 clicked');
                },
            },
            {
                text: 'Parameters',
                isActive: false,
                disabled: false,
                onClick: () => {
                    console.log('Tab 2 clicked');
                },
            },
            {
                text: 'Module Controls',
                isActive: false,
                disabled: false,
                onClick: () => {
                    console.log('Tab 3 clicked');
                },
            },
            {
                text: 'Run Preview',
                isActive: false,
                disabled: false,
                onClick: () => {
                    console.log('Tab 4 clicked');
                },
            },
        ],     
    }
}