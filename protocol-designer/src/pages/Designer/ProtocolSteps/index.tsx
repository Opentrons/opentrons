import * as React from 'react'
import { COLORS, Flex, POSITION_ABSOLUTE, SPACING } from '@opentrons/components'
import { StepEditForm } from '../../../components/StepEditForm'
import { DeckSetupContainer } from '../DeckSetup'
import { TimelineToolbox } from './Timeline'

export function ProtocolSteps(): JSX.Element {
  return (
    <>
      {/* TODO: wire up the step edit form designs */}
      <Flex position={POSITION_ABSOLUTE} right="0" zIndex={10}>
        <StepEditForm />
      </Flex>
      <Flex padding={SPACING.spacing12} backgroundColor={COLORS.grey10}>
        <TimelineToolbox />
        <DeckSetupContainer tab="protocolSteps" />
      </Flex>
    </>
  )
}
