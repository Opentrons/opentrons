import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_START,
  Banner,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  ModuleIcon,
  OverflowBtn,
  SPACING,
  StyledText,
  SUCCESS_TOAST,
  Tooltip,
  TYPOGRAPHY,
  useHoverTooltip,
  useMenuHandleClickOutside,
  useOnClickOutside,
} from '@opentrons/components'
import {
  isDocumentedMutationError,
  useCurrentAllSubsystemUpdatesQuery,
  useUpdateModuleMutation,
} from '@opentrons/react-api-client'
import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getModuleDisplayName,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useModuleUSBPort } from '/app/local-resources/modules'
import { UpdateBanner } from '/app/molecules/UpdateBanner'
import { handleModuleWizardFlows } from '/app/organisms/ModuleWizardFlows'
import { useToaster } from '/app/organisms/ToasterOven'
import { useIsFlex } from '/app/redux-resources/robots'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useIsEstopNotDisengaged } from '/app/resources/devices'
import { useRunStatuses } from '/app/resources/runs'
import { getModuleTooHot } from '/app/transformations/modules'

import { AboutModuleSlideout } from './AboutModuleSlideout'
import { AbsorbanceReaderData } from './AbsorbanceReaderData'
import {
  MODULE_INFO_DETAIL_TEXT_STYLE,
  MODULE_INFO_HEADER_TEXT_STYLE,
  MODULE_INFO_SUB_CONTAINER_STYLE,
} from './constants'
import { ErrorInfo } from './ErrorInfo'
import { FirmwareUpdateFailedModal } from './FirmwareUpdateFailedModal'
import { FlexStackerModuleData } from './FlexStackerModuleData'
import { HeaterShakerModuleData } from './HeaterShakerModuleData'
import { HeaterShakerSlideout } from './HeaterShakerSlideout'
import { MagneticModuleData } from './MagneticModuleData'
import { MagneticModuleSlideout } from './MagneticModuleSlideout'
import { ModuleOverflowMenu } from './ModuleOverflowMenu'
import { ModuleSetupModal } from './ModuleSetupModal'
import { TemperatureModuleData } from './TemperatureModuleData'
import { TemperatureModuleSlideout } from './TemperatureModuleSlideout'
import { TestShakeSlideout } from './TestShakeSlideout'
import { ThermocyclerModuleData } from './ThermocyclerModuleData'
import { ThermocyclerModuleSlideout } from './ThermocyclerModuleSlideout'
import {
  getModuleCalibrationRequired,
  getModuleCardImage,
  getModuleSetupRequired,
} from './utils'
import { VacuumModuleData } from './VacuumModule/VacuumModuleData'
import { VacuumModuleSlideout } from './VacuumModule/VacuumModuleSlideout'

import type { AttachedModule, HeaterShakerModule } from '@opentrons/api-client'
import type { IconProps } from '@opentrons/components'
import type { ModuleType } from '@opentrons/shared-data'

const HAS_SETUP_INSTRUCTIONS_TYPE: ModuleType[] = [
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  ABSORBANCE_READER_TYPE,
]

const POLL_INTERVAL_MS = 5000

interface ModuleCardProps {
  module: AttachedModule
  robotName: string
  isLoadedInRun: boolean
  attachPipetteRequired: boolean
  calibratePipetteRequired: boolean
  updatePipetteFWRequired: boolean
  runId?: string
  slotName?: string
}

export const ModuleCard = (props: ModuleCardProps): JSX.Element | null => {
  const { t } = useTranslation('device_details')

  const {
    module,
    robotName,
    isLoadedInRun,
    runId,
    slotName,
    attachPipetteRequired,
    calibratePipetteRequired,
    updatePipetteFWRequired,
  } = props
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const moduleOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })
  const [showSlideout, setShowSlideout] = useState(false)
  const [hasSecondary, setHasSecondary] = useState(false)
  const [showAboutModule, setShowAboutModule] = useState(false)
  const [showTestShake, setShowTestShake] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [showFWBanner, setShowFWBanner] = useState(true)
  const [targetProps, tooltipProps] = useHoverTooltip()

  const { isRunRunning } = useRunStatuses()
  const { parseModuleUSBPort } = useModuleUSBPort()
  const { makeToast } = useToaster()
  const documentationState = useDocumentationState()
  const {
    mutateAsync: updateModuleAsync,
    isLoading: isPending,
    isError,
    error,
    reset: resetUpdateModule,
  } = useUpdateModuleMutation(documentationState)

  const isPipetteReady =
    !Boolean(attachPipetteRequired) &&
    !Boolean(calibratePipetteRequired) &&
    !Boolean(updatePipetteFWRequired)

  const handleFirmwareUpdateClick = (): void => {
    void updateModuleAsync(module.serialNumber).then(() => {
      makeToast(t('firmware_updated_successfully') as string, SUCCESS_TOAST)
    })
  }

  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)

  const handleCloseErrorModal = (): void => {
    resetUpdateModule()
  }

  const { data: currentSubsystemsUpdatesData } =
    useCurrentAllSubsystemUpdatesQuery({
      refetchInterval: POLL_INTERVAL_MS,
    })
  const ongoingSubsystemUpdate = currentSubsystemsUpdatesData?.data.find(
    update =>
      update.updateStatus === 'queued' || update.updateStatus === 'updating'
  )

  const showFirmwareUpdateFailed =
    isError && error != null && !isDocumentedMutationError(error)

  const hideBanners =
    isPending || isRunRunning || ongoingSubsystemUpdate != null
  const hotToTouch: IconProps = { name: 'ot-hot-to-touch' }
  const isFlex = useIsFlex(robotName)
  const deckConfig = useNotifyDeckConfigurationQuery().data

  const requireModuleCalibration = getModuleCalibrationRequired(module, isFlex)
  const requireModuleSetup = getModuleSetupRequired(module, isFlex, deckConfig)
  const isTooHot = getModuleTooHot(module)

  let moduleData: JSX.Element = <div></div>
  switch (module.moduleType) {
    case MAGNETIC_MODULE_TYPE: {
      moduleData = (
        <MagneticModuleData
          moduleStatus={module.data.status}
          moduleHeight={module.data.height}
          moduleModel={module.moduleModel}
        />
      )
      break
    }

    case TEMPERATURE_MODULE_TYPE: {
      moduleData = (
        <TemperatureModuleData
          moduleStatus={module.data.status}
          targetTemp={module.data.targetTemperature}
          currentTemp={module.data.currentTemperature}
        />
      )
      break
    }

    case THERMOCYCLER_MODULE_TYPE: {
      moduleData = <ThermocyclerModuleData data={module.data} />
      break
    }

    case HEATERSHAKER_MODULE_TYPE: {
      moduleData = (
        <HeaterShakerModuleData
          moduleData={module.data}
          showTemperatureData={true}
        />
      )
      break
    }

    case ABSORBANCE_READER_TYPE: {
      moduleData = <AbsorbanceReaderData moduleData={module.data} />
      break
    }

    case FLEX_STACKER_MODULE_TYPE: {
      moduleData = <FlexStackerModuleData moduleData={module.data} />
      break
    }

    case VACUUM_MODULE_TYPE: {
      moduleData = <VacuumModuleData moduleData={module.data} />
      break
    }
  }

  const handleMenuItemClick = (isSecondary: boolean = false): void => {
    if (isSecondary) {
      setHasSecondary(true)
    } else {
      setHasSecondary(false)
    }
    setShowSlideout(true)
  }

  const handleAboutClick = (): void => {
    setShowAboutModule(true)
  }

  const handleTestShakeClick = (): void => {
    setShowTestShake(true)
  }

  const handleInstructionsClick = (): void => {
    setShowSetupWizard(true)
  }

  const handleSetupClick = (): void => {
    handleModuleWizardFlows({
      attachedModule: module,
      showSetupLauncher: true,
      isLoadedInRun,
      robotName,
    })
  }

  return (
    <Flex
      backgroundColor={COLORS.grey10}
      borderRadius={BORDERS.borderRadius8}
      width="100%"
      data-testid={`ModuleCard_${module.serialNumber}`}
    >
      {showSetupWizard &&
        HAS_SETUP_INSTRUCTIONS_TYPE.includes(module.moduleType) && (
          <ModuleSetupModal
            close={() => {
              setShowSetupWizard(false)
            }}
            moduleDisplayName={getModuleDisplayName(module.moduleModel)}
            moduleModel={module.moduleModel}
          />
        )}
      {showSlideout && (
        <ModuleSlideout
          module={module}
          isSecondary={hasSecondary}
          showSlideout={showSlideout}
          onCloseClick={() => {
            setShowSlideout(false)
          }}
        />
      )}
      {showAboutModule && (
        <AboutModuleSlideout
          module={module}
          isExpanded={showAboutModule}
          onCloseClick={() => {
            setShowAboutModule(false)
          }}
          firmwareUpdateClick={handleFirmwareUpdateClick}
        />
      )}
      {showTestShake && (
        <TestShakeSlideout
          module={module as HeaterShakerModule}
          isExpanded={showTestShake}
          onCloseClick={() => {
            setShowTestShake(false)
          }}
        />
      )}
      <Box
        paddingY={SPACING.spacing16}
        paddingLeft={SPACING.spacing16}
        width="100%"
      >
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
          <Flex alignItems={ALIGN_START} opacity={isPending ? '50%' : '100%'}>
            <img
              width="60px"
              height="54px"
              src={getModuleCardImage(module)}
              alt={module.moduleModel}
            />
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            flex="100%"
            gridGap={SPACING.spacing8}
          >
            <ErrorInfo attachedModule={module} />
            {showFirmwareUpdateFailed && (
              <FirmwareUpdateFailedModal
                module={module}
                onCloseClick={handleCloseErrorModal}
                errorMessage={error?.response?.data?.message ?? error?.message}
              />
            )}
            {!hideBanners &&
            (requireModuleCalibration || requireModuleSetup) ? (
              <UpdateBanner
                robotName={robotName}
                updateType={requireModuleCalibration ? 'calibration' : 'setup'}
                serialNumber={module.serialNumber}
                handleUpdateClick={handleSetupClick}
                attachPipetteRequired={attachPipetteRequired}
                calibratePipetteRequired={calibratePipetteRequired}
                updatePipetteFWRequired={updatePipetteFWRequired}
                isTooHot={isTooHot}
              />
            ) : !hideBanners && module.hasAvailableUpdate && showFWBanner ? (
              <UpdateBanner
                robotName={robotName}
                updateType="firmware"
                serialNumber={module.serialNumber}
                handleUpdateClick={handleFirmwareUpdateClick}
                handleCloseClick={() => {
                  setShowFWBanner(false)
                }}
              />
            ) : null}
            {isTooHot ? (
              <Flex
                width="100%"
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacing20}
                paddingBottom={SPACING.spacing8}
                data-testid={`ModuleCard_too_hot_banner_${module.serialNumber}`}
              >
                <Banner type="warning" icon={hotToTouch}>
                  <Trans
                    t={t}
                    i18nKey="hot_to_the_touch"
                    components={{
                      bold: <strong />,
                      block: <StyledText fontSize={TYPOGRAPHY.fontSizeP} />,
                    }}
                  />
                </Banner>
              </Flex>
            ) : null}
            {isPending ? (
              <Flex
                flexDirection={DIRECTION_ROW}
                fontSize={TYPOGRAPHY.fontSizeP}
                data-testid={`ModuleCard_update_pending_${module.serialNumber}`}
              >
                <Icon
                  width="10px"
                  name="ot-spinner"
                  spin
                  aria-label="ot-spinner"
                  color={COLORS.grey60}
                />
                <StyledText marginLeft={SPACING.spacing8}>
                  {t('updating_firmware')}
                </StyledText>
              </Flex>
            ) : (
              <Flex css={MODULE_INFO_SUB_CONTAINER_STYLE}>
                <StyledText
                  textTransform={TYPOGRAPHY.textTransformUppercase}
                  css={MODULE_INFO_HEADER_TEXT_STYLE}
                  data-testid={`module_card_usb_port_${module.serialNumber}`}
                >
                  {module.moduleType !== THERMOCYCLER_MODULE_TYPE &&
                  slotName != null
                    ? t('deck_slot', { slot: slotName }) + ' - '
                    : null}
                  {parseModuleUSBPort(module)}
                </StyledText>
                <Flex
                  data-testid={`ModuleCard_display_name_${module.serialNumber}`}
                  gridGap={SPACING.spacing4}
                >
                  <Flex alignItems={ALIGN_CENTER}>
                    <ModuleIcon
                      moduleType={module.moduleType}
                      size="1rem"
                      color={COLORS.grey60}
                    />
                  </Flex>
                  <StyledText css={MODULE_INFO_DETAIL_TEXT_STYLE}>
                    {getModuleDisplayName(module.moduleModel)}
                  </StyledText>
                </Flex>
              </Flex>
            )}
            <Flex
              opacity={isPending ? '50%' : '100%'}
              flexDirection={DIRECTION_COLUMN}
            >
              {moduleData}
            </Flex>
          </Flex>
        </Flex>
      </Box>

      <Box
        alignSelf={ALIGN_START}
        padding={SPACING.spacing4}
        data-testid={`ModuleCard_overflow_btn_${module.serialNumber}`}
        opacity={isPending ? '50%' : '100%'}
      >
        <OverflowBtn
          aria-label="overflow"
          disabled={isRunRunning || isEstopNotDisengaged}
          {...targetProps}
          onClick={handleOverflowClick}
        />
        {isRunRunning && (
          <Tooltip tooltipProps={tooltipProps}>
            {t('module_actions_unavailable')}
          </Tooltip>
        )}
      </Box>
      {showOverflowMenu && (
        <>
          <Box
            ref={moduleOverflowWrapperRef}
            data-testid={`ModuleCard_overflow_menu_${module.serialNumber}`}
            onClick={() => {
              setShowOverflowMenu(false)
            }}
          >
            <ModuleOverflowMenu
              handleAboutClick={handleAboutClick}
              module={module}
              robotName={robotName}
              runId={runId}
              isLoadedInRun={isLoadedInRun}
              isPipetteReady={isPipetteReady}
              isTooHot={isTooHot}
              handleSlideoutClick={handleMenuItemClick}
              handleTestShakeClick={handleTestShakeClick}
              handleInstructionsClick={handleInstructionsClick}
              handleCalibrateClick={handleSetupClick}
            />
          </Box>
          {menuOverlay}
        </>
      )}
    </Flex>
  )
}

interface ModuleSlideoutProps {
  module: AttachedModule
  isSecondary: boolean
  showSlideout: boolean
  onCloseClick: () => unknown
}

const ModuleSlideout = (props: ModuleSlideoutProps): JSX.Element => {
  const { module, isSecondary, showSlideout, onCloseClick } = props

  if (module.moduleType === THERMOCYCLER_MODULE_TYPE) {
    return (
      <ThermocyclerModuleSlideout
        module={module}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
        isSecondaryTemp={isSecondary}
      />
    )
  } else if (module.moduleType === MAGNETIC_MODULE_TYPE) {
    return (
      <MagneticModuleSlideout
        module={module}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
      />
    )
  } else if (module.moduleType === TEMPERATURE_MODULE_TYPE) {
    return (
      <TemperatureModuleSlideout
        module={module}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
      />
    )
  } else if (module.moduleType === HEATERSHAKER_MODULE_TYPE) {
    return (
      <HeaterShakerSlideout
        module={module}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
      />
    )
  } else if (module.moduleType === VACUUM_MODULE_TYPE) {
    return (
      <VacuumModuleSlideout
        module={module}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
      />
    )
  } else {
    return <></>
  }
}
