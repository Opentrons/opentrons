import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  Box,
  Flex,
  SPACING,
  TYPOGRAPHY,
  Text,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  COLORS,
  SPACING_AUTO,
  RadioGroup,
  BORDER_STYLE_SOLID,
  BORDERS,
  Icon,
  Link,
} from '@opentrons/components'

import { ExternalLink } from '../../../atoms/Link/ExternalLink'
import { StyledText } from '../../../atoms/text'
import { Divider } from '../../../atoms/structure'
import { TertiaryButton, ToggleButton } from '../../../atoms/Buttons'

import {
  getRobotByName,
  getRobotApiVersion,
  getRobotFirmwareVersion,
  getRobotProtocolApiVersion,
} from '../../../redux/discovery'

import type { Dispatch, State } from '../../../redux/types'
import type { ViewableRobot } from '../../../redux/discovery/types'

const GITHUB_LINK =
  'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'
const JUPYTER_NOTEBOOK_LINK =
  'https://docs.opentrons.com/v2/new_advanced_running.html#jupyter-notebook'
const OT_APP_UPDATE_PAGE_LINK = 'https://opentrons.com/ot-app/'

interface RobotSettingsAdvancedProps {
  robotName: string
}

export function RobotSettingsAdvanced({
  robotName,
}: RobotSettingsAdvancedProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'robot_info'])

  const robot = useSelector((state: State) => getRobotByName(state, robotName))
  const robotServerVersion = getRobotApiVersion(robot as ViewableRobot)
  const firmwareVersion = getRobotFirmwareVersion(robot as ViewableRobot)
  //   const serialNumber = robot.serialNumber // ask Brian
  const protocolApiVersions = getRobotProtocolApiVersion(robot as ViewableRobot)
  const minProtocolApiVersion = protocolApiVersions?.min ?? 'Unknown'
  const maxProtocolApiVersion = protocolApiVersions?.max ?? 'Unknown'
  const apiVersionMinMax = t('robot_info:api_version_min_max', {
    min: minProtocolApiVersion,
    max: maxProtocolApiVersion,
  })

  //   const pauseProtocol // ask Brian

  // TODO
  // About
  // robotName
  // Robot Server Version
  // Server version
  // check the latest version if there is a new version need to show warning message
  // Robot Serial Number
  // Robot serial number, Firmware version, supported protocol versions
  // Usage Settings
  // toggle button
  // Disable homing the gantry when restarting the robot
  // Jupyter Notebook
  // launch jupyter notebook
  // Update robot software manually with a local file (.zip)

  // Trouble shooting
  // Download logs
  // Factory reset
  // Use older protocol analysis method
  // Legacy Settings
  // short trash bin
  // Use older aspirate behavior
  const device = {}

  const dummyForToggle = (): void => {
    console.log('dummy')
  }

  return (
    <>
      <Box paddingX={SPACING.spacing4}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              as="h3"
              css={TYPOGRAPHY.h3SemiBold}
              marginBottom={SPACING.spacing4}
              id="AdvancedSettings_About"
            >
              {t('about_advanced')}
            </StyledText>
            <StyledText
              as="p"
              css={TYPOGRAPHY.pSemiBold}
              marginBottom={SPACING.spacing2}
            >
              {t('robot_name')}
            </StyledText>
            <StyledText as="p">{robotName}</StyledText>
          </Box>
          <TertiaryButton
            marginLeft={SPACING_AUTO}
            onClick={null} // ToDo add slideout
            id="AdvancedSettings_RenameRobot"
          >
            {t('robot_rename_button')}
          </TertiaryButton>
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_RobotServerVersion"
            >
              {t('robot_server_versions')}
            </StyledText>
            <StyledText
              css={TYPOGRAPHY.h6Default}
              textTransform={TYPOGRAPHY.textTransformUppercase}
              color={COLORS.darkGreyEnabled}
              paddingBottom={SPACING.spacing2}
            >
              {`v${robotServerVersion}`}
            </StyledText>
            <StyledText as="p">
              {t('robot_server_versions_description')}
              <Link
                external
                href={GITHUB_LINK}
                id="AdvancedSettings_GitHubLink"
              >{` ${t('github')}`}</Link>
            </StyledText>
          </Box>
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Box>
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            marginTop={SPACING.spacing4}
          >
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing4}
            >
              <StyledText css={TYPOGRAPHY.pSemiBold}>
                {t('robot_serial_number')}
              </StyledText>
              <StyledText as="p">{'robot serial number'}</StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing4}
            >
              <StyledText css={TYPOGRAPHY.pSemiBold}>
                {t('firmware_version')}
              </StyledText>
              <StyledText as="p">{firmwareVersion}</StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing4}
            >
              <StyledText css={TYPOGRAPHY.pSemiBold}>
                {t('supported_protocol_api_versions')}
              </StyledText>
              <StyledText as="p">{apiVersionMinMax}</StyledText>
            </Flex>
          </Flex>

          <RadioGroup
            css={TYPOGRAPHY.pRegular}
            value={'test'}
            //   useTrashSurfaceForTipCal === true
            //     ? ALWAYS_TRASH
            //     : useTrashSurfaceForTipCal === false
            //     ? ALWAYS_BLOCK
            //     : ALWAYS_PROMPT
            // }
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              // you know this is a limited-selection field whose values are only
              // the elements of BlockSelection; i know this is a limited-selection
              // field whose values are only the elements of BlockSelection; but sadly,
              // neither of us can get Flow to know it
              //   handleUseTrashSelection(
              //     event.currentTarget.value as BlockSelection
              //   )
            }}
            options={
              [
                //   { name: t('cal_block'), value: ALWAYS_BLOCK },
                //   { name: t('trash_bin'), value: ALWAYS_TRASH },
                //   { name: t('prompt'), value: ALWAYS_PROMPT },
              ]
            }
          />
        </Box>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              as="h3"
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_UsageSettings"
            >
              {t('usage_settings')}
            </StyledText>
            <StyledText as="p" css={TYPOGRAPHY.pSemiBold}>
              {t('pause_protocol')}
            </StyledText>
            <StyledText as="p">{t('pause_protocol_description')}</StyledText>
          </Box>
          <ToggleButton
            label="pause_protocol"
            toggledOn={null}
            onClick={null}
            id="AdvancedSettings_unavailableRobotsToggleButton"
          />
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              as="p"
              css={TYPOGRAPHY.pSemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_DisableHoming"
            >
              {t('disable_homing')}
            </StyledText>

            <StyledText as="p">{t('disable_homing_description')}</StyledText>
          </Box>
          <ToggleButton
            label="disable_homing"
            toggledOn={null}
            onClick={null}
            id="AdvancedSettings_unavailableRobotsToggleButton"
          />
        </Flex>
        <Divider marginY={SPACING.spacing5} />

        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <StyledText
              as="h3"
              css={TYPOGRAPHY.h3SemiBold}
              marginBottom={SPACING.spacing4}
              id="AdvancedSettings_About"
            >
              {t('jupyter_notebook')}
            </StyledText>
            {/* <StyledText
              as="p"
              css={TYPOGRAPHY.pSemiBold}
              marginBottom={SPACING.spacing2}
            >
              {t('robot_name')}
            </StyledText> */}
            <StyledText as="p">{t('jupyter_notebook_description')}</StyledText>
            <ExternalLink href={JUPYTER_NOTEBOOK_LINK}>
              {t('jupyter_notebook_link')}
            </ExternalLink>
          </Box>
          <TertiaryButton
            marginLeft={SPACING_AUTO}
            onClick={null} // ToDo add slideout
            id="AdvancedSettings_RenameRobot"
          >
            {t('launch_jupyter_notebook_button')}
          </TertiaryButton>
        </Flex>

        <Divider marginY={SPACING.spacing5} />

        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box>
            <StyledText
              as="h3"
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_u2eInformation"
            >
              {t('usb_to_ethernet_adapter_info')}
            </StyledText>
            <StyledText as="p">
              {t('usb_to_ethernet_adapter_info_description')}
            </StyledText>
            {/* {driverOutdated && (
                  <Flex
                    backgroundColor={COLORS.warningBg}
                    paddingTop={SPACING.spacing3}
                    paddingBottom={SPACING.spacing3}
                    marginTop={SPACING.spacing4}
                    borderColor={COLORS.warning}
                    border={BORDER_STYLE_SOLID}
                    borderRadius={BORDERS.radiusSoftCorners}
                  >
                    <Flex flexDirection="row">
                      <Icon
                        name="alert-circle"
                        color={COLORS.warning}
                        width={SPACING.spacing4}
                        marginLeft={SPACING.spacing3}
                        marginRight={SPACING.spacing3}
                      />
                      <StyledText as="p" color={COLORS.darkBlack}>
                        {t('usb_to_ethernet_adapter_toast_message')}
                      </StyledText>
                      <Link
                        external
                        // href={REALTEK_URL}
                        css={TYPOGRAPHY.pRegular}
                        color={COLORS.darkBlack}
                        position="absolute"
                        right={SPACING.spacingXL}
                        textDecoration="underline"
                        id="AdvancedSettings_realtekLink"
                      >
                        {t('usb_to_ethernet_adapter_link')}
                      </Link>
                    </Flex>
                  </Flex>
                )} */}
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
                  <StyledText as="p">{'test'}</StyledText>
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  paddingRight={SPACING.spacing4}
                >
                  <StyledText css={TYPOGRAPHY.pSemiBold}>
                    {t('usb_to_ethernet_adapter_manufacturer')}
                  </StyledText>
                  <StyledText as="p">{'hello'}</StyledText>
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  paddingRight={SPACING.spacing4}
                >
                  <StyledText css={TYPOGRAPHY.pSemiBold}>
                    {t('usb_to_ethernet_adapter_driver_version')}
                  </StyledText>
                  <StyledText as="p">
                    bye-by
                    {/* {device?.windowsDriverVersion
                          ? device.windowsDriverVersion
                          : t('usb_to_ethernet_adapter_no_driver_version')} */}
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
              as="h3"
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
            toggledOn={dummyForToggle}
            onClick={dummyForToggle}
            id="AdvancedSettings_showLinkToggleButton"
          />
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <Text
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_clearRobots"
            >
              {t('clear_unavail_robots')}
            </Text>
            <Text css={TYPOGRAPHY.pRegular}>
              {t('clear_robots_description')}
            </Text>
          </Box>
          <TertiaryButton
            marginLeft={SPACING_AUTO}
            // onClick={() => dispatch(clearDiscoveryCache())}
            id="AdvancedSettings_clearUnavailableRobots"
          >
            {t('clear_robots_button')}
          </TertiaryButton>
        </Flex>
        <Divider marginY={SPACING.spacing5} />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box width="70%">
            <Text
              css={TYPOGRAPHY.h3SemiBold}
              paddingBottom={SPACING.spacing3}
              id="AdvancedSettings_devTools"
            >
              {t('enable_dev_tools')}
            </Text>
            <Text css={TYPOGRAPHY.pRegular}>
              {t('enable_dev_tools_description')}
            </Text>
          </Box>
          <ToggleButton
            label="enable_dev_tools"
            toggledOn={dummyForToggle}
            onClick={dummyForToggle}
            id="AdvancedSettings_devTooltoggle"
          />
        </Flex>
      </Box>
    </>
  )
  //   )
}
