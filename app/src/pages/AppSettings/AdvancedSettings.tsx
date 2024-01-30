import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING_AUTO,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import * as Config from '../../redux/config'
import * as ProtocolAnalysis from '../../redux/protocol-analysis'
import * as CustomLabware from '../../redux/custom-labware'
import { SelectOption } from '../../atoms/SelectField/Select'
import { SelectField } from '../../atoms/SelectField'
import {
  useTrackEvent,
  ANALYTICS_CHANGE_PATH_TO_PYTHON_DIRECTORY,
  ANALYTICS_CHANGE_CUSTOM_LABWARE_SOURCE_FOLDER,
} from '../../redux/analytics'
import { Divider } from '../../atoms/structure'
import { TertiaryButton, ToggleButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import {
  ClearUnavailableRobots,
  EnableDevTools,
  OT2AdvancedSettings,
  PreventRobotCaching,
  ShowHeaterShakerAttachmentModal,
  U2EInformation,
} from '../../organisms/AdvancedSettings'

import type { Dispatch } from '../../redux/types'

export function AdvancedSettings(): JSX.Element {
  const { t } = useTranslation(['app_settings', 'shared'])
  const trackEvent = useTrackEvent()
  const channel = useSelector(Config.getUpdateChannel)
  const channelOptions: SelectOption[] = useSelector(
    Config.getUpdateChannelOptions
  )
  const labwarePath = useSelector(CustomLabware.getCustomLabwareDirectory)
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    Config.getIsLabwareOffsetCodeSnippetsOn
  )
  const pathToPythonInterpreter = useSelector(Config.getPathToPythonOverride)
  const dispatch = useDispatch<Dispatch>()
  const toggleLabwareOffsetData = (): void => {
    dispatch(
      Config.updateConfigValue(
        'labware.showLabwareOffsetCodeSnippets',
        Boolean(!isLabwareOffsetCodeSnippetsOn)
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
        <ClearUnavailableRobots />
        <Divider marginY={SPACING.spacing24} />
        <ShowHeaterShakerAttachmentModal />
        <Divider marginY={SPACING.spacing24} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing8}
              id="AdvancedSettings_showLink"
            >
              {t('show_labware_offset_snippets')}
            </StyledText>
            <StyledText as="p">
              {t('show_labware_offset_snippets_description')}
            </StyledText>
          </Box>
          <ToggleButton
            label="show_link_to_get_labware_offset_data"
            toggledOn={isLabwareOffsetCodeSnippetsOn}
            onClick={toggleLabwareOffsetData}
            id="AdvancedSettings_showLinkToggleButton"
          />
        </Flex>
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
