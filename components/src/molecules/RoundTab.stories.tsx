import * as React from 'react'
import { SPACING, TYPOGRAPHY } from '../ui-style-constants'
import { Flex } from '../primitives'
import { StyledText } from '../atoms/StyledText'
import { DIRECTION_COLUMN, DIRECTION_ROW } from '../styles'
import { RoundTab as RoundTabComponent } from './RoundTab'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof RoundTabComponent> = {
  title: 'Library/Molecules/RoundTab',
  component: RoundTabComponent,
  decorators: [Story => <Tabs />],
}
export default meta

const Tabs = (): JSX.Element => {
  const [step, setStep] = React.useState<
    'setup' | 'parameters' | 'module controls' | 'run preview'
  >('setup')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing16}
      padding={SPACING.spacing16}
    >
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
        <RoundTabComponent
          isCurrent={step === 'setup'}
          onClick={() => setStep('setup')}
          tabName={'setup'}
        >
          <StyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
            {'Setup'}
          </StyledText>
        </RoundTabComponent>

        <RoundTabComponent
          isCurrent={step === 'parameters'}
          onClick={() => setStep('parameters')}
        >
          <StyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
            {'Parameters'}
          </StyledText>
        </RoundTabComponent>

        <RoundTabComponent
          isCurrent={step === 'module controls'}
          onClick={() => setStep('module controls')}
        >
          <StyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
            {'Module Controls'}
          </StyledText>
        </RoundTabComponent>

        <RoundTabComponent
          isCurrent={step === 'run preview'}
          onClick={() => setStep('run preview')}
        >
          <StyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
            {'Run Preview'}
          </StyledText>
        </RoundTabComponent>
      </Flex>
      <StyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
      >
        {step}
      </StyledText>
    </Flex>
  )
}

type Story = StoryObj<typeof RoundTabComponent>

export const RoundTab: Story = {
  args: {},
}
