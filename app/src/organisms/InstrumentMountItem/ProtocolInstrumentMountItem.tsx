import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  Flex,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  Icon,
  DIRECTION_COLUMN,
  ALIGN_FLEX_START,
  BORDERS,
  JUSTIFY_FLEX_START,
} from '@opentrons/components'
import {
  getGripperDisplayName,
  getPipetteNameSpecs,
  PipetteName,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'

import { SmallButton } from '../../atoms/buttons/OnDeviceDisplay'
import { ChoosePipette } from '../PipetteWizardFlows/ChoosePipette'

import type {
  InstrumentData,
  PipetteOffsetCalibration,
  GripperData,
} from '@opentrons/api-client'
import type { GripperModel } from '@opentrons/shared-data'
import type { Mount } from '../../redux/pipettes/types'
import type { SelectablePipettes } from '../PipetteWizardFlows/types'

export const MountItem = styled.div<{ isReady: boolean }>`
  display: flex;
  width: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_FLEX_START};
  padding: ${SPACING.spacing16} ${SPACING.spacing5};
  border-radius: ${BORDERS.size_three};
  background-color: ${({ isReady }) =>
    isReady ? COLORS.green_three : COLORS.yellow_three};
  &:hover,
  &:active,
  &:focus {
    background-color: ${({ isReady }) =>
      isReady ? COLORS.green_three_pressed : COLORS.yellow_three_pressed};
  }
`
interface ProtocolInstrumentMountItemProps {
  mount: Mount | 'extension'
  attachedInstrument: InstrumentData | null
  attachedCalibrationData:
    | PipetteOffsetCalibration
    | GripperData['data']['calibratedOffset']
    | null
  speccedName: PipetteName | GripperModel
}
export function ProtocolInstrumentMountItem(
  props: ProtocolInstrumentMountItemProps
): JSX.Element {
  const { t, i18n } = useTranslation('protocol_setup')
  const { mount, attachedInstrument, speccedName } = props

  const [showChoosePipetteModal, setShowChoosePipetteModal] = React.useState(
    false
  )
  const [
    selectedPipette,
    setSelectedPipette,
  ] = React.useState<SelectablePipettes>(SINGLE_MOUNT_PIPETTES)

  const handleCalibrate: React.MouseEventHandler = () => {
    console.log(
      'TODO: handle calibrate wizard after maintenance runs are real',
      mount,
      attachedInstrument
    )
  }
  const handleAttach: React.MouseEventHandler = () => {
    console.log(
      'TODO: handle attach wizard after maintenance runs are real',
      mount,
      attachedInstrument
    )
  }
  const is96ChannelPipette = speccedName === 'p1000_96'
  // TODO: check for presence of calibration data once instruments endpoint
  // returns calibration data for pipettes
  const isAttachedWithCal = attachedInstrument != null
  return (
    <>
      <MountItem isReady={isAttachedWithCal}>
        <Flex width="100%" alignItems={ALIGN_CENTER}>
          <Flex
            flex="2"
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing4}
          >
            <MountLabel>
              {i18n.format(
                is96ChannelPipette ? t('96_mount') : t('mount', { mount }),
                'capitalize'
              )}
            </MountLabel>
            <SpeccedInstrumentName>
              {mount === 'extension'
                ? getGripperDisplayName(speccedName as GripperModel)
                : getPipetteNameSpecs(speccedName as PipetteName)?.displayName}
            </SpeccedInstrumentName>
          </Flex>

          <Flex
            flex="1"
            alignItems={ALIGN_CENTER}
            gridGap={SPACING.spacing8}
            justifyContent={JUSTIFY_FLEX_START}
          >
            <Icon
              size="1.5rem"
              name={isAttachedWithCal ? 'ot-check' : 'ot-alert'}
              color={
                isAttachedWithCal
                  ? COLORS.successEnabled
                  : COLORS.warningEnabled
              }
            />
            <CalibrationStatus
              color={isAttachedWithCal ? COLORS.green_one : COLORS.yellow_one}
            >
              {i18n.format(
                t(isAttachedWithCal ? 'calibrated' : 'no_data'),
                'capitalize'
              )}
            </CalibrationStatus>
          </Flex>
          <Flex flex="1">
            <SmallButton
              onClick={
                attachedInstrument != null ? handleCalibrate : handleAttach
              }
              buttonText={i18n.format(
                t(attachedInstrument != null ? 'calibrate' : 'attach'),
                'capitalize'
              )}
              buttonType="primary"
              buttonCategory="rounded"
            />
          </Flex>
        </Flex>
      </MountItem>
      {showChoosePipetteModal ? (
        <ChoosePipette
          proceed={() => {
            setShowChoosePipetteModal(false)
          }}
          setSelectedPipette={setSelectedPipette}
          selectedPipette={selectedPipette}
          exit={() => {
            setShowChoosePipetteModal(false)
          }}
          mount={mount as Mount}
        />
      ) : null}
    </>
  )
}

const MountLabel = styled.p`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
`

const SpeccedInstrumentName = styled.p`
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
`

const CalibrationStatus = styled.p`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  color: ${({ color }) => color};
`
