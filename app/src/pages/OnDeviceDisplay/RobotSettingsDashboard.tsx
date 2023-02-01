import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { Link, useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  COLORS,
  Btn,
  Icon,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  JUSTIFY_CENTER,
  ALIGN_FLEX_END,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'
import { getLocalRobot } from '../../redux/discovery'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import { NetworkSettings } from '../../organisms/RobotSettingsDashboard/NetworkSettings'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'

const SETTING_BUTTON_STYLE = css`
  width: 100%;
  height: 6.875rem;
  margin-bottom: ${SPACING.spacing3};
  background-color: ${COLORS.medGreyEnabled};
  padding: 1.5rem;
  border-radius: 16px;
`

export type RenderContentType =
  | 'robotSystemVersion'
  | 'networkSettings'
  | 'displaySleepSettings'
  | 'displayBrightness'
  | 'displayTextSize'
  | 'deviceReset'
  | null

export function RobotSettingsDashboard(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const [renderContent, setRenderContent] = React.useState<RenderContentType>(
    null
  )

  const renderSetting = (): JSX.Element | null => {
    switch (renderContent) {
      case 'networkSettings':
        return (
          <NetworkSettings
            robotName={robotName}
            setRenderContent={setRenderContent}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {renderSetting() != null ? (
        renderSetting()
      ) : (
        <Flex
          padding={`${SPACING.spacing6} ${SPACING.spacingXXL} ${SPACING.spacingXXL}`}
          flexDirection={DIRECTION_COLUMN}
          columnGap={SPACING.spacing3}
        >
          <Navigation routes={onDeviceDisplayRoutes} />
          {/* Robot Name */}
          <RobotSettingButton
            settingName={t('robot_name')}
            settingInfo={robotName}
            forwardPath="/robot-settings/rename-robot"
          />

          {/* Robot System Version */}
          <RobotSettingButton
            settingName={t('robot_system_version')}
            settingInfo={'v7.0.0'}
            renderContent={'robotSystemVersion'}
            setRenderContent={setRenderContent}
          />

          {/* Network Settings */}
          <RobotSettingButton
            settingName={t('network_settings')}
            settingInfo={'Not connected'}
            renderContent={'networkSettings'}
            setRenderContent={setRenderContent}
          />

          {/* Display Sleep Settings */}
          <RobotSettingButton
            settingName={t('display_sleep_settings')}
            renderContent={'displaySleepSettings'}
            setRenderContent={setRenderContent}
          />

          {/* Display Brightness */}
          <RobotSettingButton
            settingName={t('display_brightness')}
            renderContent={'displayBrightness'}
            setRenderContent={setRenderContent}
          />

          {/* Display Text Size */}
          <RobotSettingButton
            settingName={t('display_text_size')}
            renderContent={'displayTextSize'}
            setRenderContent={setRenderContent}
          />

          {/* Device Reset */}
          <RobotSettingButton
            settingName={t('device_reset')}
            renderContent={'deviceReset'}
            setRenderContent={setRenderContent}
          />

          <Flex
            alignSelf={ALIGN_FLEX_END}
            marginTop={SPACING.spacing5}
            width="fit-content"
          >
            <Link to="menu">
              <TertiaryButton>To ODD Menu</TertiaryButton>
            </Link>
          </Flex>
        </Flex>
      )}
    </>
  )
}

interface RobotSettingButtonProps {
  settingName: string
  settingInfo?: string
  renderContent?: RenderContentType
  setRenderContent?: (renderContentType: RenderContentType) => void
  forwardPath?: string
}

function RobotSettingButton({
  settingName,
  settingInfo,
  renderContent,
  setRenderContent,
  forwardPath,
}: RobotSettingButtonProps): JSX.Element {
  const history = useHistory()
  const handleClick = (): void => {
    if (forwardPath != null) {
      history.push(forwardPath)
    } else {
      renderContent != null &&
        setRenderContent != null &&
        setRenderContent(renderContent)
    }
  }
  return (
    <Btn css={SETTING_BUTTON_STYLE} onClick={handleClick}>
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing5}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing5}>
          <Icon name="wifi" size="3rem" />
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing1}
            alignItems={ALIGN_FLEX_START}
            justifyContent={JUSTIFY_CENTER}
          >
            <StyledText
              fontSize="1.5rem"
              lineHeight="1.875rem"
              fontWeight="700"
            >
              {settingName}
            </StyledText>
            {settingInfo != null ? (
              <StyledText
                color={COLORS.darkGreyEnabled}
                fontSize="1.375rem"
                lineHeight="1.875rem"
                fontWeight="400"
              >
                {settingInfo}
              </StyledText>
            ) : null}
          </Flex>
        </Flex>
        <Icon name="chevron-right" size="3rem" />
      </Flex>
    </Btn>
  )
}
