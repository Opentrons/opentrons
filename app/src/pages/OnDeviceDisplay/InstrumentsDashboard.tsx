import * as React from 'react'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { PipetteWizardFlows } from '../../organisms/PipetteWizardFlows'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import {
  PipetteMountItem,
  ExtensionMountItem,
} from '../../organisms/InstrumentMountItem.tsx'
import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'

export const InstrumentsDashboard = (): JSX.Element => {
  const { data: attachedInstruments } = useInstrumentsQuery()
  const leftPipette =
    (attachedInstruments?.data ?? []).find(i => i.mount === 'left') ?? null
  const rightPipette =
    (attachedInstruments?.data ?? []).find(i => i.mount === 'right') ?? null
  const extensionInstrument =
    (attachedInstruments?.data ?? []).find(i => i.mount === 'extension') ?? null
  const [wizardProps, setWizardProps] = React.useState<
    | React.ComponentProps<typeof GripperWizardFlows>
    | React.ComponentProps<typeof PipetteWizardFlows>
    | null
  >(null)

  return (
    <Flex
      padding={`0 ${SPACING.spacingXXL} ${SPACING.spacingXXL}`}
      flexDirection={DIRECTION_COLUMN}
    >
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
        <PipetteMountItem
          mount="left"
          attachedPipette={leftPipette}
          setWizardProps={setWizardProps}
        />
        <PipetteMountItem
          mount="right"
          attachedPipette={rightPipette}
          setWizardProps={setWizardProps}
        />
        <ExtensionMountItem
          attachedInstrument={extensionInstrument}
          setWizardProps={setWizardProps}
        />
      </Flex>
      {wizardProps != null && 'mount' in wizardProps ? (
        <PipetteWizardFlows {...wizardProps} />
      ) : null}
      {wizardProps != null && !('mount' in wizardProps) ? (
        <GripperWizardFlows {...wizardProps} />
      ) : null}
    </Flex>
  )
}
