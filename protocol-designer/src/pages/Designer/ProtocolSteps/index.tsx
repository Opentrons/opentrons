import * as React from 'react'
import { COLORS, Flex, POSITION_ABSOLUTE, SPACING } from '@opentrons/components'
import { DeckSetupContainer } from '../DeckSetup'
import { TimelineToolbox } from './Timeline'
import { StepForm } from './StepForm'

export function ProtocolSteps(): JSX.Element {
  return (
    <>
      <Flex position={POSITION_ABSOLUTE} right="0" zIndex={10}>
        <StepForm />
      </Flex>
      <Flex padding={SPACING.spacing12} backgroundColor={COLORS.grey10}>
        <TimelineToolbox />
        <DeckSetupContainer tab="protocolSteps" />
      </Flex>
    </>
  )
}
