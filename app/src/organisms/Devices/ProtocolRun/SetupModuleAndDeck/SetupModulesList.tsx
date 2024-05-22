import * as React from 'react'
import map from 'lodash/map'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  BORDERS,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  TOOLTIP_LEFT,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  OT2_ROBOT_TYPE,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
} from '@opentrons/shared-data'

import { TertiaryButton } from '../../../../atoms/buttons'
import { StatusLabel } from '../../../../atoms/StatusLabel'
import { Tooltip } from '../../../../atoms/Tooltip'
import { useChainLiveCommands } from '../../../../resources/runs'
import { ModuleSetupModal } from '../../../ModuleCard/ModuleSetupModal'
import { ModuleWizardFlows } from '../../../ModuleWizardFlows'
import { getModulePrepCommands } from '../../getModulePrepCommands'
import { getModuleTooHot } from '../../getModuleTooHot'
import {
  useIsFlex,
  useModuleRenderInfoForProtocolById,
  useRobot,
  useUnmatchedModulesForProtocol,
  useRunCalibrationStatus,
} from '../../hooks'
import { LocationConflictModal } from './LocationConflictModal'
import { OT2MultipleModulesHelp } from './OT2MultipleModulesHelp'
import { UnMatchedModuleWarning } from './UnMatchedModuleWarning'
import { getModuleImage } from './utils'

import type {
  CutoutConfig,
  DeckDefinition,
  ModuleModel,
} from '@opentrons/shared-data'
import type { AttachedModule } from '../../../../redux/modules/types'
import type {
  ModuleRenderInfoForProtocol,
  ProtocolCalibrationStatus,
} from '../../hooks'

interface SetupModulesListProps {
  robotName: string
  runId: string
}

export const SetupModulesList = (props: SetupModulesListProps): JSX.Element => {
  const { robotName, runId } = props
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    runId
  )
  const {
    missingModuleIds,
    remainingAttachedModules,
  } = useUnmatchedModulesForProtocol(robotName, runId)

  const isFlex = useIsFlex(robotName)
  const { robotModel } = useRobot(robotName) ?? {}
  const deckDef = getDeckDefFromRobotType(robotModel ?? FLEX_ROBOT_TYPE)

  const calibrationStatus = useRunCalibrationStatus(robotName, runId)

  const moduleModels = map(
    moduleRenderInfoForProtocolById,
    ({ moduleDef }) => moduleDef.model
  )
  const showOT2MoamHelp =
    robotModel === OT2_ROBOT_TYPE &&
    new Set(moduleModels).size !== moduleModels.length
  return (
    <>
      {showOT2MoamHelp ? <OT2MultipleModulesHelp /> : null}
      {remainingAttachedModules.length !== 0 &&
      missingModuleIds.length !== 0 ? (
        <UnMatchedModuleWarning />
      ) : null}

      {map(
        moduleRenderInfoForProtocolById,
        ({
          moduleDef,
          attachedModuleMatch,
          slotName,
          moduleId,
          conflictedFixture,
        }) => {
          // filter out the magnetic block here, because it is handled by the SetupFixturesList
          if (moduleDef.moduleType === MAGNETIC_BLOCK_TYPE) return null
          return (
            <ModulesListItem
              key={`SetupModulesList_${String(
                moduleDef.model
              )}_slot_${slotName}`}
              moduleModel={moduleDef.model}
              displayName={moduleDef.displayName}
              slotName={slotName}
              attachedModuleMatch={attachedModuleMatch}
              heaterShakerModuleFromProtocol={
                moduleRenderInfoForProtocolById[moduleId].moduleDef
                  .moduleType === HEATERSHAKER_MODULE_TYPE
                  ? moduleRenderInfoForProtocolById[moduleId]
                  : null
              }
              isFlex={isFlex}
              calibrationStatus={calibrationStatus}
              conflictedFixture={conflictedFixture}
              deckDef={deckDef}
              robotName={robotName}
            />
          )
        }
      )}
    </>
  )
}

interface ModulesListItemProps {
  moduleModel: ModuleModel
  displayName: string
  slotName: string
  attachedModuleMatch: AttachedModule | null
  heaterShakerModuleFromProtocol: ModuleRenderInfoForProtocol | null
  isFlex: boolean
  calibrationStatus: ProtocolCalibrationStatus
  deckDef: DeckDefinition
  conflictedFixture: CutoutConfig | null
  robotName: string
}

export function ModulesListItem({
  moduleModel,
  displayName,
  slotName,
  attachedModuleMatch,
  heaterShakerModuleFromProtocol,
  isFlex,
  calibrationStatus,
  conflictedFixture,
  deckDef,
  robotName,
}: ModulesListItemProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'module_wizard_flows'])
  const moduleConnectionStatus =
    attachedModuleMatch != null
      ? t('module_connected')
      : t('module_not_connected')
  const [
    showModuleSetupModal,
    setShowModuleSetupModal,
  ] = React.useState<Boolean>(false)
  const [
    showLocationConflictModal,
    setShowLocationConflictModal,
  ] = React.useState<boolean>(false)

  const [showModuleWizard, setShowModuleWizard] = React.useState<boolean>(false)
  const { chainLiveCommands, isCommandMutationLoading } = useChainLiveCommands()
  const [
    prepCommandErrorMessage,
    setPrepCommandErrorMessage,
  ] = React.useState<string>('')

  const handleCalibrateClick = (): void => {
    if (attachedModuleMatch != null) {
      chainLiveCommands(
        getModulePrepCommands(attachedModuleMatch),
        false
      ).catch((e: Error) => {
        setPrepCommandErrorMessage(e.message)
      })
    }
    setShowModuleWizard(true)
  }

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  let subText: JSX.Element | null = null
  if (moduleModel === HEATERSHAKER_MODULE_V1) {
    subText = (
      <Btn
        marginLeft={SPACING.spacing20}
        css={css`
          color: ${COLORS.blue50};

          &:hover {
            color: ${COLORS.blue55};
          }
        `}
        marginTop={SPACING.spacing4}
        onClick={() => setShowModuleSetupModal(true)}
      >
        <Flex flexDirection={DIRECTION_ROW}>
          <StyledText as="p">{t('view_setup_instructions')}</StyledText>
        </Flex>
      </Btn>
    )
  } else if (moduleModel === MAGNETIC_BLOCK_V1) {
    subText = (
      <StyledText as="p" marginLeft={SPACING.spacing20} color={COLORS.grey50}>
        {t('no_usb_connection_required')}
      </StyledText>
    )
  }

  const isModuleTooHot =
    attachedModuleMatch != null ? getModuleTooHot(attachedModuleMatch) : false

  let calibrateDisabledReason = t('calibrate_pipette_before_module_calibration')
  if (calibrationStatus.reason === 'attach_pipette_failure_reason') {
    calibrateDisabledReason = t('attach_pipette_before_module_calibration')
  } else if (isModuleTooHot) {
    calibrateDisabledReason = t('module_wizard_flows:module_too_hot')
  }

  let renderModuleStatus: JSX.Element = (
    <StatusLabel
      status={moduleConnectionStatus}
      backgroundColor={COLORS.green30}
      iconColor={COLORS.green60}
      textColor={COLORS.green60}
    />
  )

  if (
    isFlex &&
    attachedModuleMatch != null &&
    attachedModuleMatch.moduleOffset?.last_modified == null
  ) {
    renderModuleStatus = (
      <>
        <TertiaryButton
          {...targetProps}
          onClick={handleCalibrateClick}
          disabled={!calibrationStatus?.complete || isModuleTooHot}
        >
          {t('calibrate_now')}
        </TertiaryButton>
        {(!calibrationStatus?.complete && calibrationStatus?.reason != null) ||
        isModuleTooHot ? (
          <Tooltip tooltipProps={tooltipProps}>
            {calibrateDisabledReason}
          </Tooltip>
        ) : null}
      </>
    )
  } else if (attachedModuleMatch == null) {
    renderModuleStatus = (
      <StatusLabel
        status={moduleConnectionStatus}
        backgroundColor={COLORS.yellow30}
        iconColor={COLORS.yellow60}
        textColor={COLORS.yellow60}
      />
    )
  }

  // convert slot name to cutout id
  const cutoutIdForSlotName = getCutoutIdForSlotName(slotName, deckDef)

  return (
    <>
      {showLocationConflictModal && cutoutIdForSlotName != null ? (
        <LocationConflictModal
          onCloseClick={() => setShowLocationConflictModal(false)}
          cutoutId={cutoutIdForSlotName}
          requiredModule={moduleModel}
          deckDef={deckDef}
          robotName={robotName}
        />
      ) : null}
      {showModuleWizard && attachedModuleMatch != null ? (
        <ModuleWizardFlows
          attachedModule={attachedModuleMatch}
          closeFlow={() => setShowModuleWizard(false)}
          isPrepCommandLoading={isCommandMutationLoading}
          prepCommandErrorMessage={
            prepCommandErrorMessage === '' ? undefined : prepCommandErrorMessage
          }
        />
      ) : null}
      <Box
        border={BORDERS.styleSolid}
        borderColor={COLORS.grey30}
        borderWidth="1px"
        borderRadius={BORDERS.borderRadius4}
        padding={SPACING.spacing16}
        backgroundColor={COLORS.white}
      >
        {showModuleSetupModal && heaterShakerModuleFromProtocol != null ? (
          <ModuleSetupModal
            close={() => setShowModuleSetupModal(false)}
            moduleDisplayName={
              heaterShakerModuleFromProtocol.moduleDef.displayName
            }
          />
        ) : null}
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={JUSTIFY_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Flex alignItems={JUSTIFY_CENTER} width="45%">
            <img width="60px" height="54px" src={getModuleImage(moduleModel)} />
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText
                css={TYPOGRAPHY.pSemiBold}
                marginLeft={SPACING.spacing20}
              >
                {displayName}
              </StyledText>
              {subText}
            </Flex>
          </Flex>
          <Flex
            width="15%"
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
          >
            <StyledText as="p">
              {getModuleType(moduleModel) === 'thermocyclerModuleType'
                ? isFlex
                  ? TC_MODULE_LOCATION_OT3
                  : TC_MODULE_LOCATION_OT2
                : slotName}
            </StyledText>
            {attachedModuleMatch?.usbPort.port != null ? (
              <StyledText as="p">
                {t('usb_port_number', {
                  port: attachedModuleMatch.usbPort.port,
                })}
              </StyledText>
            ) : null}
          </Flex>
          <Flex
            width="15%"
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing10}
          >
            {conflictedFixture != null && isFlex ? (
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing10}
              >
                <StatusLabel
                  status={t('location_conflict')}
                  backgroundColor={COLORS.yellow30}
                  iconColor={COLORS.yellow60}
                  textColor={COLORS.yellow60}
                />
                <TertiaryButton
                  width="max-content"
                  onClick={() => setShowLocationConflictModal(true)}
                >
                  <StyledText as="label" cursor="pointer">
                    {t('resolve')}
                  </StyledText>
                </TertiaryButton>
              </Flex>
            ) : moduleModel === MAGNETIC_BLOCK_V1 ? (
              <StatusLabel
                status={t('n_a')}
                backgroundColor={COLORS.grey30}
                textColor={COLORS.grey60}
                showIcon={false}
                capitalizeStatus={false}
              />
            ) : (
              renderModuleStatus
            )}
          </Flex>
        </Flex>
      </Box>
    </>
  )
}
