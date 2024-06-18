import * as React from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { RobotMotionLoader } from '../RobotMotionLoader'
import { getPrepCommands } from './getPrepCommands'
import { WizardRequiredEquipmentList } from '../../../molecules/WizardRequiredEquipmentList'
import { getLatestCurrentOffsets } from '../../Devices/ProtocolRun/SetupLabwarePositionCheck/utils'
import { getIsOnDevice } from '../../../redux/config'
import { NeedHelpLink } from '../../CalibrationPanels'
import { useSelector } from 'react-redux'
import { TwoUpTileLayout } from '../TwoUpTileLayout'
import { getTopPortalEl } from '../../../App/portal'
import { LegacyModalShell } from '../../../molecules/LegacyModal'
import { SmallButton } from '../../../atoms/buttons'
import { CALIBRATION_PROBE } from '../../PipetteWizardFlows/constants'
import { TerseOffsetTable } from '../ResultsSummary'
import { getLabwareDefinitionsFromCommands } from '../../../molecules/Command/utils/getLabwareDefinitionsFromCommands'

import type { LabwareOffset } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { useChainRunCommands } from '../../../resources/runs'
import type { RegisterPositionAction } from '../types'
import type { Jog } from '../../../molecules/JogControls'

export const INTERVAL_MS = 3000

// TODO(BC, 09/01/23): replace updated support article link for LPC on OT-2/Flex
const SUPPORT_PAGE_URL = 'https://support.opentrons.com/s/ot2-calibration'

export const IntroScreen = (props: {
  proceed: () => void
  protocolData: CompletedProtocolAnalysis
  registerPosition: React.Dispatch<RegisterPositionAction>
  chainRunCommands: ReturnType<typeof useChainRunCommands>['chainRunCommands']
  handleJog: Jog
  setFatalError: (errorMessage: string) => void
  isRobotMoving: boolean
  existingOffsets: LabwareOffset[]
  protocolName: string
  shouldUseMetalProbe: boolean
}): JSX.Element | null => {
  const {
    proceed,
    protocolData,
    chainRunCommands,
    isRobotMoving,
    setFatalError,
    existingOffsets,
    protocolName,
    shouldUseMetalProbe,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t, i18n } = useTranslation(['labware_position_check', 'shared'])
  const handleClickStartLPC = (): void => {
    const prepCommands = getPrepCommands(protocolData)
    chainRunCommands(prepCommands, false)
      .then(() => {
        proceed()
      })
      .catch((e: Error) => {
        setFatalError(
          `IntroScreen failed to issue prep commands with message: ${e.message}`
        )
      })
  }
  const requiredEquipmentList = [
    {
      loadName: t('all_modules_and_labware_from_protocol', {
        protocol_name: protocolName,
      }),
      displayName: t('all_modules_and_labware_from_protocol', {
        protocol_name: protocolName,
      }),
    },
  ]
  if (shouldUseMetalProbe) {
    requiredEquipmentList.push(CALIBRATION_PROBE)
  }

  if (isRobotMoving) {
    return (
      <RobotMotionLoader header={t('shared:stand_back_robot_is_in_motion')} />
    )
  }
  return (
    <TwoUpTileLayout
      title={t('shared:before_you_begin')}
      body={
        <Trans
          t={t}
          i18nKey="labware_position_check_description"
          components={{ block: <StyledText as="p" /> }}
        />
      }
      rightElement={
        <WizardRequiredEquipmentList equipmentList={requiredEquipmentList} />
      }
      footer={
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          {isOnDevice ? (
            <ViewOffsets
              existingOffsets={existingOffsets}
              labwareDefinitions={getLabwareDefinitionsFromCommands(
                protocolData.commands
              )}
            />
          ) : (
            <NeedHelpLink href={SUPPORT_PAGE_URL} />
          )}
          {isOnDevice ? (
            <SmallButton
              buttonText={t('shared:get_started')}
              onClick={handleClickStartLPC}
            />
          ) : (
            <PrimaryButton onClick={handleClickStartLPC}>
              {i18n.format(t('shared:get_started'), 'capitalize')}
            </PrimaryButton>
          )}
        </Flex>
      }
    />
  )
}

const VIEW_OFFSETS_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.black90};
  font-size: ${TYPOGRAPHY.fontSize22};
  &:hover {
    opacity: 100%;
  }
  &:active {
    opacity: 70%;
  }
`
interface ViewOffsetsProps {
  existingOffsets: LabwareOffset[]
  labwareDefinitions: LabwareDefinition2[]
}
function ViewOffsets(props: ViewOffsetsProps): JSX.Element {
  const { existingOffsets, labwareDefinitions } = props
  const { t, i18n } = useTranslation('labware_position_check')
  const [showOffsetsTable, setShowOffsetsModal] = React.useState(false)
  const latestCurrentOffsets = getLatestCurrentOffsets(existingOffsets)
  return existingOffsets.length > 0 ? (
    <>
      <Btn
        display="flex"
        gridGap={SPACING.spacing8}
        alignItems={ALIGN_CENTER}
        onClick={() => {
          setShowOffsetsModal(true)
        }}
        css={VIEW_OFFSETS_BUTTON_STYLE}
        aria-label="show labware offsets"
      >
        <Icon name="reticle" size="1.75rem" color={COLORS.black90} />
        <StyledText as="p">
          {i18n.format(t('view_current_offsets'), 'capitalize')}
        </StyledText>
      </Btn>
      {showOffsetsTable
        ? createPortal(
            <LegacyModalShell
              width="60rem"
              height="33.5rem"
              padding={SPACING.spacing32}
              display="flex"
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              header={
                <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightBold}>
                  {i18n.format(t('labware_offset_data'), 'capitalize')}
                </StyledText>
              }
              footer={
                <SmallButton
                  width="100%"
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                  buttonText={t('shared:close')}
                  onClick={() => {
                    setShowOffsetsModal(false)
                  }}
                />
              }
            >
              <Box overflowY="scroll" marginBottom={SPACING.spacing16}>
                <TerseOffsetTable
                  offsets={latestCurrentOffsets}
                  labwareDefinitions={labwareDefinitions}
                />
              </Box>
            </LegacyModalShell>,
            getTopPortalEl()
          )
        : null}
    </>
  ) : (
    <Flex />
  )
}
