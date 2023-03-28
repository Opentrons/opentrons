import * as React from 'react'
import { SPACING, TYPOGRAPHY } from '../ui-style-constants'
import { Flex, Text } from '../primitives'
import { DIRECTION_ROW } from '../styles'
import { RoundTab } from './RoundTab'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/RoundTab',
  component: RoundTab,
} as Meta

const Template: Story<
  React.ComponentProps<typeof RoundTab>
> = (): JSX.Element => {
  const [step, setStep] = React.useState<'details' | 'pipette' | 'module'>(
    'details'
  )

  return (
    <Flex
      width="100%"
      height="100%"
      flexDirection={DIRECTION_ROW}
      marginLeft={SPACING.spacing4}
    >
      <RoundTab
        isCurrent={step === 'details'}
        onClick={() => setStep('details')}
      >
        <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
          {'Protocol Name and Description'}
        </Text>
      </RoundTab>

      <RoundTab
        isCurrent={step === 'pipette'}
        onClick={() => setStep('pipette')}
      >
        <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
          {'Pipette Selection'}
        </Text>
      </RoundTab>

      <RoundTab isCurrent={step === 'module'} onClick={() => setStep('module')}>
        <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
          {'Module Selection'}
        </Text>
      </RoundTab>
    </Flex>
  )
}

export const Basic = Template.bind({})
Basic.args = {}
