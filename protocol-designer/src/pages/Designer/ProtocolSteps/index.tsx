import * as React from 'react'
import { DeckSetupContainer } from '../DeckSetup'
import { COLORS, Flex, SPACING } from '@opentrons/components'
import { Timeline } from './Timeline'
import { StepEditForm } from '../../../components/StepEditForm'
import { Alerts } from '../../../components/alerts/Alerts'

export function ProtocolSteps(): JSX.Element {
  return (
    <>
      <Flex width="50%" justifyContent="center">
        <Alerts componentType="Timeline" />
      </Flex>
      {/* TODO: wire up the step edit form designs */}
      <Flex position="absolute" right="0" zIndex={10}>
        <StepEditForm />
      </Flex>
      <Flex padding={SPACING.spacing12} backgroundColor={COLORS.grey10}>
        <Timeline />
        <DeckSetupContainer tab="protocolSteps" />
      </Flex>
    </>
  )
}
