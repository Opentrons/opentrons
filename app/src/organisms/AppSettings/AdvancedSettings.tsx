import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import {
  Flex,
  Box,
  Link,
  Icon,
  DropdownField,
  RadioGroup,
  SPACING_AUTO,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  TEXT_DECORATION_UNDERLINE,
} from '@opentrons/components'
import * as Config from '../../redux/config'
import * as Calibration from '../../redux/calibration'
import * as CustomLabware from '../../redux/custom-labware'
import { clearDiscoveryCache } from '../../redux/discovery'
import {
  getU2EAdapterDevice,
  getU2EWindowsDriverStatus,
  OUTDATED,
} from '../../redux/system-info'
import { Divider } from '../../atoms/structure'
import { TertiaryButton, ToggleButton } from '../../atoms/Buttons'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'

import type { Dispatch, State } from '../../redux/types'
import type { DropdownOption } from '@opentrons/components'

const ALWAYS_BLOCK: 'always-block' = 'always-block'
const ALWAYS_TRASH: 'always-trash' = 'always-trash'
const ALWAYS_PROMPT: 'always-prompt' = 'always-prompt'
const REALTEK_URL = 'https://www.realtek.com/en/'

type BlockSelection =
  | typeof ALWAYS_BLOCK
  | typeof ALWAYS_TRASH
  | typeof ALWAYS_PROMPT

export function AdvancedSettings(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const useTrashSurfaceForTipCal = useSelector((state: State) =>
    Config.getUseTrashSurfaceForTipCal(state)
  )
  const devToolsOn = useSelector(Config.getDevtoolsEnabled)
  const channel = useSelector(Config.getUpdateChannel)
  const channelOptions: DropdownOption[] = useSelector(
    Config.getUpdateChannelOptions
  )
  const labwarePath = useSelector(CustomLabware.getCustomLabwareDirectory)
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    Config.getIsLabwareOffsetCodeSnippetsOn
  )
  const dispatch = useDispatch<Dispatch>()

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
  const toggleDevtools = (): unknown => dispatch(Config.toggleDevtools())
  const handleChannel: React.ChangeEventHandler<HTMLSelectElement> = event =>
    dispatch(Config.updateConfigValue('update.channel', event.target.value))
  const displayUnavailRobots = useSelector((state: State) => {
    return Config.getConfig(state)?.discovery.disableCache ?? false
  })

  return (
    <>
      <Box paddingX={SPACING.spacing4} paddingY={SPACING.spacing5}>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing4}
        >
          <Box width="70%">
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
          </Box>
          <Box width="10rem">
            <DropdownField
              options={channelOptions}
              onChange={handleChannel}
              value={channel}
              id={`AdvancedSettings_${channel}`}
            />
          </Box>
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
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
                css={TYPOGRAPHY.pRegular}
                external
                color={COLORS.darkBlack}
                onClick={() =>
                  dispatch(CustomLabware.openCustomLabwareDirectory())
                }
                id="AdvancedSettings_sourceFolderLink"
              >
                {labwarePath}
                <Icon
                  width={SPACING.spacing3}
                  height={SPACING.spacing3}
                  marginLeft={SPACING.spacing3}
                  name="open-in-new"
                />
              </Link>
            ) : (
              <StyledText as="p">{t('no_folder')}</StyledText>
            )}
          </Box>
          {
            <TertiaryButton
              marginLeft={SPACING_AUTO}
              onClick={() =>
                dispatch(CustomLabware.changeCustomLabwareDirectory())
              }
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
            css={TYPOGRAPHY.pRegular}
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
              {t('display_unavail_robots')}
            </StyledText>
            <StyledText as="p">
              {t('display_unavail_robots_description')}
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
              <Banner type="warning">
                <Flex>
                  <StyledText as="p" color={COLORS.darkBlack}>
                    {t('usb_to_ethernet_adapter_toast_message')}
                  </StyledText>
                  <Link
                    external
                    href={REALTEK_URL}
                    css={TYPOGRAPHY.pRegular}
                    color={COLORS.darkBlack}
                    position="absolute"
                    right={SPACING.spacing7}
                    textDecoration={TEXT_DECORATION_UNDERLINE}
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
              id="AdvancedSettings_clearRobots"
            >
              {t('clear_unavail_robots')}
            </StyledText>
            <StyledText as="p">{t('clear_robots_description')}</StyledText>
          </Box>
          <TertiaryButton
            marginLeft={SPACING_AUTO}
            onClick={() => dispatch(clearDiscoveryCache())}
            id="AdvancedSettings_clearUnavailableRobots"
          >
            {t('clear_robots_button')}
          </TertiaryButton>
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
