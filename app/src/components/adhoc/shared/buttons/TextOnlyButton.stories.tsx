import * as React from 'react'

import { TextOnlyButton } from './TextOnlyButton'

import type { Meta, Story } from '@storybook/react'
import type { ComponentProps } from 'react'

export default {
  title: 'App/Atoms/Buttons/TextOnlyButton',
} as Meta

const TextOnlyButtonTemplate: Story<
  ComponentProps<typeof TextOnlyButton>
> = () => {
  const [count, setCount] = React.useState<number>(0)
  return (
    <TextOnlyButton
      onClick={() => {
        setCount(prev => prev + 1)
      }}
      buttonText={`You clicked me ${count} times`}
    />
  )
}

export const TextOnly = TextOnlyButtonTemplate.bind({})
