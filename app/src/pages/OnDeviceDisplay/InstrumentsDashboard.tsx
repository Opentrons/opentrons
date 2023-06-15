import * as React from 'react'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { PipetteWizardFlows } from '../../organisms/PipetteWizardFlows'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'
import { Navigation } from '../../organisms/Navigation'
import { AttachedInstrumentMountItem } from '../../organisms/InstrumentMountItem'
import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'

export const InstrumentsDashboard = (): JSX.Element => {
  const { data: attachedInstruments } = useInstrumentsQuery()
  const [wizardProps, setWizardProps] = React.useState<
    | React.ComponentProps<typeof GripperWizardFlows>
    | React.ComponentProps<typeof PipetteWizardFlows>
    | null
  >(null)

  const leftInstrument =
    (attachedInstruments?.data ?? []).find(i => i.mount === 'left') ?? null
  // @ts-expect-error mount is a type narrower that ensures channels will exist
  const isNinetySixChannel = leftInstrument?.data?.channels === 96

  return (
    <Flex paddingX={SPACING.spacing40} flexDirection={DIRECTION_COLUMN}>
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        {isNinetySixChannel ? (
          <AttachedInstrumentMountItem
            mount="left"
            attachedInstrument={
              (attachedInstruments?.data ?? []).find(i => i.mount === 'left') ??
              null
            }
            setWizardProps={setWizardProps}
          />
        ) : (
          <>
            <AttachedInstrumentMountItem
              mount="left"
              attachedInstrument={
                (attachedInstruments?.data ?? []).find(
                  i => i.mount === 'left'
                ) ?? null
              }
              setWizardProps={setWizardProps}
            />
            <AttachedInstrumentMountItem
              mount="right"
              attachedInstrument={
                (attachedInstruments?.data ?? []).find(
                  i => i.mount === 'right'
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
              i => i.mount === 'extension'
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
