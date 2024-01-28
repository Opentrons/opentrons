import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  Flex,
  Box,
  Link,
  Icon,
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
  AlertPrimaryButton,
  DIRECTION_ROW,
} from '@opentrons/components'

import * as Config from '../../redux/config'
import * as ProtocolAnalysis from '../../redux/protocol-analysis'
import * as CustomLabware from '../../redux/custom-labware'
import {
  clearDiscoveryCache,
  getReachableRobots,
  getUnreachableRobots,
} from '../../redux/discovery'
import { LegacyModal } from '../../molecules/LegacyModal'
import { Portal } from '../../App/portal'
import { SelectOption } from '../../atoms/SelectField/Select'
import { SelectField } from '../../atoms/SelectField'
import { ERROR_TOAST, SUCCESS_TOAST } from '../../atoms/Toast'
import {
  useTrackEvent,
  ANALYTICS_CHANGE_PATH_TO_PYTHON_DIRECTORY,
  ANALYTICS_CHANGE_CUSTOM_LABWARE_SOURCE_FOLDER,
} from '../../redux/analytics'
import { Divider } from '../../atoms/structure'
import { TertiaryButton, ToggleButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { useToaster } from '../../organisms/ToasterOven'
import {
  EnableDevTools,
  OT2AdvancedSettings,
  PreventRobotCaching,
  U2EInformation,
  ShowLabwareOffsetSnippets,
} from '../../organisms/AdvancedSettings'

import type { Dispatch, State } from '../../redux/types'

export function AdvancedSettings(): JSX.Element {
  const { t } = useTranslation(['app_settings', 'shared'])
  const trackEvent = useTrackEvent()
  const channel = useSelector(Config.getUpdateChannel)
  const channelOptions: SelectOption[] = useSelector(
    Config.getUpdateChannelOptions
  )
  const labwarePath = useSelector(CustomLabware.getCustomLabwareDirectory)
  const isHeaterShakerAttachmentModalVisible = useSelector(
    Config.getIsHeaterShakerAttached
  )
  const pathToPythonInterpreter = useSelector(Config.getPathToPythonOverride)

  const dispatch = useDispatch<Dispatch>()
  const { makeToast } = useToaster()
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
      dispatch(clearDiscoveryCache())
      makeToast(t('successfully_deleted_unavail_robots'), SUCCESS_TOAST)
    } else {
      makeToast(t('no_unavail_robots_to_clear'), ERROR_TOAST)
    }
  }

  const {
    confirm: confirmDeleteUnavailRobots,
    showConfirmation: showConfirmDeleteUnavailRobots,
    cancel: cancelExit,
  } = useConditionalConfirm(handleDeleteUnavailRobots, true)

  const toggleHeaterShakerModalVisibilty = (): void => {
    dispatch(
      Config.updateConfigValue(
        'modules.heaterShaker.isAttached',
        Boolean(!isHeaterShakerAttachmentModalVisible)
      )
    )
  }

  const handleClickPythonDirectoryChange: React.MouseEventHandler<HTMLButtonElement> = _event => {
    dispatch(ProtocolAnalysis.changePythonPathOverrideConfig())
    trackEvent({
      name: ANALYTICS_CHANGE_PATH_TO_PYTHON_DIRECTORY,
      properties: {},
    })
  }
  const handleChannel = (_: string, value: string): void => {
    dispatch(Config.updateConfigValue('update.channel', value))
  }

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
      <Box paddingX={SPACING.spacing16} paddingY={SPACING.spacing24}>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing40}
        >
          {showConfirmDeleteUnavailRobots ? (
            <Portal level="top">
              <LegacyModal
                type="warning"
                title={t('clear_unavailable_robots')}
                onClose={cancelExit}
              >
                <StyledText as="p">{t('clearing_cannot_be_undone')}</StyledText>
                <Flex
                  flexDirection={DIRECTION_ROW}
                  paddingTop={SPACING.spacing32}
                  justifyContent={JUSTIFY_FLEX_END}
                >
                  <Flex
                    paddingRight={SPACING.spacing4}
                    data-testid="AdvancedSettings_ConfirmClear_Cancel"
                  >
                    <Btn
                      onClick={cancelExit}
                      textTransform={TYPOGRAPHY.textTransformCapitalize}
                      color={COLORS.blue50}
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                      marginRight={SPACING.spacing32}
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
              </LegacyModal>
            </Portal>
          ) : null}
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing8}
              id="AdvancedSettings_updatedChannel"
            >
              {t('update_channel')}
            </StyledText>
            <StyledText as="p" paddingBottom={SPACING.spacing8}>
              {t('update_description')}
            </StyledText>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            <StyledText css={TYPOGRAPHY.labelSemiBold}>
              {t('channel')}
            </StyledText>
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
        <Divider marginY={SPACING.spacing24} />
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing40}
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing8}
              id="AdvancedSettings_customLabware"
            >
              {t('additional_labware_folder_title')}
            </StyledText>
            <StyledText as="p" paddingBottom={SPACING.spacing8}>
              {t('additional_folder_description')}
            </StyledText>
            <StyledText
              as="h6"
              textTransform={TYPOGRAPHY.textTransformUppercase}
              color={COLORS.grey50}
              paddingBottom={SPACING.spacing4}
            >
              {t('additional_folder_location')}
            </StyledText>
            {labwarePath !== '' ? (
              <Link
                role="button"
                css={TYPOGRAPHY.pRegular}
                color={COLORS.black90}
                onClick={() =>
                  dispatch(CustomLabware.openCustomLabwareDirectory())
                }
                id="AdvancedSettings_sourceFolderLink"
              >
                {labwarePath}
                <Icon
                  height="0.75rem"
                  marginLeft={SPACING.spacing8}
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
                  name: ANALYTICS_CHANGE_CUSTOM_LABWARE_SOURCE_FOLDER,
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
        <Divider marginY={SPACING.spacing24} />
        <PreventRobotCaching />
        <Divider marginY={SPACING.spacing24} />
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing40}
        >
          <Box>
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing8}
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
        <Divider marginY={SPACING.spacing24} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing8}
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
        <Divider marginY={SPACING.spacing24} />
        <ShowLabwareOffsetSnippets />
        <Divider marginY={SPACING.spacing24} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing8}
              id="AdvancedSettings_overridePathToPython"
            >
              {t('override_path_to_python')}
            </StyledText>
            <StyledText as="p" paddingBottom={SPACING.spacing8}>
              {t('opentrons_app_will_use_interpreter')}
            </StyledText>
            <StyledText
              as="h6"
              textTransform={TYPOGRAPHY.textTransformUppercase}
              color={COLORS.grey50}
              paddingBottom={SPACING.spacing4}
            >
              {t('override_path')}
            </StyledText>
            {pathToPythonInterpreter !== null ? (
              <Link
                role="button"
                css={TYPOGRAPHY.pRegular}
                color={COLORS.black90}
                onClick={() =>
                  dispatch(ProtocolAnalysis.openPythonInterpreterDirectory())
                }
                id="AdvancedSettings_sourceFolderLinkPython"
              >
                {pathToPythonInterpreter}
                <Icon
                  height="0.75rem"
                  marginLeft={SPACING.spacing8}
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
        <Divider marginY={SPACING.spacing24} />
        <EnableDevTools />
        <Divider marginY={SPACING.spacing24} />
        <OT2AdvancedSettings />
        <Divider marginY={SPACING.spacing24} />
        <U2EInformation />
      </Box>
    </>
  )
}
