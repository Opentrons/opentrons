import * as React from 'react'

import { SPACING } from '@opentrons/components'

import { ToggleButton } from './ToggleButton'

import type { Meta, Story } from '@storybook/react'
import type { ComponentProps } from 'react'

export default {
  title: 'App/Atoms/Buttons/ToggleButton',
} as Meta

const ToggleButtonTemplate: Story<
  ComponentProps<typeof ToggleButton>
> = args => {
  const { onClick, ...rest } = args
  const [isToggled, setIsToggled] = React.useState<boolean>(false)
  const handleClick = (): void => {
    setIsToggled(currentIsToggled => !currentIsToggled)
  }
  return (
    <div style={{ padding: SPACING.spacing16 }}>
      <ToggleButton {...rest} toggledOn={isToggled} onClick={handleClick} />
    </div>
  )
}

export const Toggle = ToggleButtonTemplate.bind({})
Toggle.args = {
  label: 'toggle button',
  id: 'storybook-toggle-button',
}
