import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { last } from 'lodash'
import {
  Box,
  Flex,
  Text,
  DIRECTION_ROW,
  ALIGN_START,
  DIRECTION_COLUMN,
  TEXT_TRANSFORM_UPPERCASE,
  SPACING,
  FONT_WEIGHT_REGULAR,
  FONT_SIZE_CAPTION,
  TYPOGRAPHY,
  useOnClickOutside,
  Btn,
  TEXT_DECORATION_UNDERLINE,
  IconProps,
  Tooltip,
  useHoverTooltip,
  COLORS,
  Icon,
  ModuleIcon,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  HS_TOO_HOT_TEMP,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { RUN_STATUS_FINISHING, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { useHistory } from 'react-router-dom'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { updateModule } from '../../../redux/modules'
import {
  useDispatchApiRequest,
  getRequestById,
  PENDING,
  FAILURE,
  getErrorResponseMessage,
  dismissRequest,
  SUCCESS,
} from '../../../redux/robot-api'
import { Banner } from '../../../atoms/Banner'
import { Toast } from '../../../atoms/Toast'
import { useCurrentRunStatus } from '../../RunTimeControl/hooks'
import { HeaterShakerWizard } from '../HeaterShakerWizard'
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
import { FirmwareUpdateFailedModal } from './FirmwareUpdateFailedModal'

import magneticModule from '../../../assets/images/magnetic_module_gen_2_transparent.svg'
import temperatureModule from '../../../assets/images/temp_deck_gen_2_transparent.svg'
import thermoModule from '../../../assets/images/thermocycler_closed.svg'
import heaterShakerModule from '../../../assets/images/heatershaker_module_transparent.svg'

import type {
  AttachedModule,
  HeaterShakerModule,
} from '../../../redux/modules/types'
import type { State, Dispatch } from '../../../redux/types'
import type { RequestState } from '../../../redux/robot-api/types'

interface ModuleCardProps {
  module: AttachedModule
  robotName: string
  runId?: string
  slotName?: string
}

export const ModuleCard = (props: ModuleCardProps): JSX.Element | null => {
  const { t } = useTranslation('device_details')
  const { module, robotName, runId, slotName } = props
  const dispatch = useDispatch<Dispatch>()
  const [showOverflowMenu, setShowOverflowMenu] = React.useState(false)
  const [showSlideout, setShowSlideout] = React.useState(false)
  const [hasSecondary, setHasSecondary] = React.useState(false)
  const [showSuccessToast, setShowSuccessToast] = React.useState(false)
  const [showAboutModule, setShowAboutModule] = React.useState(false)
  const [showTestShake, setShowTestShake] = React.useState(false)
  const [showBanner, setShowBanner] = React.useState<boolean>(true)
  const [showWizard, setShowWizard] = React.useState<boolean>(false)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const history = useHistory()
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

  const moduleOverflowWrapperRef = useOnClickOutside({
    onClickOutside: () => setShowOverflowMenu(false),
  }) as React.RefObject<HTMLDivElement>

  const isTooHot =
    module.moduleModel === 'heaterShakerModuleV1' &&
    module.data.currentTemperature != null &&
    module.data.currentTemperature > HS_TOO_HOT_TEMP

  let image = ''
  let moduleData: JSX.Element = <div></div>
  switch (module.moduleType) {
    case 'magneticModuleType': {
      image = magneticModule
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
      image = temperatureModule
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
      image = thermoModule
      moduleData = (
        <ThermocyclerModuleData
          status={module.data.status}
          currentTemp={module.data.currentTemperature}
          targetTemp={module.data.targetTemperature}
          lidTarget={module.data.lidTargetTemperature}
          lidTemp={module.data.lidTemperature}
        />
      )
      break
    }

    case 'heaterShakerModuleType': {
      image = heaterShakerModule
      moduleData = (
        <HeaterShakerModuleData
          heaterStatus={module.data.temperatureStatus}
          shakerStatus={module.data.speedStatus}
          latchStatus={module.data.labwareLatchStatus}
          targetTemp={module.data.targetTemperature}
          currentTemp={module.data.currentTemperature}
          targetSpeed={module.data.targetSpeed}
          currentSpeed={module.data.currentSpeed}
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
    setShowOverflowMenu(false)
    setShowAboutModule(false)
  }

  const handleAboutClick = (): void => {
    setShowAboutModule(true)
    setShowOverflowMenu(false)
    setShowSlideout(false)
  }

  const handleTestShakeClick = (): void => {
    setShowTestShake(true)
    setShowOverflowMenu(false)
    setShowSlideout(false)
  }

  const handleWizardClick = (): void => {
    setShowWizard(true)
    setShowTestShake(false)
    setShowOverflowMenu(false)
    setShowSlideout(false)
  }

  return (
    <React.Fragment>
      <Flex
        backgroundColor={COLORS.background}
        borderRadius={SPACING.spacing2}
        marginBottom={SPACING.spacing3}
        marginLeft={SPACING.spacing2}
        marginRight={SPACING.spacing2}
        width={'100%'}
        data-testid={`ModuleCard_${module.serialNumber}`}
      >
        {showWizard && (
          <HeaterShakerWizard onCloseClick={() => setShowWizard(false)} />
        )}
        {showSlideout && runId != null ? (
          <ModuleSlideout
            module={module}
            runId={runId}
            isSecondary={hasSecondary}
            showSlideout={showSlideout}
            onCloseClick={() => setShowSlideout(false)}
          />
        ) : (
          <ModuleSlideout
            module={module}
            isSecondary={hasSecondary}
            showSlideout={showSlideout}
            onCloseClick={() => setShowSlideout(false)}
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
            runId={runId}
          />
        )}
        <Box padding={`${SPACING.spacing4} ${SPACING.spacing3}`} width="100%">
          <Flex flexDirection={DIRECTION_ROW} paddingRight={SPACING.spacing3}>
            <Flex alignItems={ALIGN_START} opacity={isPending ? '50%' : '100%'}>
              <img
                width="60px"
                height="54px"
                src={image}
                alt={module.moduleModel}
              />
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingLeft={SPACING.spacing3}
            >
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
                        textDecoration={TEXT_DECORATION_UNDERLINE}
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
                        block: <Text fontSize={TYPOGRAPHY.fontSizeP} />,
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
                  <Text marginLeft={SPACING.spacing3}>
                    {t('updating_firmware')}
                  </Text>
                </Flex>
              ) : (
                <>
                  <Text
                    textTransform={TEXT_TRANSFORM_UPPERCASE}
                    color={COLORS.darkGrey}
                    fontWeight={FONT_WEIGHT_REGULAR}
                    fontSize={FONT_SIZE_CAPTION}
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
                  </Text>
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
                    <Text>{getModuleDisplayName(module.moduleModel)}</Text>
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
            onClick={() => {
              setShowOverflowMenu(prevShowOverflowMenu => !prevShowOverflowMenu)
            }}
          />
          {isOverflowBtnDisabled && (
            <Tooltip {...tooltipProps}>
              {t('module_actions_unavailable')}
            </Tooltip>
          )}
        </Box>
        {showOverflowMenu && (
          <div
            ref={moduleOverflowWrapperRef}
            data-testid={`ModuleCard_overflow_menu_${module.serialNumber}`}
          >
            <ModuleOverflowMenu
              handleAboutClick={handleAboutClick}
              module={module}
              runId={runId}
              handleSlideoutClick={handleMenuItemClick}
              handleTestShakeClick={handleTestShakeClick}
              handleWizardClick={handleWizardClick}
            />
          </div>
        )}
      </Flex>
    </React.Fragment>
  )
}

interface ModuleSlideoutProps {
  module: AttachedModule
  runId?: string
  isSecondary: boolean
  showSlideout: boolean
  onCloseClick: () => unknown
}

const ModuleSlideout = (props: ModuleSlideoutProps): JSX.Element => {
  const { module, runId, isSecondary, showSlideout, onCloseClick } = props

  if (module.moduleType === THERMOCYCLER_MODULE_TYPE) {
    return (
      <ThermocyclerModuleSlideout
        module={module}
        runId={runId}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
        isSecondaryTemp={isSecondary}
      />
    )
  } else if (module.moduleType === MAGNETIC_MODULE_TYPE) {
    return (
      <MagneticModuleSlideout
        module={module}
        runId={runId}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
      />
    )
  } else if (module.moduleType === TEMPERATURE_MODULE_TYPE) {
    return (
      <TemperatureModuleSlideout
        module={module}
        runId={runId}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
      />
    )
  } else {
    return (
      <HeaterShakerSlideout
        module={module}
        runId={runId}
        onCloseClick={onCloseClick}
        isExpanded={showSlideout}
        isSetShake={isSecondary}
      />
    )
  }
}
