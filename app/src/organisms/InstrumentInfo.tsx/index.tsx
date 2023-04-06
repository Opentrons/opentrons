import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  BORDERS,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  PrimaryButton,
  SecondaryButton,
} from '@opentrons/components'
import { PipetteWizardFlows } from '../../organisms/PipetteWizardFlows'
import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'
import type { InstrumentData } from '@opentrons/api-client'
import { StyledText } from '../../atoms/text'
import { FLOWS } from '../PipetteWizardFlows/constants'
import { PipetteMount, SINGLE_MOUNT_PIPETTES, NINETY_SIX_CHANNEL } from '@opentrons/shared-data'

interface InstrumentInfoProps {
  instrument: InstrumentData
}
export const InstrumentInfo = (props: InstrumentInfoProps): JSX.Element => {
  const { t } = useTranslation('instruments_dashboard')
  const { instrument } = props
  const [
    wizardProps,
    setWizardProps,
  ] = React.useState<React.ComponentProps<typeof GripperWizardFlows> | React.ComponentProps<typeof PipetteWizardFlows> | null>(null)
  const sharedWizardProps = {
    mount: instrument.mount as PipetteMount,
    selectedPipette: instrument.instrumentModel === 'p1000_96' ? NINETY_SIX_CHANNEL : SINGLE_MOUNT_PIPETTES,
    setSelectedPipette: () => { },
    closeFlow: () => { setWizardProps(null) }
  }
  const handleDetach: React.MouseEventHandler = () => {
    setWizardProps({ ...sharedWizardProps, flowType: FLOWS.DETACH })
  }
  const handleRecalibrate: React.MouseEventHandler = () => {
    setWizardProps({ ...sharedWizardProps, flowType: FLOWS.CALIBRATE})
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} >
      <InfoItem>
        <StyledText as="h2">{t('last_calibrated')}</StyledText>
        <StyledText as="h2">TODO</StyledText>
      </InfoItem>
      <InfoItem>
        <StyledText as="h2">{t('firmware_version')}</StyledText>
        <StyledText as="h2">TODO</StyledText>
      </InfoItem>
      <InfoItem>
        <StyledText as="h2">{t('serial_number')}</StyledText>
        <StyledText as="h2">TODO</StyledText>
      </InfoItem>
      <Flex gridGap={SPACING.spacing3}>
        <SecondaryButton flex="1" onClick={handleDetach}>{t('detach')}</SecondaryButton>
        <PrimaryButton flex="1" onClick={handleRecalibrate}>{t('recalibrate')}</PrimaryButton>
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


interface InfoItemProps {
  children: React.ReactNode
}
function InfoItem(props: InfoItemProps): JSX.Element {
  return (
    <Flex
      borderRadius={BORDERS.size_three}
      backgroundColor={COLORS.lightGreyPressed}
      padding={`${SPACING.spacing4} ${SPACING.spacing5}`}
      justifyContent={JUSTIFY_SPACE_BETWEEN}>
      {props.children}
    </Flex>)
}
