import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  Chip,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  RobotInfoLabel,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { isDocumentedMutationError } from '@opentrons/react-api-client'
import {
  FLEX_STACKER_MODULE_TYPE,
  getFixtureDisplayName,
  getModuleDeckLabel,
  getModuleDisplayName,
} from '@opentrons/shared-data'

import { SmallButton } from '/app/atoms/buttons'
import {
  getFlexStackerPrepActions,
  getFlexStackerPrepCommands,
} from '/app/local-resources/modules'
import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { OddModal } from '/app/molecules/OddModal'
import { useIsDoorOpen } from '/app/organisms/DoorOpenControl/useIsDoorOpen'
import { LocationConflictModal } from '/app/organisms/LocationConflictModal'
import { handleModuleWizardFlows } from '/app/organisms/ModuleWizardFlows'
import { useToaster } from '/app/organisms/ToasterOven'
import { useChainLiveCommands } from '/app/resources/runs'
import { getModuleTooHot } from '/app/transformations/modules'

import { getDoesModuleRequireCalibration } from './utils'

import type { TFunction } from 'i18next'
import type { AttachedModule } from '@opentrons/api-client'
import type {
  CutoutConfig,
  CutoutFixtureId,
  DeckDefinition,
} from '@opentrons/shared-data'
import type { ProtocolCalibrationStatus } from '/app/resources/runs'
import type { AttachedProtocolModuleMatch } from '/app/transformations/analysis'

export type ModuleStatusType =
  | 'locationConflict'
  | 'disconnected'
  | 'shuttleMissing'
  | 'calibrationBlocked'
  | 'needsCalibration'
  | 'needsHome'
  | 'connected' // when the module is connected and ready

export const getModuleDisplayStatus = (
  attachedModule: AttachedModule | null,
  conflictedFixture: CutoutConfig | null,
  calibrationStatus: ProtocolCalibrationStatus
): ModuleStatusType => {
  // deck location conflict
  if (conflictedFixture != null) {
    return 'locationConflict'
  }
  // module is not connected
  if (attachedModule == null) {
    return 'disconnected'
  } else {
    // flex stacker module does not require calibration
    // but needs to check for missing shuttle or home
    if (attachedModule.moduleType === FLEX_STACKER_MODULE_TYPE) {
      if (attachedModule.data.platformState === 'missing') {
        return 'shuttleMissing'
      }
      if (
        attachedModule.data.platformState !== 'extended' ||
        attachedModule.data.latchState !== 'closed'
      ) {
        return 'needsHome'
      }
      return 'connected'
    }

    if (getDoesModuleRequireCalibration(attachedModule)) {
      return !calibrationStatus.complete
        ? 'calibrationBlocked'
        : 'needsCalibration'
    }
    return 'connected'
  }
}

interface ModuleTableItemProps {
  calibrationStatus: ProtocolCalibrationStatus
  conflictedFixture: CutoutConfig | null
  module: AttachedProtocolModuleMatch
  deckDef: DeckDefinition
  robotName: string
  runId: string
  comboFixtureId?: CutoutFixtureId
}

export function ModuleTableItem({
  module,
  calibrationStatus,
  conflictedFixture,
  deckDef,
  robotName,
  runId,
  comboFixtureId,
}: ModuleTableItemProps): JSX.Element {
  const { i18n, t } = useTranslation([
    'protocol_setup',
    'module_wizard_flows',
    'deck_configuration',
  ])

  const { makeSnackbar } = useToaster()

  // NOTE (jj 9/4/26): chainLiveCommands is only used here to home this row's Flex Stacker.
  // If it is ever used to send other commands, this will need updating.
  const actionsToDocument = useMemo(
    () => getFlexStackerPrepActions([module.attachedModuleMatch]),
    [module.attachedModuleMatch]
  )
  const { chainLiveCommands } = useChainLiveCommands(actionsToDocument, runId)

  const handleCalibrate = (): void => {
    if (module.attachedModuleMatch != null) {
      if (getModuleTooHot(module.attachedModuleMatch)) {
        makeSnackbar(t('module_wizard_flows:module_too_hot') as string)
      } else {
        handleModuleWizardFlows({
          attachedModule: module.attachedModuleMatch,
          robotName,
        })
      }
    } else {
      makeSnackbar(t('attach_module') as string)
    }
  }

  const isDoorOpen = useIsDoorOpen(robotName)
  const homeStacker = (): void => {
    if (module.attachedModuleMatch?.moduleType === FLEX_STACKER_MODULE_TYPE) {
      chainLiveCommands(
        getFlexStackerPrepCommands(module.attachedModuleMatch),
        // if the close latch command fails, we still want to home the shuttle
        true
      )
        .then(() => {
          setShowHomeStackerWarning(false)
        })
        .catch(error => {
          if (!isDocumentedMutationError(error)) {
            setShowHomeStackerWarning(false)
          }
        })
    }
  }

  const displayStatus = getModuleDisplayStatus(
    module.attachedModuleMatch,
    conflictedFixture,
    calibrationStatus
  )

  const [showHomeStackerWarning, setShowHomeStackerWarning] =
    useState<boolean>(false)
  const [showLocationConflictModal, setShowLocationConflictModal] =
    useState<boolean>(false)

  const homeStackerWarningModal = (): JSX.Element => {
    return (
      <OddModal header={{ title: t('home_stacker') }}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing32}
          width="100%"
        >
          <OddInfoScreen
            type="warning"
            header={t('home_stacker_warning_title')}
            subText={t('home_stacker_warning_description')}
            padding={SPACING.spacing24}
            gridGap={SPACING.spacing16}
          />
          <Flex gridGap={SPACING.spacing8} width="100%">
            <SmallButton
              width="100%"
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              buttonType="secondary"
              buttonText={t('shared:cancel')}
              onClick={() => {
                setShowHomeStackerWarning(false)
              }}
            />
            <SmallButton
              width="100%"
              buttonType="primary"
              buttonText={t('home_stacker')}
              onClick={homeStacker}
            />
          </Flex>
        </Flex>
      </OddModal>
    )
  }

  const buildModuleDisplay = (): JSX.Element => {
    switch (displayStatus) {
      case 'locationConflict':
        return (
          <>
            <Chip
              text={t('location_conflict')}
              type="warning"
              background={false}
              iconName="connection-status"
            />
            <SmallButton
              buttonCategory="rounded"
              buttonText={t('resolve')}
              onClick={() => {
                setShowLocationConflictModal(true)
              }}
            />
          </>
        )
      case 'connected':
        return (
          <Chip
            text={t('module_connected')}
            type="success"
            background={false}
            iconName="connection-status"
          />
        )
      case 'shuttleMissing':
        return (
          <Chip
            text={t('missing_shuttle')}
            type="warning"
            background={false}
            iconName="ot-alert"
          />
        )
      case 'calibrationBlocked':
        return (
          <LegacyStyledText
            forwardedAs="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {calibrationStatus?.reason === 'attach_pipette_failure_reason'
              ? t('calibration_required_attach_pipette_first')
              : t('calibration_required_calibrate_pipette_first')}
          </LegacyStyledText>
        )
      case 'needsCalibration':
        return (
          <SmallButton
            buttonCategory="rounded"
            buttonText={i18n.format(t('calibrate'), 'capitalize')}
            onClick={handleCalibrate}
          />
        )
      case 'needsHome':
        return (
          <>
            {showHomeStackerWarning && homeStackerWarningModal()}
            <SmallButton
              buttonCategory="rounded"
              buttonText={t('home_stacker')}
              onClick={() => {
                isDoorOpen ? setShowHomeStackerWarning(true) : homeStacker()
              }}
            />
          </>
        )
      case 'disconnected':
      default:
        return (
          <Chip
            text={t('module_disconnected')}
            type="warning"
            background={false}
            iconName="connection-status"
          />
        )
    }
  }

  return (
    <>
      {showLocationConflictModal && conflictedFixture != null ? (
        <LocationConflictModal
          onCloseClick={() => {
            setShowLocationConflictModal(false)
          }}
          cutoutId={conflictedFixture.cutoutId}
          requiredModule={module.moduleDef.model}
          requiredFixtureId={comboFixtureId}
          deckDef={deckDef}
          moduleSerialNumber={module.attachedModuleMatch?.serialNumber}
          isOnDevice={true}
          robotName={robotName}
        />
      ) : null}
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={
          displayStatus === 'connected' ? COLORS.green35 : COLORS.yellow35
        }
        borderRadius={BORDERS.borderRadius8}
        cursor="inherit"
        gridGap={SPACING.spacing24}
        padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      >
        <Flex flex="3.5 0 0" alignItems={ALIGN_CENTER}>
          <LegacyStyledText
            forwardedAs="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {comboFixtureId != null
              ? getFixtureDisplayName(t as TFunction, comboFixtureId)
              : getModuleDisplayName(module.moduleDef.model)}
          </LegacyStyledText>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} flex="2 0 0">
          <RobotInfoLabel
            deckLabel={getModuleDeckLabel(
              module.moduleDef.moduleType,
              module.slotName
            )}
          />
        </Flex>
        <Flex
          flex="4 0 0"
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          {buildModuleDisplay()}
        </Flex>
      </Flex>
    </>
  )
}
