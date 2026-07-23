import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import { css } from 'styled-components'

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
  LegacyStyledText,
  SPACING,
  Tooltip,
  TOOLTIP_LEFT,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  ABSORBANCE_READER_V1,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  getFlexStackerD3Compatibility,
  getModuleDeckLabel,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  OT2_ROBOT_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { TertiaryButton } from '/app/atoms/buttons'
import { StatusLabel } from '/app/atoms/StatusLabel'
import {
  getFlexStackerPrepCommands,
  getModuleImage,
  useModuleUSBPort,
} from '/app/local-resources/modules'
import { LocationConflictModal } from '/app/organisms/LocationConflictModal'
import { ModuleSetupModal } from '/app/organisms/ModuleCard/ModuleSetupModal'
import { handleModuleWizardFlows } from '/app/organisms/ModuleWizardFlows'
import { useIsFlex, useRobot } from '/app/redux-resources/robots'
import {
  useChainLiveCommands,
  useModuleRenderInfoForProtocolById,
  useRunCalibrationStatus,
  useUnmatchedModulesForProtocol,
} from '/app/resources/runs'
import { getModuleTooHot } from '/app/transformations/modules'

import { OT2MultipleModulesHelp } from './OT2MultipleModulesHelp'
import { UnMatchedModuleWarning } from './UnMatchedModuleWarning'
import { getFixtureImage } from './utils'

import type { TFunction } from 'i18next'
import type {
  CommandData,
  AttachedModule,
} from '@opentrons/api-client'
import type {
  CutoutConfigAndCompatibility,
  CutoutFixtureId,
  DeckDefinition,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import type { ModulePrepCommandsType } from '/app/local-resources/modules'
import type {
  ModuleRenderInfoForProtocol,
  ProtocolCalibrationStatus,
} from '/app/resources/runs'

interface SetupModulesListProps {
  deckConfigCompatibility: CutoutConfigAndCompatibility[]
  robotName: string
  runId: string
}

export const SetupModulesList = (props: SetupModulesListProps): JSX.Element => {
  const { robotName, runId, deckConfigCompatibility } = props
  const moduleRenderInfoForProtocolById =
    useModuleRenderInfoForProtocolById(runId)
  const { missingModuleIds, remainingAttachedModules } =
    useUnmatchedModulesForProtocol(robotName, runId)

  const isFlex = useIsFlex(robotName)
  const { robotModel } = useRobot(robotName) ?? {}
  const deckDef = getDeckDefFromRobotType(robotModel ?? FLEX_ROBOT_TYPE)

  const calibrationStatus = useRunCalibrationStatus(robotName, runId)
  const { chainLiveCommands } = useChainLiveCommands()

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
          // if the module is a flex stacker in row D, check if it needs a waste chute
          // combo fixture
          if (
            moduleDef.moduleType === FLEX_STACKER_MODULE_TYPE &&
            slotName[0] === 'D'
          ) {
            const d3Compatibility = getFlexStackerD3Compatibility(
              deckConfigCompatibility
            )
            if (d3Compatibility) {
              const { comboFixtureId, comboFixtureConflict } = d3Compatibility
              return (
                <ModulesListItem
                  key={`SetupModulesList_${String(
                    moduleDef.model
                  )}_slot_${slotName}`}
                  moduleModel={moduleDef.model}
                  moduleType={moduleDef.moduleType}
                  displayName={moduleDef.displayName}
                  slotName={slotName}
                  attachedModuleMatch={attachedModuleMatch}
                  heaterShakerModuleFromProtocol={null}
                  isFlex={isFlex}
                  calibrationStatus={calibrationStatus}
                  chainLiveCommands={chainLiveCommands}
                  conflictedFixture={comboFixtureConflict}
                  deckDef={deckDef}
                  robotName={robotName}
                  comboFixtureId={comboFixtureId}
                />
              )
            }
          }

          return (
            <ModulesListItem
              key={`SetupModulesList_${String(
                moduleDef.model
              )}_slot_${slotName}`}
              moduleModel={moduleDef.model}
              moduleType={moduleDef.moduleType}
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
              chainLiveCommands={chainLiveCommands}
              conflictedFixture={conflictedFixture != null}
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
  moduleType: ModuleType
  displayName: string
  slotName: string
  attachedModuleMatch: AttachedModule | null
  heaterShakerModuleFromProtocol: ModuleRenderInfoForProtocol | null
  isFlex: boolean
  calibrationStatus: ProtocolCalibrationStatus
  chainLiveCommands: (
    commands: ModulePrepCommandsType[],
    continuePastCommandFailure: boolean
  ) => Promise<CommandData[]>
  deckDef: DeckDefinition
  conflictedFixture: boolean
  robotName: string
  comboFixtureId?: CutoutFixtureId
}

export function ModulesListItem({
  moduleModel,
  moduleType,
  displayName,
  slotName,
  attachedModuleMatch,
  isFlex,
  calibrationStatus,
  chainLiveCommands,
  conflictedFixture,
  deckDef,
  robotName,
  comboFixtureId,
}: ModulesListItemProps): JSX.Element {
  const { t } = useTranslation([
    'protocol_setup',
    'module_wizard_flows',
    'deck_configuration',
  ])
  const moduleConnectionStatus =
    attachedModuleMatch != null
      ? t('module_connected')
      : t('module_not_connected')
  const [showModuleSetupModal, setShowModuleSetupModal] = useState<
    string | null
  >(null)
  const [showLocationConflictModal, setShowLocationConflictModal] =
    useState<boolean>(false)

  const { parseModuleUSBPort } = useModuleUSBPort()

  const handleSetupModuleClick = (): void => {
    if (attachedModuleMatch !== null) {
      handleModuleWizardFlows({
        attachedModule: attachedModuleMatch,
        robotName,
      })
    }
  }

  const handleHomeStackerClick = (): void => {
    if (attachedModuleMatch?.moduleType === FLEX_STACKER_MODULE_TYPE) {
      chainLiveCommands(
        getFlexStackerPrepCommands(attachedModuleMatch),
        // if the close latch command fails, we still want to home the shuttle
        true
      )
    }
  }

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  let subText: JSX.Element | null = null
  if (
    moduleModel === HEATERSHAKER_MODULE_V1 ||
    moduleModel === ABSORBANCE_READER_V1
  ) {
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
        onClick={() => {
          setShowModuleSetupModal(displayName)
        }}
      >
        <Flex flexDirection={DIRECTION_ROW}>
          <LegacyStyledText forwardedAs="p">
            {t('view_setup_instructions')}
          </LegacyStyledText>
        </Flex>
      </Btn>
    )
  } else if (moduleModel === MAGNETIC_BLOCK_V1) {
    subText = (
      <LegacyStyledText
        forwardedAs="p"
        marginLeft={SPACING.spacing20}
        color={COLORS.grey50}
      >
        {t('no_usb_connection_required')}
      </LegacyStyledText>
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
  const stackerNeedsHome =
    attachedModuleMatch?.moduleType === FLEX_STACKER_MODULE_TYPE
      ? attachedModuleMatch?.data.platformState === 'unknown' ||
        attachedModuleMatch?.data.platformState === 'retracted' ||
        attachedModuleMatch?.data.latchState !== 'closed'
      : false
  const stackerShuttleMissing =
    attachedModuleMatch?.moduleType === FLEX_STACKER_MODULE_TYPE
      ? attachedModuleMatch?.data.platformState === 'missing'
      : false
  const needsCalibration =
    isFlex &&
    attachedModuleMatch != null &&
    attachedModuleMatch.moduleType !== ABSORBANCE_READER_TYPE &&
    attachedModuleMatch.moduleType !== FLEX_STACKER_MODULE_TYPE &&
    attachedModuleMatch.moduleType !== VACUUM_MODULE_TYPE &&
    attachedModuleMatch.moduleOffset?.last_modified == null

  if (needsCalibration) {
    renderModuleStatus = (
      <>
        <TertiaryButton
          {...targetProps}
          onClick={handleSetupModuleClick}
          width="max-content"
          disabled={!calibrationStatus?.complete || isModuleTooHot}
        >
          {t('setup_now')}
        </TertiaryButton>
        {(!calibrationStatus?.complete && calibrationStatus?.reason != null) ||
        isModuleTooHot ? (
          <Tooltip tooltipProps={tooltipProps}>
            {calibrateDisabledReason}
          </Tooltip>
        ) : null}
      </>
    )
  } else if (stackerNeedsHome) {
    renderModuleStatus = (
      <>
        <TertiaryButton
          {...targetProps}
          onClick={handleHomeStackerClick}
          width="max-content"
        >
          {t('home_stacker')}
        </TertiaryButton>
      </>
    )
  } else if (stackerShuttleMissing) {
    renderModuleStatus = (
      <StatusLabel
        status={t('missing_shuttle')}
        backgroundColor={COLORS.yellow30}
        iconColor={COLORS.yellow60}
        textColor={COLORS.yellow60}
      />
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
  const portDisplay = parseModuleUSBPort(attachedModuleMatch)

  const fixtureDisplayName =
    comboFixtureId != null
      ? getFixtureDisplayName(t as TFunction, comboFixtureId)
      : displayName

  return (
    <>
      {showLocationConflictModal && cutoutIdForSlotName != null ? (
        <LocationConflictModal
          onCloseClick={() => {
            setShowLocationConflictModal(false)
          }}
          cutoutId={cutoutIdForSlotName}
          requiredModule={moduleModel}
          requiredFixtureId={comboFixtureId}
          moduleSerialNumber={attachedModuleMatch?.serialNumber}
          deckDef={deckDef}
          robotName={robotName}
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
        {showModuleSetupModal != null ? (
          <ModuleSetupModal
            close={() => {
              setShowModuleSetupModal(null)
            }}
            moduleDisplayName={showModuleSetupModal}
            moduleModel={moduleModel}
          />
        ) : null}
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={JUSTIFY_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Flex alignItems={JUSTIFY_CENTER} width="45%">
            <img
              width="60px"
              height="54px"
              src={
                comboFixtureId != null
                  ? getFixtureImage(comboFixtureId)
                  : getModuleImage(moduleModel)
              }
              alt={`Image of a ${fixtureDisplayName}`}
            />
            <Flex flexDirection={DIRECTION_COLUMN}>
              <LegacyStyledText
                css={TYPOGRAPHY.pSemiBold}
                marginLeft={SPACING.spacing20}
              >
                {fixtureDisplayName}
              </LegacyStyledText>
              {subText}
            </Flex>
          </Flex>
          <Flex
            width="15%"
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
          >
            <LegacyStyledText forwardedAs="p">
              {getModuleDeckLabel(moduleType, slotName)}
            </LegacyStyledText>
            {portDisplay != null ? (
              <LegacyStyledText forwardedAs="p">{portDisplay}</LegacyStyledText>
            ) : null}
          </Flex>
          <Flex
            width="15%"
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing10}
          >
            {conflictedFixture && isFlex ? (
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
                  onClick={() => {
                    setShowLocationConflictModal(true)
                  }}
                >
                  <LegacyStyledText forwardedAs="label" cursor="pointer">
                    {t('resolve')}
                  </LegacyStyledText>
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
