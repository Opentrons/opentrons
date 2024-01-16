import * as React from 'react'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  COLORS,
  SecondaryButton,
} from '@opentrons/components'

import { StyledText } from '../text'
import { ProgressBar } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/ProgressBar',
  component: ProgressBar,
} as Meta

const Template: Story<React.ComponentProps<typeof ProgressBar>> = args => {
  const [progress, setProgress] = React.useState<number>(args.percentComplete)
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
      gridGap={SPACING.spacing40}
      backgroundColor={COLORS.grey30}
      padding={SPACING.spacing16}
    >
      <StyledText>{'Add 5% to the current progress every 0.2 sec'}</StyledText>
      <ProgressBar percentComplete={progress} />
      <SecondaryButton onClick={() => setProgress(0)} width="5rem">
        {'reset'}
      </SecondaryButton>
    </Flex>
  )
}

export const Primary = Template.bind({})
Primary.args = {
  percentComplete: 0,
}
