import { I18nextProvider } from 'react-i18next'
import { COLORS, Flex, SPACING } from '@opentrons/components'
import { i18n } from '../../i18n'
import { Accordion } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const contentExample: React.ReactNode = (
  <div>
    <p>What&apos;s your scientific application?</p>
    <p>Describe what you are trying to do</p>
    <p>
      Example: “The protocol performs automated liquid handling for Pierce BCA
      Protein Assay Kit to determine protein concentrations in various sample
      types, such as cell lysates and eluates of purification process.&quot;
    </p>
  </div>
)

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

export const AccordionCollapsed: Story = {
  args: {
    id: 'accordion',
    isOpen: false,
    handleClick: () => {
      alert('Accordion clicked')
    },
    heading: 'Application',
    children: contentExample,
  },
}

export const AccordionCompleted: Story = {
  args: {
    id: 'accordion',
    isCompleted: true,
    heading: 'Application',
  },
}

export const AccordionExpanded: Story = {
  args: {
    id: 'accordion2',
    isOpen: true,
    heading: 'Application',
    children: contentExample,
  },
}

export const AccordionDisabled: Story = {
  args: {
    id: 'accordion3',
    handleClick: () => {
      alert('Accordion clicked')
    },
    disabled: true,
    heading: 'Application',
    children: contentExample,
  },
}
