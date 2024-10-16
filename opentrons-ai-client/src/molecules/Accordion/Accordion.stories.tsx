import { I18nextProvider } from 'react-i18next'
import { COLORS, Flex, SPACING } from '@opentrons/components'
import { i18n } from '../../i18n'
import { Accordion } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Accordion> = {
  title: 'AI/molecules/Accordion',
  component: Accordion,
  decorators: [
    Story => (
      <I18nextProvider i18n={i18n}>
        <Flex backgroundColor={COLORS.grey10} padding={SPACING.spacing40}>
          <Story />
        </Flex>
      </I18nextProvider>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Accordion>

export const AccordionExample: Story = {
  args: {
    id: 'accordion',
    handleClick: () => {},
    isOpen: false,
    isCompleted: false,
    heading: 'Accordion Title',
    children: <div>Accordion Content</div>,
  },
}
