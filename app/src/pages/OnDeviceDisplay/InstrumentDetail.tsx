import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { ALIGN_FLEX_END, DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { TertiaryButton } from '../../atoms/buttons'
import { PipetteWizardFlows } from '../../organisms/PipetteWizardFlows'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'
import type { InstrumentData } from '@opentrons/api-client'
import { BackButton } from '../../atoms/buttons/BackButton'
import { StyledText } from '../../atoms/text'
import { InstrumentInfo } from '../../organisms/InstrumentInfo.tsx'

export const InstrumentDetail = (): JSX.Element => {
  const { mount } = useParams<{ mount: InstrumentData['mount'] }>()
  const { data: attachedInstruments } = useInstrumentsQuery()
  const instrument = (attachedInstruments?.data ?? []).find(i => i.mount === mount) ?? null
  const [
    wizardProps,
    setWizardProps,
  ] = React.useState<React.ComponentProps<typeof GripperWizardFlows> | React.ComponentProps<typeof PipetteWizardFlows> | null>(null)

  return (
    <Flex
      padding={`${String(SPACING.spacing6)} ${String(
        SPACING.spacingXXL
      )} ${String(SPACING.spacingXXL)}`}
      flexDirection={DIRECTION_COLUMN}
    >
      <BackButton>{instrument?.instrumentModel}</BackButton>
      <InstrumentInfo instrument={instrument} />
      {wizardProps != null && 'mount' in wizardProps ? (
        <PipetteWizardFlows {...wizardProps} />
      ) : null}
      {wizardProps != null && !('mount' in wizardProps) ? (
        <GripperWizardFlows {...wizardProps} />
      ) : null}
      <Flex
        alignSelf={ALIGN_FLEX_END}
        marginTop={SPACING.spacing5}
        width="fit-content"
        paddingRight={SPACING.spacing6}
      >
        <Link to="menu">
          <TertiaryButton>To ODD Menu</TertiaryButton>
        </Link>
      </Flex>
    </Flex>
  )
}
