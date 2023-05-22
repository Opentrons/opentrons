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
  CompletedProtocolAnalysis,
  getGripperDisplayName,
  getPipetteNameSpecs,
  NINETY_SIX_CHANNEL,
  PipetteName,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'

import { SmallButton } from '../../atoms/buttons'
import { FLOWS } from '../PipetteWizardFlows/constants'
import { PipetteWizardFlows } from '../PipetteWizardFlows'

import type {
  InstrumentData,
  PipetteOffsetCalibration,
  GripperData,
} from '@opentrons/api-client'
import type { GripperModel } from '@opentrons/shared-data'
import type { Mount } from '../../redux/pipettes/types'

export const MountItem = styled.div<{ isReady: boolean }>`
  display: flex;
  width: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_FLEX_START};
  padding: ${SPACING.spacing16} ${SPACING.spacing24};
  border-radius: ${BORDERS.size3};
  background-color: ${({ isReady }) =>
    isReady ? COLORS.green3 : COLORS.yellow3};
  &:hover,
  &:active,
  &:focus {
    background-color: ${({ isReady }) =>
      isReady ? COLORS.green3Pressed : COLORS.yellow3Pressed};
  }
`
interface ProtocolInstrumentMountItemProps {
  mount: Mount | 'extension'
  mostRecentAnalysis?: CompletedProtocolAnalysis | null
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
  const { mount, attachedInstrument, speccedName, mostRecentAnalysis } = props

  const [
    showPipetteWizardFlow,
    setShowPipetteWizardFlow,
  ] = React.useState<boolean>(false)
  const [flowType, setFlowType] = React.useState<string>(FLOWS.ATTACH)
  const selectedPipette =
    speccedName === 'p1000_96' ? NINETY_SIX_CHANNEL : SINGLE_MOUNT_PIPETTES

  const handleCalibrate: React.MouseEventHandler = () => {
    setFlowType(FLOWS.CALIBRATE)
    setShowPipetteWizardFlow(true)
  }
  const handleAttach: React.MouseEventHandler = () => {
    setFlowType(FLOWS.ATTACH)
    setShowPipetteWizardFlow(true)
  }
  const is96ChannelPipette = speccedName === 'p1000_96'
  const isAttachedWithCal =
    attachedInstrument?.data?.calibratedOffset?.last_modified != null
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
              color={isAttachedWithCal ? COLORS.green1 : COLORS.yellow1}
            >
              {i18n.format(
                t(isAttachedWithCal ? 'calibrated' : 'no_data'),
                'capitalize'
              )}
            </CalibrationStatus>
          </Flex>
          {!isAttachedWithCal && (
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
          )}
        </Flex>
      </MountItem>
      {showPipetteWizardFlow ? (
        <PipetteWizardFlows
          flowType={flowType}
          closeFlow={() => setShowPipetteWizardFlow(false)}
          selectedPipette={selectedPipette}
          mount={mount as Mount}
          pipetteInfo={mostRecentAnalysis?.pipettes}
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
