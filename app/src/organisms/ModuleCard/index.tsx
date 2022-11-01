import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import last from 'lodash/last'
import {
  Box,
  Flex,
  DIRECTION_ROW,
  ALIGN_START,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  useOnClickOutside,
  Btn,
  IconProps,
  useHoverTooltip,
  COLORS,
  Icon,
  ModuleIcon,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  HEATERSHAKER_MODULE_TYPE,
  TOO_HOT_TEMP,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { RUN_STATUS_FINISHING, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { useHistory } from 'react-router-dom'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { updateModule } from '../../redux/modules'
import {
  useDispatchApiRequest,
  getRequestById,
  PENDING,
  FAILURE,
  getErrorResponseMessage,
  dismissRequest,
  SUCCESS,
} from '../../redux/robot-api'
import { Banner } from '../../atoms/Banner'
import { Toast } from '../../atoms/Toast'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { Tooltip } from '../../atoms/Tooltip'
import { StyledText } from '../../atoms/text'
import { useCurrentRunStatus } from '../RunTimeControl/hooks'
import { HeaterShakerWizard } from '../Devices/HeaterShakerWizard'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { MagneticModuleData } from './MagneticModuleData'
import { TemperatureModuleData } from './TemperatureModuleData'
import { ThermocyclerModuleData } from './ThermocyclerModuleData'
import { ModuleOverflowMenu } from './ModuleOverflowMenu'
import { ThermocyclerModuleSlideout } from './ThermocyclerModuleSlideout'
import { MagneticModuleSlideout } from './MagneticModuleSlideout'
import { TemperatureModuleSlideout } from './TemperatureModuleSlideout'
import { AboutModuleSlideout } from './AboutModuleSlideout'
import { HeaterShakerModuleData } from './HeaterShakerModuleData'
import { HeaterShakerSlideout } from './HeaterShakerSlideout'
import { TestShakeSlideout } from './TestShakeSlideout'
import { getModuleCardImage } from './utils'
import { FirmwareUpdateFailedModal } from './FirmwareUpdateFailedModal'
import { ErrorInfo } from './ErrorInfo'

import type {
  AttachedModule,
  HeaterShakerModule,
} from '../../redux/modules/types'
import type { State, Dispatch } from '../../redux/types'
import type { RequestState } from '../../redux/robot-api/types'

interface ModuleCardProps {
  module: AttachedModule
  robotName: string
  isLoadedInRun: boolean
  runId?: string
  slotName?: string
}

export const ModuleCard = (props: ModuleCardProps): JSX.Element | null => {
  const { t } = useTranslation('device_details')
  const { module, robotName, isLoadedInRun, runId, slotName } = props
  const dispatch = useDispatch<Dispatch>()
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const moduleOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowOverflowMenu(false),
  })
  const [showSlideout, setShowSlideout] = React.useState(false)
  const [hasSecondary, setHasSecondary] = React.useState(false)
  const [showSuccessToast, setShowSuccessToast] = React.useState(false)
  const [showAboutModule, setShowAboutModule] = React.useState(false)
  const [showTestShake, setShowTestShake] = React.useState(false)
  const [showBanner, setShowBanner] = React.useState<boolean>(true)
  const [showWizard, setShowWizard] = React.useState<boolean>(false)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const history = useHistory()
  const currentRunId = useCurrentRunId()
  const [dispatchApiRequest, requestIds] = useDispatchApiRequest()
  const runStatus = useCurrentRunStatus({
    onSettled: data => {
      if (data == null) {
        history.push('/upload')
      }
    },
  })
  const latestRequestId = last(requestIds)
  const latestRequest = useSelector<State, RequestState | null>(state =>
    latestRequestId ? getRequestById(state, latestRequestId) : null
  )
  const handleCloseErrorModal = (): void => {
    if (latestRequestId != null) {
      dispatch(dismissRequest(latestRequestId))
    }
  }
  const handleUpdateClick = (): void => {
    robotName &&
      dispatchApiRequest(updateModule(robotName, module.serialNumber))
  }
  React.useEffect(() => {
    if (
      module.hasAvailableUpdate === false &&
      latestRequest?.status === SUCCESS
    ) {
      setShowSuccessToast(true)
    }
  }, [module.hasAvailableUpdate, latestRequest?.status])

  const isPending = latestRequest?.status === PENDING
  const hotToTouch: IconProps = { name: 'ot-hot-to-touch' }

  const isOverflowBtnDisabled =
    runStatus === RUN_STATUS_RUNNING || runStatus === RUN_STATUS_FINISHING

  const heaterShakerTooHot =
    module.moduleModel === 'heaterShakerModuleV1' &&
    module.data.currentTemperature != null &&
    module.data.currentTemperature > TOO_HOT_TEMP

  const ThermoTooHot =
    module.moduleType === THERMOCYCLER_MODULE_TYPE &&
    ((module.data.currentTemperature != null &&
      module.data.currentTemperature > TOO_HOT_TEMP) ||
      (module.data.lidTemperature != null &&
        module.data.lidTemperature > TOO_HOT_TEMP))

  const isTooHot = heaterShakerTooHot || ThermoTooHot

  let moduleData: JSX.Element = <div></div>
  switch (module.moduleType) {
    case 'magneticModuleType': {
      moduleData = (
        <MagneticModuleData
          moduleStatus={module.data.status}
          moduleHeight={module.data.height}
          moduleModel={module.moduleModel}
        />
      )
      break
    }

    case 'temperatureModuleType': {
      moduleData = (
        <TemperatureModuleData
          moduleStatus={module.data.status}
          targetTemp={module.data.targetTemperature}
          currentTemp={module.data.currentTemperature}
        />
      )
      break
    }

    case 'thermocyclerModuleType': {
      moduleData = <ThermocyclerModuleData data={module.data} />
      break
    }

    case 'heaterShakerModuleType': {
      moduleData = (
        <HeaterShakerModuleData
          moduleData={module.data}
          showTemperatureData={true}
        />
      )
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

  const handleWizardClick = (): void => {
    setShowWizard(true)
  }

  return (
    <Flex
      backgroundColor={COLORS.fundamentalsBackground}
      borderRadius={SPACING.spacing2}
      width="100%"
      data-testid={`ModuleCard_${module.serialNumber}`}
    >
      {showWizard && module.moduleType === HEATERSHAKER_MODULE_TYPE && (
        <HeaterShakerWizard
          onCloseClick={() => setShowWizard(false)}
          attachedModule={module}
        />
      )}
      {showSlideout && (
        <ModuleSlideout
          module={module}
          runId={currentRunId != null ? currentRunId : undefined}
          isSecondary={hasSecondary}
          showSlideout={showSlideout}
          onCloseClick={() => setShowSlideout(false)}
          isLoadedInRun={isLoadedInRun}
        />
      )}
      {showAboutModule && (
        <AboutModuleSlideout
          module={module}
          isExpanded={showAboutModule}
          onCloseClick={() => setShowAboutModule(false)}
          firmwareUpdateClick={handleUpdateClick}
        />
      )}
      {showTestShake && (
        <TestShakeSlideout
          module={module as HeaterShakerModule}
          isExpanded={showTestShake}
          onCloseClick={() => setShowTestShake(false)}
          isLoadedInRun={isLoadedInRun}
          currentRunId={currentRunId != null ? currentRunId : undefined}
        />
      )}
      <Box padding={`${SPACING.spacing4} ${SPACING.spacing3}`} width="100%">
        <Flex flexDirection={DIRECTION_ROW} paddingRight={SPACING.spacing3}>
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
            paddingLeft={SPACING.spacing3}
          >
            <ErrorInfo attachedModule={module} />
            {showSuccessToast && (
              <Toast
                message={t('firmware_update_installation_successful')}
                type="success"
                onClose={() => setShowSuccessToast(false)}
              />
            )}
            {latestRequest != null && latestRequest.status === FAILURE && (
              <FirmwareUpdateFailedModal
                module={module}
                onCloseClick={handleCloseErrorModal}
                errorMessage={getErrorResponseMessage(latestRequest.error)}
              />
            )}
            {module.hasAvailableUpdate && showBanner && !isPending ? (
              <Flex
                paddingBottom={SPACING.spacing2}
                width="100%"
                flexDirection={DIRECTION_COLUMN}
                data-testid={`ModuleCard_firmware_update_banner_${module.serialNumber}`}
              >
                <Banner
                  type="warning"
                  onCloseClick={() => setShowBanner(false)}
                >
                  <Flex flexDirection={DIRECTION_COLUMN}>
                    {t('firmware_update_available')}
                    <Btn
                      textAlign={ALIGN_START}
                      fontSize={TYPOGRAPHY.fontSizeP}
                      textDecoration={TYPOGRAPHY.textDecorationUnderline}
                      onClick={() => handleUpdateClick()}
                    >
                      {t('update_now')}
                    </Btn>
                  </Flex>
                </Banner>
              </Flex>
            ) : null}
            {isTooHot ? (
              <Flex
                width="100%"
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacingM}
                paddingBottom={SPACING.spacing3}
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
                  width={SPACING.spacingSM}
                  name="ot-spinner"
                  spin
                  aria-label="ot-spinner"
                />
                <StyledText marginLeft={SPACING.spacing3}>
                  {t('updating_firmware')}
                </StyledText>
              </Flex>
            ) : (
              <>
                <StyledText
                  textTransform={TYPOGRAPHY.textTransformUppercase}
                  color={COLORS.darkGreyEnabled}
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  fontSize={TYPOGRAPHY.fontSizeH6}
                  paddingBottom={SPACING.spacing2}
                  data-testid={`module_card_usb_port_${module.serialNumber}`}
                >
                  {module.moduleType !== THERMOCYCLER_MODULE_TYPE &&
                  slotName != null
                    ? t('deck_slot', { slot: slotName }) + ' - '
                    : null}
                  {t(module.usbPort.port === null ? 'usb_hub' : 'usb_port', {
                    port: module.usbPort.hub ?? module.usbPort.port,
                  })}
                </StyledText>
                <Flex
                  paddingBottom={SPACING.spacing2}
                  data-testid={`ModuleCard_display_name_${module.serialNumber}`}
                  fontSize={TYPOGRAPHY.fontSizeP}
                >
                  <ModuleIcon
                    moduleType={module.moduleType}
                    size="1rem"
                    marginRight={SPACING.spacing1}
                    color={COLORS.darkGreyEnabled}
                  />
                  <StyledText>
                    {getModuleDisplayName(module.moduleModel)}
                  </StyledText>
                </Flex>
              </>
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
        padding={SPACING.spacing2}
        data-testid={`ModuleCard_overflow_btn_${module.serialNumber}`}
        opacity={isPending ? '50%' : '100%'}
      >
        <OverflowBtn
          aria-label="overflow"
          disabled={isOverflowBtnDisabled}
          {...targetProps}
          onClick={handleOverflowClick}
        />
        {isOverflowBtnDisabled && (
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
            onClick={() => setShowOverflowMenu(false)}
          >
            <ModuleOverflowMenu
              handleAboutClick={handleAboutClick}
              module={module}
              robotName={robotName}
              runId={runId}
              handleSlideoutClick={handleMenuItemClick}
              handleTestShakeClick={handleTestShakeClick}
              handleWizardClick={handleWizardClick}
              isLoadedInRun={isLoadedInRun}
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
  runId?: string
  isSecondary: boolean
  showSlideout: boolean
  isLoadedInRun: boolean
  onCloseClick: () => unknown
}

const ModuleSlideout = (props: ModuleSlideoutProps): JSX.Element => {
  const {
    module,
    runId,
    isSecondary,
    showSlideout,
    onCloseClick,
    isLoadedInRun,
  } = props

  if (module.moduleType === THERMOCYCLER_MODULE_TYPE) {
    return (
      <ThermocyclerModuleSlideout
        module={module}
        currentRunId={runId}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
        isSecondaryTemp={isSecondary}
        isLoadedInRun={isLoadedInRun}
      />
    )
  } else if (module.moduleType === MAGNETIC_MODULE_TYPE) {
    return (
      <MagneticModuleSlideout
        module={module}
        currentRunId={runId}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
        isLoadedInRun={isLoadedInRun}
      />
    )
  } else if (module.moduleType === TEMPERATURE_MODULE_TYPE) {
    return (
      <TemperatureModuleSlideout
        module={module}
        currentRunId={runId}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
        isLoadedInRun={isLoadedInRun}
      />
    )
  } else {
    return (
      <HeaterShakerSlideout
        module={module}
        currentRunId={runId}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
        isLoadedInRun={isLoadedInRun}
      />
    )
  }
}
