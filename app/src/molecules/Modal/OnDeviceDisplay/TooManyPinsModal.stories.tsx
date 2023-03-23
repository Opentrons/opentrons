import * as React from 'react'
import { TooManyPinsModal } from './TooManyPinsModal'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Molecules/Modals/TooManyPinsModal',
  argTypes: { onClick: { action: 'clicked' } },
} as Meta

const TooManyPinsModalTemplate: Story<
  React.ComponentProps<typeof TooManyPinsModal>
> = args => <TooManyPinsModal {...args} />
export const TooManyPins = TooManyPinsModalTemplate.bind({})
