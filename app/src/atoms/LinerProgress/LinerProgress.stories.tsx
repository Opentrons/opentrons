import * as React from 'react'

import { Flex, DIRECTION_COLUMN, SPACING, COLORS } from '@opentrons/components'

import { SecondaryButton } from '../buttons'
import { StyledText } from '../text'
import { LinerProgress } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/LinerProgress',
  component: LinerProgress,
} as Meta

const Template: Story<React.ComponentProps<typeof LinerProgress>> = args => {
  const [progress, setProgress] = React.useState<number>(args.completed)
  React.useEffect(() => {
    if (progress < 100) {
      const interval = setInterval(() => {
        setProgress(prevProgress => prevProgress + 5)
      }, 200)

      return () => clearInterval(interval)
    }
  })
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacingXXL}
      backgroundColor={COLORS.darkGreyDisabled}
      padding={SPACING.spacing4}
    >
      <StyledText>{'Add 5% to the current progress every 0.2 sec'}</StyledText>
      <LinerProgress completed={progress} />
      <SecondaryButton onClick={() => setProgress(0)} width="5rem">
        {'reset'}
      </SecondaryButton>
    </Flex>
  )
}

export const Primary = Template.bind({})
Primary.args = {
  completed: 0,
}
