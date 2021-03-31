import * as React from 'react'
import { PipetteSelect } from './PipetteSelect'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Organisms/PipetteSelect',
} as Meta

const Template: Story<React.ComponentProps<typeof PipetteSelect>> = ({pipetteName, ...args}) => {
  const [pipetteNameControlled, setPipetteNameControlled] = React.useState(pipetteName)
  const handleChange = (pipName: string): unknown => setPipetteNameControlled(pipName)
  return <PipetteSelect {...args} pipetteName={pipetteNameControlled} onPipetteChange={handleChange} />
}
export const Basic = Template.bind({})
Basic.args = {
  nameBlocklist: ['p20_multi_gen2', 'p300_multi_gen2'],
}

export const NoneOptionEnabled = Template.bind({})
NoneOptionEnabled.args = {
  nameBlocklist: ['p20_multi_gen2', 'p300_multi_gen2'],
  enableNoneOption: true,
}
