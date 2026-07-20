import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import {
  Icon,
  InlineNotification,
  LegacyStyledText,
} from '@opentrons/components'
import {
  useRobotSettingsQuery,
  useUpdateRobotSettingMutation,
} from '@opentrons/react-api-client'

import { LANGUAGES, US_ENGLISH_DISPLAY_NAME } from '/app/i18n'
import { Navigation } from '/app/organisms/ODD/Navigation'
import {
  OnOffToggle,
  RobotSettingButton,
} from '/app/organisms/ODD/RobotSettingsDashboard'
import {
  DEV_INTERNAL_FLAGS,
  getAppLanguage,
  getConfig,
  getDevtoolsEnabled,
  getFeatureFlags,
  toggleConfigValue,
  toggleDevInternalFlag,
  toggleDevtools,
} from '/app/redux/config'
import { getLocalRobot, getRobotApiVersion } from '/app/redux/discovery'
import { UNREACHABLE } from '/app/redux/discovery/constants'
import { getRobotUpdateAvailable } from '/app/redux/robot-update'
import { useErrorRecoverySettingsToggle } from '/app/resources/errorRecovery'
import { useNetworkConnection } from '/app/resources/networking'
import {
  useDisableStackerSensors,
  useLEDLights,
} from '/app/resources/robot-settings'

import styles from './robotsettingslist.module.css'

import type { SetSettingOption } from '/app/organisms/ODD/RobotSettingsDashboard'
import type { Dispatch, State } from '/app/redux/types'

const HOME_GANTRY_SETTING_ID = 'disableHomeOnBoot'
interface RobotSettingsListProps {
  setCurrentOption: SetSettingOption
}

export function RobotSettingsList(props: RobotSettingsListProps): JSX.Element {
  const { setCurrentOption } = props
  const { t, i18n } = useTranslation([
    'device_settings',
    'app_settings',
    'branded',
  ])
  const dispatch = useDispatch<Dispatch>()
  const { updateRobotSetting } = useUpdateRobotSettingMutation()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const networkConnection = useNetworkConnection(robotName)

  const robotServerVersion =
    localRobot?.status != null ? getRobotApiVersion(localRobot) : null

  const robotSettingsQuery = useRobotSettingsQuery()
  const allRobotSettings = robotSettingsQuery.data?.settings ?? []

  const isHomeGantryOn =
    allRobotSettings.find(({ id }) => id === HOME_GANTRY_SETTING_ID)?.value ??
    false

  const robotUpdateType = useSelector((state: State) => {
    return localRobot != null && localRobot.status !== UNREACHABLE
      ? getRobotUpdateAvailable(state, localRobot)
      : null
  })
  const isUpdateAvailable = robotUpdateType === 'upgrade'
  const devToolsOn = useSelector(getDevtoolsEnabled)
  const { lightsEnabled, toggleLights } = useLEDLights()
  const { sensorsDisabled, toggleSensors } = useDisableStackerSensors()
  const { toggleERSettings, isEREnabled } = useErrorRecoverySettingsToggle()
  const automaticSoftwareUpdateDownloadsEnabled =
    useSelector(getConfig)?.update?.automaticallyDownloadUpdates
  const appLanguage = useSelector(getAppLanguage)
  const currentLanguageOption = LANGUAGES.find(lng => lng.value === appLanguage)

  const devInternalFlags = useSelector(getFeatureFlags)

  return (
    <div className={styles.main_content}>
      <Navigation />
      <div className={styles.settings_content}>
        <RobotSettingButton
          settingName={t('network_settings')}
          dataTestId="RobotSettingButton_network_settings"
          settingInfo={networkConnection?.connectionStatus}
          onClick={() => {
            setCurrentOption('NetworkSettings')
          }}
          iconName="wifi"
        />
        <Link to="/robot-settings/rename-robot">
          <RobotSettingButton
            settingName={t('robot_name')}
            settingInfo={robotName}
            onClick={() => {
              setCurrentOption('RobotName')
            }}
            iconName="flex-robot"
          />
        </Link>
        <RobotSettingButton
          settingName={t('robot_system_version')}
          dataTestId="RobotSettingButton_robot_system_version"
          settingInfo={
            robotServerVersion != null
              ? `v${robotServerVersion}`
              : t('robot_settings_advanced_unknown')
          }
          onClick={() => {
            setCurrentOption('RobotSystemVersion')
          }}
          iconName="update"
          rightElement={
            <div className={styles.right_element_with_icon}>
              {isUpdateAvailable ? (
                <InlineNotification
                  type="alert"
                  heading={i18n.format(
                    t('app_settings:update_available'),
                    'capitalize'
                  )}
                  hug={true}
                />
              ) : null}
              <Icon name="more" className={styles.icon_large} color="#171717" />
            </div>
          }
        />
        <RobotSettingButton
          settingName={t('app_settings:language')}
          settingInfo={
            currentLanguageOption != null
              ? currentLanguageOption.name
              : US_ENGLISH_DISPLAY_NAME
          }
          onClick={() => {
            setCurrentOption('LanguageSetting')
          }}
          iconName="language"
        />
        <RobotSettingButton
          settingName={t('app_settings:file_manager')}
          settingInfo={t('app_settings:file_manager_description')}
          onClick={() => {
            setCurrentOption('FileManager')
          }}
          iconName="folder"
        />
        <RobotSettingButton
          settingName={t('display_led_lights')}
          dataTestId="RobotSettingButton_display_led_lights"
          settingInfo={t('display_led_lights_description')}
          iconName="light"
          rightElement={<OnOffToggle isOn={lightsEnabled} />}
          onClick={toggleLights}
        />
        <RobotSettingButton
          settingName={t('app_settings:automatically_download_updates')}
          dataTestId="RobotSettingButton_automatically_download_updates"
          settingInfo={t('app_settings:if_on_fetch_updates_in_the_background')}
          iconName="download"
          rightElement={
            <OnOffToggle
              isOn={automaticSoftwareUpdateDownloadsEnabled === true}
            />
          }
          onClick={() => {
            dispatch(toggleConfigValue('update.automaticallyDownloadUpdates'))
          }}
        />
        <RobotSettingButton
          settingName={t('touchscreen_sleep')}
          dataTestId="RobotSettingButton_touchscreen_sleep"
          onClick={() => {
            setCurrentOption('TouchscreenSleep')
          }}
          iconName="sleep"
        />
        <RobotSettingButton
          settingName={t('touchscreen_brightness')}
          dataTestId="RobotSettingButton_touchscreen_brightness"
          onClick={() => {
            setCurrentOption('TouchscreenBrightness')
          }}
          iconName="brightness"
        />
        <RobotSettingButton
          settingName={t('camera_preferences')}
          settingInfo={t('camera_preferences_description')}
          dataTestId="RobotSettingButton_camera_preferences"
          onClick={() => {
            setCurrentOption('CameraPreferences')
          }}
          iconName="camera"
        />
        <RobotSettingButton
          settingName={t('devices')}
          dataTestId="RobotSettingButton_devices"
          onClick={() => {
            setCurrentOption('Devices')
          }}
          iconName="device"
        />
        <RobotSettingButton
          settingName={t('app_settings:privacy')}
          dataTestId="RobotSettingButton_privacy"
          settingInfo={t('branded:choose_what_data_to_share')}
          onClick={() => {
            setCurrentOption('Privacy')
          }}
          iconName="privacy"
        />
        {devInternalFlags?.accessControlMode ? (
          <RobotSettingButton
            settingName={t('robot_encryption_key')}
            dataTestId="RobotSettingButton_encryption"
            onClick={() => {
              setCurrentOption('RobotEncryptionKey')
            }}
            iconName="verified"
          />
        ) : null}
        <RobotSettingButton
          settingName={i18n.format(
            t('app_settings:error_recovery_mode'),
            'titleCase'
          )}
          dataTestId="RobotSettingButton_error_recovery_mode"
          settingInfo={t('app_settings:error_recovery_mode_description')}
          iconName="recovery-alt"
          rightElement={<OnOffToggle isOn={isEREnabled} />}
          onClick={toggleERSettings}
        />
        <RobotSettingButton
          settingName={t('device_reset')}
          dataTestId="RobotSettingButton_device_reset"
          onClick={() => {
            setCurrentOption('DeviceReset')
          }}
          iconName="reset"
        />
        <RobotSettingButton
          settingName={t('gantry_homing')}
          dataTestId="RobotSettingButton_home_gantry_on_restart"
          settingInfo={t('gantry_homing_description')}
          iconName="gantry-homing"
          rightElement={<OnOffToggle isOn={!isHomeGantryOn} />}
          onClick={() => {
            updateRobotSetting({
              id: HOME_GANTRY_SETTING_ID,
              value: !isHomeGantryOn,
            })
          }}
        />
        <RobotSettingButton
          settingName={t('disable_stacker_sensors')}
          dataTestId="RobotSettingButton_disable_stacker_sensors"
          settingInfo={t('disable_stacker_sensors_description')}
          iconName="ot-flex-stacker"
          rightElement={<OnOffToggle isOn={sensorsDisabled} />}
          onClick={toggleSensors}
        />
        <RobotSettingButton
          settingName={t('app_settings:update_channel')}
          dataTestId="RobotSettingButton_update_channel"
          onClick={() => {
            setCurrentOption('UpdateChannel')
          }}
          iconName="update-channel"
        />
        <RobotSettingButton
          settingName={t('app_settings:enable_dev_tools')}
          dataTestId="RobotSettingButton_enable_dev_tools"
          settingInfo={t('dev_tools_description')}
          iconName="build"
          rightElement={<OnOffToggle isOn={devToolsOn} />}
          onClick={() => dispatch(toggleDevtools())}
        />
        {devToolsOn ? <FeatureFlags /> : null}
      </div>
    </div>
  )
}

function FeatureFlags(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const devInternalFlags = useSelector(getFeatureFlags)
  const dispatch = useDispatch<Dispatch>()
  return (
    <>
      {DEV_INTERNAL_FLAGS.map(flag => (
        <button
          key={flag}
          className={styles.feature_flag_button}
          onClick={() => {
            dispatch(toggleDevInternalFlag(flag))
          }}
        >
          <div className={styles.feature_flag_content}>
            <Icon
              name="ot-alert"
              className={styles.icon_large}
              color="#171717"
            />
            <div className={styles.feature_flag_text_content}>
              <LegacyStyledText
                forwardedAs="h4"
                className={styles.feature_flag_title}
              >
                {t(`__dev_internal__${flag}`)}
              </LegacyStyledText>
            </div>
          </div>
          <OnOffToggle isOn={Boolean(devInternalFlags?.[flag])} />
        </button>
      ))}
    </>
  )
}
