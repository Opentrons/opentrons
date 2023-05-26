import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
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
import {
  SINGLE_MOUNT_PIPETTES,
  NINETY_SIX_CHANNEL,
} from '@opentrons/shared-data'
import { PipetteWizardFlows } from '../PipetteWizardFlows'
import { GripperWizardFlows } from '../GripperWizardFlows'
import { StyledText } from '../../atoms/text'
import { MediumButton } from '../../atoms/buttons'
import { FLOWS } from '../PipetteWizardFlows/constants'
import { formatTimestamp } from '../Devices/utils'
import { GRIPPER_FLOW_TYPES } from '../GripperWizardFlows/constants'

import type { InstrumentData } from '@opentrons/api-client'
import type { PipetteMount } from '@opentrons/shared-data'
import type { StyleProps } from '@opentrons/components'

interface InstrumentInfoProps {
  // NOTE: instrument will only be null while
  // in the middle of detach wizard which occludes
  // the main empty contents of this page
  instrument: InstrumentData | null
}
export const InstrumentInfo = (props: InstrumentInfoProps): JSX.Element => {
  const { t, i18n } = useTranslation('instruments_dashboard')
  const { instrument } = props
  const history = useHistory()
  const [wizardProps, setWizardProps] = React.useState<
    | React.ComponentProps<typeof GripperWizardFlows>
    | React.ComponentProps<typeof PipetteWizardFlows>
    | null
  >(null)
  const sharedGripperWizardProps: Pick<
    React.ComponentProps<typeof GripperWizardFlows>,
    'attachedGripper' | 'closeFlow'
  > = {
    attachedGripper: instrument,
    closeFlow: () => {
      setWizardProps(null)
    },
  }
  const handleDetach: React.MouseEventHandler = () => {
    if (instrument != null) {
      setWizardProps(
        instrument.mount === 'extension'
          ? { ...sharedGripperWizardProps, flowType: GRIPPER_FLOW_TYPES.DETACH }
          : {
              closeFlow: () => {
                setWizardProps(null)
              },
              onComplete: () => {
                history.goBack()
              },
              mount: instrument.mount as PipetteMount,
              selectedPipette:
                instrument.instrumentModel === 'p1000_96'
                  ? NINETY_SIX_CHANNEL
                  : SINGLE_MOUNT_PIPETTES,
              flowType: FLOWS.DETACH,
            }
      )
    }
  }
  const handleRecalibrate: React.MouseEventHandler = () => {
    if (instrument != null) {
      setWizardProps(
        instrument.mount === 'extension'
          ? {
              ...sharedGripperWizardProps,
              flowType: GRIPPER_FLOW_TYPES.RECALIBRATE,
            }
          : {
              closeFlow: () => {
                setWizardProps(null)
              },
              mount: instrument.mount as PipetteMount,
              selectedPipette:
                instrument.instrumentModel === 'p1000_96'
                  ? NINETY_SIX_CHANNEL
                  : SINGLE_MOUNT_PIPETTES,
              flowType: FLOWS.CALIBRATE,
            }
      )
    }
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      height="100%"
    >
      {instrument != null ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          marginTop={SPACING.spacing24}
        >
          <InfoItem
            label={t('last_calibrated')}
            value={
              instrument.data.calibratedOffset?.last_modified != null
                ? formatTimestamp(
                    instrument.data.calibratedOffset?.last_modified
                  )
                : i18n.format(t('no_cal_data'), 'capitalize')
            }
          />
          <InfoItem label={t('firmware_version')} value="TODO" />
          <InfoItem
            label={t('serial_number')}
            value={instrument.serialNumber}
          />
        </Flex>
      ) : null}
      <Flex gridGap={SPACING.spacing8}>
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
      {wizardProps != null && 'mount' in wizardProps ? (
        <PipetteWizardFlows {...wizardProps} />
      ) : null}
      {wizardProps != null && !('mount' in wizardProps) ? (
        <GripperWizardFlows {...wizardProps} />
      ) : null}
    </Flex>
  )
}

interface InfoItemProps extends StyleProps {
  label: string
  value: string
}
function InfoItem(props: InfoItemProps): JSX.Element {
  return (
    <Flex
      borderRadius={BORDERS.size3}
      backgroundColor={COLORS.lightGreyPressed}
      padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      lineHeight={TYPOGRAPHY.lineHeight36}
      {...props}
    >
      <StyledText
        as="h4"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        fontSize={TYPOGRAPHY.fontSize28}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
      >
        {props.label}
      </StyledText>
      <StyledText
        as="h4"
        color={COLORS.darkBlack70}
        fontSize={TYPOGRAPHY.fontSize28}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
      >
        {props.value}
      </StyledText>
    </Flex>
  )
}
