import * as React from 'react'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { PipetteWizardFlows } from '../../organisms/PipetteWizardFlows'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'
import { Navigation } from '../../organisms/Navigation'
import { AttachedInstrumentMountItem } from '../../organisms/InstrumentMountItem'
import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'
import type { GripperData, PipetteData } from '@opentrons/api-client'

const FETCH_PIPETTE_CAL_POLL = 10000

export const InstrumentsDashboard = (): JSX.Element => {
  const { data: attachedInstruments } = useInstrumentsQuery({
    refetchInterval: FETCH_PIPETTE_CAL_POLL,
  })
  const [wizardProps, setWizardProps] = React.useState<
    | React.ComponentProps<typeof GripperWizardFlows>
    | React.ComponentProps<typeof PipetteWizardFlows>
    | null
  >(null)

  const leftInstrument =
    (attachedInstruments?.data ?? []).find(
      (i): i is PipetteData => i.ok && i.mount === 'left'
    ) ?? null
  const isNinetySixChannel = leftInstrument?.data?.channels === 96

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex
        paddingX={SPACING.spacing40}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
      >
        {isNinetySixChannel ? (
          <AttachedInstrumentMountItem
            mount="left"
            attachedInstrument={leftInstrument}
            setWizardProps={setWizardProps}
          />
        ) : (
          <>
            <AttachedInstrumentMountItem
              mount="left"
              attachedInstrument={leftInstrument}
              setWizardProps={setWizardProps}
            />
            <AttachedInstrumentMountItem
              mount="right"
              attachedInstrument={
                (attachedInstruments?.data ?? []).find(
                  (i): i is PipetteData => i.ok && i.mount === 'right'
                ) ?? null
              }
              setWizardProps={setWizardProps}
            />
          </>
        )}
        <AttachedInstrumentMountItem
          mount="extension"
          attachedInstrument={
            (attachedInstruments?.data ?? []).find(
              (i): i is GripperData => i.ok && i.mount === 'extension'
            ) ?? null
          }
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
