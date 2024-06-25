import * as React from 'react'
import { SPACING, TYPOGRAPHY } from '../ui-style-constants'
import { Flex } from '../primitives'
import { LegacyStyledText } from '../atoms/StyledText'
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
          onClick={() => {
            setStep('setup')
          }}
          tabName={'setup'}
        >
          <LegacyStyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
            {'Setup'}
          </LegacyStyledText>
        </RoundTabComponent>

        <RoundTabComponent
          isCurrent={step === 'parameters'}
          onClick={() => {
            setStep('parameters')
          }}
        >
          <LegacyStyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
            {'Parameters'}
          </LegacyStyledText>
        </RoundTabComponent>

        <RoundTabComponent
          isCurrent={step === 'module controls'}
          onClick={() => {
            setStep('module controls')
          }}
        >
          <LegacyStyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
            {'Module Controls'}
          </LegacyStyledText>
        </RoundTabComponent>

        <RoundTabComponent
          isCurrent={step === 'run preview'}
          onClick={() => {
            setStep('run preview')
          }}
        >
          <LegacyStyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
            {'Run Preview'}
          </LegacyStyledText>
        </RoundTabComponent>
      </Flex>
      <LegacyStyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
      >
        {step}
      </LegacyStyledText>
    </Flex>
  )
}

type Story = StoryObj<typeof RoundTabComponent>

export const RoundTab: Story = {
  args: {},
}
