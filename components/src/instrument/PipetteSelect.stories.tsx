import * as React from 'react'
import { PipetteSelect as PipetteSelectComponent } from './PipetteSelect'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Organisms/Pipette Select',
} as Meta

const Template: Story<React.ComponentProps<typeof PipetteSelectComponent>> = ({
  pipetteName,
  ...args
}) => {
  const [pipetteNameControlled, setPipetteNameControlled] = React.useState(
    pipetteName
  )
  const handleChange = (pipName: string): unknown =>
    setPipetteNameControlled(pipName)
  return (
    <PipetteSelectComponent
      {...args}
      pipetteName={pipetteNameControlled}
      onPipetteChange={handleChange}
    />
  )
}
export const PipetteSelect = Template.bind({})
PipetteSelect.args = {
  nameBlocklist: [
    'p20_multi_gen2',
    'p300_multi_gen2',
    'p20_single_flex',
    'p300_single_flex',
    'p1000_single_flex',
    'p1000_multi_flex',
    'p50_multi_flex',
  ],
  enableNoneOption: true,
}
