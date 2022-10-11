import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { css } from 'styled-components'

import {
  Flex,
  Box,
  Link,
  Icon,
  RadioGroup,
  SPACING_AUTO,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  useConditionalConfirm,
  JUSTIFY_FLEX_END,
  Btn,
  DIRECTION_ROW,
} from '@opentrons/components'

import * as Config from '../../redux/config'
import * as ProtocolAnalysis from '../../redux/protocol-analysis'
import * as Calibration from '../../redux/calibration'
import * as CustomLabware from '../../redux/custom-labware'
import {
  clearDiscoveryCache,
  getReachableRobots,
  getUnreachableRobots,
} from '../../redux/discovery'
import { Modal } from '../../molecules/Modal'
import { Portal } from '../../App/portal'
import { SelectOption } from '../../atoms/SelectField/Select'
import { SelectField } from '../../atoms/SelectField'
import { Toast } from '../../atoms/Toast'
import { useTrackEvent } from '../../redux/analytics'
import {
  getU2EAdapterDevice,
  getU2EWindowsDriverStatus,
  OUTDATED,
} from '../../redux/system-info'
import { Divider } from '../../atoms/structure'
import {
  AlertPrimaryButton,
  TertiaryButton,
  ToggleButton,
} from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'

import type { Dispatch, State } from '../../redux/types'

const ALWAYS_BLOCK: 'always-block' = 'always-block'
const ALWAYS_TRASH: 'always-trash' = 'always-trash'
const ALWAYS_PROMPT: 'always-prompt' = 'always-prompt'
const REALTEK_URL = 'https://www.realtek.com/en/'

type BlockSelection =
  | typeof ALWAYS_BLOCK
  | typeof ALWAYS_TRASH
  | typeof ALWAYS_PROMPT

export function AdvancedSettings(): JSX.Element {
  const { t } = useTranslation(['app_settings', 'shared'])
  const useTrashSurfaceForTipCal = useSelector((state: State) =>
    Config.getUseTrashSurfaceForTipCal(state)
  )
  const trackEvent = useTrackEvent()
  const devToolsOn = useSelector(Config.getDevtoolsEnabled)
  const channel = useSelector(Config.getUpdateChannel)
  const channelOptions: SelectOption[] = useSelector(
    Config.getUpdateChannelOptions
  )
  const labwarePath = useSelector(CustomLabware.getCustomLabwareDirectory)
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    Config.getIsLabwareOffsetCodeSnippetsOn
  )
  const isHeaterShakerAttachmentModalVisible = useSelector(
    Config.getIsHeaterShakerAttached
  )
  const pathToPythonInterpreter = useSelector(Config.getPathToPythonOverride)

  const dispatch = useDispatch<Dispatch>()
  const [showSuccessToast, setShowSuccessToast] = React.useState(false)
  const [showErrorToast, setShowErrorToast] = React.useState(false)
  const reachableRobots = useSelector((state: State) =>
    getReachableRobots(state)
  )
  const unreachableRobots = useSelector((state: State) =>
    getUnreachableRobots(state)
  )
  const recentlySeenRobots = reachableRobots.filter(
    robot => robot.healthStatus !== 'ok'
  )
  const isUnavailableRobots =
    unreachableRobots.length > 0 || recentlySeenRobots.length > 0

  const handleDeleteUnavailRobots = (): void => {
    if (isUnavailableRobots) {
      setShowSuccessToast(true)
      dispatch(clearDiscoveryCache())
    } else {
      setShowErrorToast(true)
    }
  }

  const {
    confirm: confirmDeleteUnavailRobots,
    showConfirmation: showConfirmDeleteUnavailRobots,
    cancel: cancelExit,
  } = useConditionalConfirm(handleDeleteUnavailRobots, true)

  const handleUseTrashSelection = (selection: BlockSelection): void => {
    switch (selection) {
      case ALWAYS_PROMPT:
        dispatch(Calibration.resetUseTrashSurfaceForTipCal())
        break
      case ALWAYS_BLOCK:
        dispatch(Calibration.setUseTrashSurfaceForTipCal(false))
        break
      case ALWAYS_TRASH:
        dispatch(Calibration.setUseTrashSurfaceForTipCal(true))
        break
    }
  }

  const device = useSelector(getU2EAdapterDevice)
  const driverOutdated = useSelector((state: State) => {
    const status = getU2EWindowsDriverStatus(state)
    return status === OUTDATED
  })

  const toggleLabwareOffsetData = (): unknown =>
    dispatch(
      Config.updateConfigValue(
        'labware.showLabwareOffsetCodeSnippets',
        Boolean(!isLabwareOffsetCodeSnippetsOn)
      )
    )

  const toggleHeaterShakerModalVisibilty = (): unknown =>
    dispatch(
      Config.updateConfigValue(
        'modules.heaterShaker.isAttached',
        Boolean(!isHeaterShakerAttachmentModalVisible)
      )
    )

  const handleClickPythonDirectoryChange: React.MouseEventHandler<HTMLButtonElement> = _event => {
    dispatch(ProtocolAnalysis.changePythonPathOverrideConfig())
    trackEvent({
      name: 'changePathToPythonDirectory',
      properties: {},
    })
  }

  const toggleDevtools = (): unknown => dispatch(Config.toggleDevtools())
  const handleChannel = (_: string, value: string): void => {
    dispatch(Config.updateConfigValue('update.channel', value))
  }
  const displayUnavailRobots = useSelector((state: State) => {
    return Config.getConfig(state)?.discovery.disableCache ?? false
  })

  const formatOptionLabel: React.ComponentProps<
    typeof SelectField
  >['formatOptionLabel'] = (option, index): JSX.Element => {
    const { label, value } = option
    return (
      <StyledText
        as="p"
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        id={index}
      >
        {value === 'latest' ? label : value}
      </StyledText>
    )
  }

  return (
    <>
      <Box paddingX={SPACING.spacing4} paddingY={SPACING.spacing5}>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacingXXL}
        >
          {showSuccessToast && (
            <Toast
              message={t('successfully_deleted_unavail_robots')}
              type="success"
              onClose={() => setShowSuccessToast(false)}
            />
          )}
          {showErrorToast && (
            <Toast
              message={t('no_unavail_robots_to_clear')}
              type="error"
              onClose={() => setShowErrorToast(false)}
            />
          )}
          {showConfirmDeleteUnavailRobots ? (
            <Portal level="top">
              <Modal
                type="warning"
                title={t('clear_unavailable_robots')}
                onClose={cancelExit}
              >
                <StyledText as="p">{t('clearing_cannot_be_undone')}</StyledText>
                <Flex
                  flexDirection={DIRECTION_ROW}
                  paddingTop={SPACING.spacingXL}
                  justifyContent={JUSTIFY_FLEX_END}
                >
                  <Flex
                    paddingRight={SPACING.spacing2}
                    data-testid="AdvancedSettings_ConfirmClear_Cancel"
                  >
                    <Btn
                      onClick={cancelExit}
                      textTransform={TYPOGRAPHY.textTransformCapitalize}
                      color={COLORS.blueEnabled}
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                      marginRight={SPACING.spacing6}
                    >
                      {t('shared:cancel')}
                    </Btn>
                  </Flex>
                  <Flex data-testid="AdvancedSettings_ConfirmClear_Proceed">
                    <AlertPrimaryButton onClick={confirmDeleteUnavailRobots}>
                      {t('clear_confirm')}
                    </AlertPrimaryButton>
                  </Flex>
                </Flex>
              </Modal>
            </Portal>
          ) : null}
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_updatedChannel"
            >
              {t('update_channel')}
            </StyledText>
            <StyledText as="p" paddingBottom={SPACING.spacing3}>
              {t('update_description')}
            </StyledText>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
            <StyledText css={TYPOGRAPHY.labelSemiBold}>{t('channel')}</StyledText>
            <SelectField
              name={'__UpdateChannel__'}
              options={channelOptions}
              onValueChange={handleChannel}
              value={channel}
              placeholder={channel}
              formatOptionLabel={formatOptionLabel}
              isSearchable={false}
              width="10rem"
            />
          </Flex>
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN} gridGap={SPACING.spacingXXL}>
          <Flex flexDirection={DIRECTION_COLUMN} >
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_customLabware"
            >
              {t('additional_labware_folder_title')}
            </StyledText>
            <StyledText as="p" paddingBottom={SPACING.spacing3}>
              {t('additional_folder_description')}
            </StyledText>
            <StyledText
              as="h6"
              textTransform={TYPOGRAPHY.textTransformUppercase}
              color={COLORS.darkGreyEnabled}
              paddingBottom={SPACING.spacing2}
            >
              {t('additional_folder_location')}
            </StyledText>
            {labwarePath !== '' ? (
              <Link
                role="button"
                css={TYPOGRAPHY.pRegular}
                color={COLORS.darkBlackEnabled}
                onClick={() =>
                  dispatch(CustomLabware.openCustomLabwareDirectory())
                }
                id="AdvancedSettings_sourceFolderLink"
              >
                {labwarePath}
                <Icon
                  height="0.75rem"
                  marginLeft={SPACING.spacing3}
                  name="open-in-new"
                />
              </Link>
            ) : (
              <StyledText as="p">{t('no_folder')}</StyledText>
            )}
          </Flex>
          {
            <TertiaryButton
              marginLeft={SPACING_AUTO}
              onClick={() => {
                dispatch(CustomLabware.changeCustomLabwareDirectory())
                trackEvent({
                  name: 'changeCustomLabwareSourceFolder',
                  properties: {},
                })
              }}
              id="AdvancedSettings_changeLabwareSource"
            >
              {labwarePath !== ''
                ? t('change_folder_button')
                : t('add_folder_button')}
            </TertiaryButton>
          }
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Box>
          <StyledText
            css={TYPOGRAPHY.h3SemiBold}
            paddingBottom={SPACING.spacing3}
            id="AdvancedSettings_tipLengthCalibration"
          >
            {t('tip_length_cal_method')}
          </StyledText>
          <RadioGroup
            useBlueChecked
            css={css`
              ${TYPOGRAPHY.pRegular}
              line-height: ${TYPOGRAPHY.lineHeight20};
            `}
            value={
              useTrashSurfaceForTipCal === true
                ? ALWAYS_TRASH
                : useTrashSurfaceForTipCal === false
                  ? ALWAYS_BLOCK
                  : ALWAYS_PROMPT
            }
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              // you know this is a limited-selection field whose values are only
              // the elements of BlockSelection; i know this is a limited-selection
              // field whose values are only the elements of BlockSelection; but sadly,
              // neither of us can get Flow to know it
              handleUseTrashSelection(
                event.currentTarget.value as BlockSelection
              )
            }}
            options={[
              { name: t('cal_block'), value: ALWAYS_BLOCK },
              { name: t('trash_bin'), value: ALWAYS_TRASH },
              { name: t('prompt'), value: ALWAYS_PROMPT },
            ]}
          />
        </Box>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_unavailableRobots"
            >
              {t('prevent_robot_caching')}
            </StyledText>
            <StyledText as="p">
              <Trans
                t={t}
                i18nKey="prevent_robot_caching_description"
                components={{
                  strong: (
                    <StyledText as="span"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    />
                  ),
                }}
              />
            </StyledText>
          </Box>
          <ToggleButton
            label="display_unavailable_robots"
            toggledOn={!displayUnavailRobots}
            onClick={() =>
              dispatch(Config.toggleConfigValue('discovery.disableCache'))
            }
            id="AdvancedSettings_unavailableRobotsToggleButton"
          />
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN} gridGap={SPACING.spacingXXL}>
          <Box>
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_clearRobots"
            >
              {t('clear_unavail_robots')}
            </StyledText>
            <StyledText as="p">{t('clear_robots_description')}</StyledText>
          </Box>
          <TertiaryButton
            marginLeft={SPACING_AUTO}
            onClick={confirmDeleteUnavailRobots}
            id="AdvancedSettings_clearUnavailableRobots"
          >
            {t('clear_robots_button')}
          </TertiaryButton>
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box>
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_u2eInformation"
            >
              {t('usb_to_ethernet_adapter_info')}
            </StyledText>
            <StyledText as="p">
              {t('usb_to_ethernet_adapter_info_description')}
            </StyledText>
            {driverOutdated && (
              <Banner type="warning" marginTop={SPACING.spacing4}>
                <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
                  <StyledText as="p" color={COLORS.darkBlackEnabled}>
                    {t('usb_to_ethernet_adapter_toast_message')}
                  </StyledText>
                  <Link
                    external
                    href={REALTEK_URL}
                    css={TYPOGRAPHY.pRegular}
                    color={COLORS.darkBlackEnabled}
                    textDecoration={TYPOGRAPHY.textDecorationUnderline}
                    id="AdvancedSettings_realtekLink"
                  >
                    {t('usb_to_ethernet_adapter_link')}
                  </Link>
                </Flex>
              </Banner>
            )}
            {device === null ? (
              <StyledText as="p" marginTop={SPACING.spacing4}>
                {t('usb_to_ethernet_not_connected')}
              </StyledText>
            ) : (
              <Flex
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                marginTop={SPACING.spacing4}
              >
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  paddingRight={SPACING.spacing4}
                >
                  <StyledText css={TYPOGRAPHY.pSemiBold}>
                    {t('usb_to_ethernet_adapter_description')}
                  </StyledText>
                  <StyledText as="p">{device?.deviceName}</StyledText>
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  paddingRight={SPACING.spacing4}
                >
                  <StyledText css={TYPOGRAPHY.pSemiBold}>
                    {t('usb_to_ethernet_adapter_manufacturer')}
                  </StyledText>
                  <StyledText as="p">{device?.manufacturer}</StyledText>
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  paddingRight={SPACING.spacing4}
                >
                  <StyledText css={TYPOGRAPHY.pSemiBold}>
                    {t('usb_to_ethernet_adapter_driver_version')}
                  </StyledText>
                  <StyledText as="p">
                    {device?.windowsDriverVersion
                      ? device.windowsDriverVersion
                      : t('usb_to_ethernet_adapter_no_driver_version')}
                  </StyledText>
                </Flex>
              </Flex>
            )}
          </Box>
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_showLink"
            >
              {t('show_link_labware_data')}
            </StyledText>
            <StyledText as="p">
              {t('show_link_labware_data_description')}
            </StyledText>
          </Box>
          <ToggleButton
            label="show_link_to_get_labware_offset_data"
            toggledOn={isLabwareOffsetCodeSnippetsOn}
            onClick={toggleLabwareOffsetData}
            id="AdvancedSettings_showLinkToggleButton"
          />
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_showHeaterShakerAttachmentModal"
            >
              {t('heater_shaker_attach_visible')}
            </StyledText>
            <StyledText as="p">
              {t('heater_shaker_attach_description')}
            </StyledText>
          </Box>
          <ToggleButton
            label="show_heater_shaker_modal"
            toggledOn={!isHeaterShakerAttachmentModalVisible}
            onClick={toggleHeaterShakerModalVisibilty}
            id="AdvancedSettings_showHeaterShakerAttachmentBtn"
          />
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_overridePathToPython"
            >
              {t('override_path_to_python')}
            </StyledText>
            <StyledText as="p" paddingBottom={SPACING.spacing3}>
              {t('opentrons_app_will_use_interpreter')}
            </StyledText>
            <StyledText
              as="h6"
              textTransform={TYPOGRAPHY.textTransformUppercase}
              color={COLORS.darkGreyEnabled}
              paddingBottom={SPACING.spacing2}
            >
              {t('override_path')}
            </StyledText>
            {pathToPythonInterpreter !== null ? (
              <Link
                role="button"
                css={TYPOGRAPHY.pRegular}
                color={COLORS.darkBlackEnabled}
                onClick={() =>
                  dispatch(ProtocolAnalysis.openPythonInterpreterDirectory())
                }
                id="AdvancedSettings_sourceFolderLinkPython"
              >
                {pathToPythonInterpreter}
                <Icon
                  height="0.75rem"
                  marginLeft={SPACING.spacing3}
                  name="open-in-new"
                />
              </Link>
            ) : (
              <StyledText as="p">{t('no_specified_folder')}</StyledText>
            )}
          </Box>
          {pathToPythonInterpreter !== null ? (
            <TertiaryButton
              marginLeft={SPACING_AUTO}
              onClick={() =>
                dispatch(Config.resetConfigValue('python.pathToPythonOverride'))
              }
              id="AdvancedSettings_changePythonInterpreterSource"
            >
              {t('reset_to_default')}
            </TertiaryButton>
          ) : (
            <TertiaryButton
              marginLeft={SPACING_AUTO}
              onClick={handleClickPythonDirectoryChange}
              id="AdvancedSettings_changePythonInterpreterSource"
            >
              {t('add_override_path')}
            </TertiaryButton>
          )}
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_devTools"
            >
              {t('enable_dev_tools')}
            </StyledText>
            <StyledText as="p">{t('enable_dev_tools_description')}</StyledText>
          </Box>
          <ToggleButton
            label="enable_dev_tools"
            toggledOn={devToolsOn}
            onClick={toggleDevtools}
            id="AdvancedSettings_devTooltoggle"
          />
        </Flex>
      </Box>
    </>
  )
}
