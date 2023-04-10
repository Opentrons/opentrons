import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  Flex,
  COLORS,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
  JUSTIFY_SPACE_BETWEEN,
  Icon,
  DIRECTION_COLUMN,
  ALIGN_FLEX_START,
  BORDERS,
  JUSTIFY_FLEX_START,
} from '@opentrons/components'
import { PipetteName, SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'

import { SmallButton } from '../../atoms/buttons/OnDeviceDisplay'
import { ChoosePipette } from '../PipetteWizardFlows/ChoosePipette'

import type { Mount } from '../../redux/pipettes/types'
import type { InstrumentData, PipetteOffsetCalibration } from '@opentrons/api-client'
import type { SelectablePipettes } from '../PipetteWizardFlows/types'
import styled from 'styled-components'
import { StyledText } from '../../atoms/text'

export const MountButton = styled.button<{ isReady: boolean }>`
  display: flex;
  width: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_FLEX_START};
  padding: ${SPACING.spacing4} ${SPACING.spacing5};
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
  attachedCalibrationData: PipetteOffsetCalibration | null
  speccedName: PipetteName
}

export function ProtocolInstrumentMountItem(
  props: ProtocolInstrumentMountItemProps
): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const { mount, attachedInstrument, speccedName, attachedCalibrationData } = props

  const [showChoosePipetteModal, setShowChoosePipetteModal] = React.useState(
    false
  )
  const [
    selectedPipette,
    setSelectedPipette,
  ] = React.useState<SelectablePipettes>(SINGLE_MOUNT_PIPETTES)

  const handleClick: React.MouseEventHandler = () => {
    console.log('button clicked', mount, attachedInstrument)
  }
  return (
    <>
      <MountButton onClick={handleClick} isReady={attachedInstrument != null && attachedCalibrationData != null}>
        <Flex
          width="100%"
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          <Flex
            flex="2 0 auto"
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing2}
          >
            <MountLabel>{t('mount', { mount })}</MountLabel>
            <SpeccedInstrumentName>{speccedName}</SpeccedInstrumentName>
          </Flex>
          {
            attachedCalibrationData != null
              ? (
                <Flex flex="1 0 auto" alignItems={ALIGN_CENTER} gridGap={SPACING.spacing3} justifyContent={JUSTIFY_FLEX_START}>
                  <Icon name='ot-check' size="1.5rem" color={COLORS.successEnabled} />
                  <StyledText>{t('calibrated')}</StyledText>
                </Flex>
              ) : (
                <Flex flex="1 0 auto" alignItems={ALIGN_CENTER} gridGap={SPACING.spacing3} justifyContent={JUSTIFY_FLEX_START}>
                  <Icon name='ot-alert' size="1.5rem" color={COLORS.warningEnabled} />
                  <StyledText>{t('no_data')}</StyledText>
                </Flex>
              )
          }
          <Flex flex="1 0 auto">
            <SmallButton
              onClick={handleClick}
              buttonText={
                attachedInstrument != null
                  ? t('calibrate')
                  : t('attach')
              }
              buttonType='tertiaryHighLight'
            />
          </Flex>
        </Flex>
      </MountButton>
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
  text-transform: ${TEXT_TRANSFORM_CAPITALIZE};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
`

const SpeccedInstrumentName = styled.p`
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  text-transform: ${TEXT_TRANSFORM_CAPITALIZE};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
`