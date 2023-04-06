import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  BORDERS,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { SINGLE_MOUNT_PIPETTES, NINETY_SIX_CHANNEL } from '@opentrons/shared-data'
import { PipetteWizardFlows } from '../../organisms/PipetteWizardFlows'
import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'
import { StyledText } from '../../atoms/text'
import { MediumButton } from '../../atoms/buttons/OnDeviceDisplay'
import { FLOWS } from '../PipetteWizardFlows/constants'

import type { InstrumentData } from '@opentrons/api-client'
import type { PipetteMount } from '@opentrons/shared-data'
import { Portal } from '../../App/__mocks__/portal'
import { GRIPPER_FLOW_TYPES } from '../GripperWizardFlows/constants'

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
  const sharedPipetteWizardProps = {
    mount: instrument.mount as PipetteMount,
    selectedPipette: instrument.instrumentModel === 'p1000_96' ? NINETY_SIX_CHANNEL : SINGLE_MOUNT_PIPETTES,
    setSelectedPipette: () => { },
    closeFlow: () => { setWizardProps(null) }
  }
  const sharedGripperWizardProps = {
    attachedGripper: instrument,
    closeFlow: () => { setWizardProps(null) }
  }
  const handleDetach: React.MouseEventHandler = () => {
    setWizardProps(
      instrument.instrumentModel === 'gripperV1'
        ? { ...sharedGripperWizardProps, flowType: GRIPPER_FLOW_TYPES.DETACH }
        : { ...sharedPipetteWizardProps, flowType: FLOWS.DETACH }
    )
  }
  const handleRecalibrate: React.MouseEventHandler = () => {
    setWizardProps(
      instrument.instrumentModel === 'gripperV1'
        ? { ...sharedGripperWizardProps, flowType: GRIPPER_FLOW_TYPES.RECALIBRATE }
        : { ...sharedPipetteWizardProps, flowType: FLOWS.CALIBRATE }
    )
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} justifyContent={JUSTIFY_SPACE_BETWEEN} height="100%">
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
        <InfoItem>
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>{t('last_calibrated')}</StyledText>
          <StyledText as="h4">TODO</StyledText>
        </InfoItem>
        <InfoItem>
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>{t('firmware_version')}</StyledText>
          <StyledText as="h4" >TODO</StyledText>
        </InfoItem>
        <InfoItem>
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>{t('serial_number')}</StyledText>
          <StyledText as="h4">{instrument.serialNumber}</StyledText>
        </InfoItem>
      </Flex>
      <Flex gridGap={SPACING.spacing3}>
        <MediumButton
          buttonType="secondary"
          flex="1"
          onClick={handleDetach}
          buttonText={t('detach')}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          justifyContent={JUSTIFY_CENTER}
        />
        <MediumButton
          buttonType="primary"
          flex="1"
          onClick={handleRecalibrate}
          buttonText={t('recalibrate')}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          justifyContent={JUSTIFY_CENTER}
        />
      </Flex>
      <Portal>
        {wizardProps != null && 'mount' in wizardProps ? (
          <PipetteWizardFlows {...wizardProps} />
        ) : null}
        {wizardProps != null && !('mount' in wizardProps) ? (
          <GripperWizardFlows {...wizardProps} />
        ) : null}
      </Portal>
    </Flex>
  )
}


type InfoItemProps = React.ComponentProps<typeof Flex>
function InfoItem(props: InfoItemProps): JSX.Element {
  return (
    <Flex
      borderRadius={BORDERS.size_three}
      backgroundColor={COLORS.lightGreyPressed}
      padding={`${SPACING.spacing4} ${SPACING.spacing5}`}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      lineHeight={TYPOGRAPHY.lineHeight36}
      fontSize={TYPOGRAPHY.fontSize22}
      {...props} />
  )
}
