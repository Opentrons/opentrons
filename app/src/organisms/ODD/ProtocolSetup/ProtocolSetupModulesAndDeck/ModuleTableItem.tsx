import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  Chip,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getFixtureDisplayName,
  getModuleDisplayName,
  getModuleType,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { SmallButton } from '/app/atoms/buttons'
import { getFlexStackerPrepCommands } from '/app/local-resources/modules'
import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { OddModal } from '/app/molecules/OddModal'
import { useIsDoorOpen } from '/app/organisms/DoorOpenControl/useIsDoorOpen'
import { LocationConflictModal } from '/app/organisms/LocationConflictModal'
import { ModuleWizardFlows } from '/app/organisms/ModuleWizardFlows'
import { useToaster } from '/app/organisms/ToasterOven'
import { getModuleTooHot } from '/app/transformations/modules'

import type { TFunction } from 'i18next'
import type { AttachedModule, CommandData } from '@opentrons/api-client'
import type {
  CutoutConfig,
  CutoutFixtureId,
  DeckDefinition,
  ModuleModel,
} from '@opentrons/shared-data'
import type { ModulePrepCommandsType } from '/app/local-resources/modules'
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

    // Absorbance reader module does not require calibration
    if (
      attachedModule.moduleType !== ABSORBANCE_READER_TYPE &&
      attachedModule.moduleOffset?.last_modified == null
    ) {
      // check if instrument ready to perform module calibration
      return !calibrationStatus.complete
        ? 'calibrationBlocked'
        : 'needsCalibration'
    }
    return 'connected'
  }
}

interface ModuleTableItemProps {
  calibrationStatus: ProtocolCalibrationStatus
  chainLiveCommands: (
    commands: ModulePrepCommandsType[],
    continuePastCommandFailure: boolean
  ) => Promise<CommandData[]>
  conflictedFixture: CutoutConfig | null
  module: AttachedProtocolModuleMatch
  deckDef: DeckDefinition
  robotName: string
  comboFixtureId?: CutoutFixtureId
}

export function ModuleTableItem({
  module,
  calibrationStatus,
  chainLiveCommands,
  conflictedFixture,
  deckDef,
  robotName,
  comboFixtureId,
}: ModuleTableItemProps): JSX.Element {
  const { i18n, t } = useTranslation([
    'protocol_setup',
    'module_wizard_flows',
    'deck_configuration',
  ])

  const { makeSnackbar } = useToaster()

  const handleCalibrate = (): void => {
    if (module.attachedModuleMatch != null) {
      if (getModuleTooHot(module.attachedModuleMatch)) {
        makeSnackbar(t('module_wizard_flows:module_too_hot') as string)
      } else {
        setShowModuleWizard(true)
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
      setShowHomeStackerWarning(false)
    }
  }

  const displayStatus = getModuleDisplayStatus(
    module.attachedModuleMatch,
    conflictedFixture,
    calibrationStatus
  )

  const [showModuleWizard, setShowModuleWizard] = useState<boolean>(false)
  const [showHomeStackerWarning, setShowHomeStackerWarning] = useState<boolean>(
    false
  )
  const [
    showLocationConflictModal,
    setShowLocationConflictModal,
  ] = useState<boolean>(false)

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
          <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
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

  const getModuleLocation = (moduleModel: ModuleModel): string => {
    const moduleType = getModuleType(moduleModel)
    if (moduleType === THERMOCYCLER_MODULE_TYPE) {
      return TC_MODULE_LOCATION_OT3
    } else if (moduleType === FLEX_STACKER_MODULE_TYPE) {
      return `${module.slotName.charAt(0)}4`
    } else {
      return module.slotName
    }
  }

  return (
    <>
      {showModuleWizard && module.attachedModuleMatch != null ? (
        <ModuleWizardFlows
          attachedModule={module.attachedModuleMatch}
          closeFlow={() => {
            setShowModuleWizard(false)
          }}
          robotName={robotName}
        />
      ) : null}
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
          <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {comboFixtureId != null
              ? getFixtureDisplayName(t as TFunction, comboFixtureId)
              : getModuleDisplayName(module.moduleDef.model)}
          </LegacyStyledText>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} flex="2 0 0">
          <DeckInfoLabel
            deckLabel={getModuleLocation(module.moduleDef.model)}
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
