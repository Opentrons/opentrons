import * as React from 'react'

import { InstrumentContainer as InstrumentContainerComponent } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/InstrumentContainer',
  component: InstrumentContainerComponent,
} as Meta

const Template: Story<
  React.ComponentProps<typeof InstrumentContainerComponent>
> = args => <InstrumentContainerComponent {...args} />

export const InstrumentContainer = Template.bind({})
InstrumentContainer.args = {
  displayName: 'P300 8-Channel GEN2',
}
