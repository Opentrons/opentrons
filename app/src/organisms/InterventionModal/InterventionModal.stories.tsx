import * as React from 'react'
import { InterventionModal as InterventionModalComponent } from './'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Organisms/InterventionModal',
  component: InterventionModalComponent,
} as Meta

const Template: Story<
  React.ComponentProps<typeof InterventionModalComponent>
> = args => <InterventionModalComponent {...args} />

export const BasicExample = Template.bind({})
BasicExample.args = {
  robotName: 'Otie',
}
