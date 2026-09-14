import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Banner,
  Box,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  SPACING_AUTO,
  StyledText,
  Tooltip,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import { ExternalLink } from '/app/atoms/Link/ExternalLink'
import { isTerminalRunStatus } from '/app/local-resources/runs/utils'
import { getRobotUpdateDisplayInfo } from '/app/redux/robot-update'
import { remote } from '/app/redux/shell/remote'
import { useRobotUpdateContext } from '/app/resources/robot-update/RobotUpdateContext'

import type { ChangeEventHandler, MouseEventHandler, ReactNode } from 'react'
import type { Run } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

const OT_APP_UPDATE_PAGE_LINK = 'https://opentrons.com/app'
const HIDDEN_CSS = css`
  position: fixed;
  clip: rect(1px 1px 1px 1px);
`

interface UpdateRobotSoftwareProps {
  robotName: string
  onUpdateStart: () => void
  currentRun: Run | null
}

export function UpdateRobotSoftware({
  robotName,
  onUpdateStart,
  currentRun,
}: UpdateRobotSoftwareProps): ReactNode {
  const { t } = useTranslation(['device_settings', 'branded'])
  const { updateFromFileDisabledReason } = useSelector((state: State) => {
    return getRobotUpdateDisplayInfo(state, robotName)
  })
  const updateDisabled = updateFromFileDisabledReason !== null
  const [updateButtonProps, updateButtonTooltipProps] = useHoverTooltip()
  const inputRef = useRef<HTMLInputElement>(null)
  const { startUpdate } = useRobotUpdateContext()
  const isRunActive =
    currentRun != null && !isTerminalRunStatus(currentRun.data.status)

  const handleChange: ChangeEventHandler<HTMLInputElement> = event => {
    const { files } = event.target

    if (files != null) {
      void remote.getFilePathFrom(files[0]).then(filePath => {
        if (files.length === 1 && !updateDisabled) {
          startUpdate(robotName, filePath)
          onUpdateStart()
        }
        // this is to reset the state of the file picker so users can reselect the same
        // system image if the upload fails
        if (inputRef.current?.value != null) {
          inputRef.current.value = ''
        }
      })
    }
  }

  const handleClick: MouseEventHandler<HTMLButtonElement> = () => {
    inputRef.current?.click()
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box width="70%">
          <LegacyStyledText
            css={TYPOGRAPHY.pSemiBold}
            marginBottom={SPACING.spacing8}
          >
            {t('update_robot_software')}
          </LegacyStyledText>
          <LegacyStyledText forwardedAs="p" marginBottom={SPACING.spacing8}>
            {t('branded:update_robot_software_description')}
          </LegacyStyledText>
          <ExternalLink href={OT_APP_UPDATE_PAGE_LINK}>
            {t('branded:update_robot_software_link')}
          </ExternalLink>
        </Box>
        <TertiaryButton
          marginLeft={SPACING_AUTO}
          {...updateButtonProps}
          disabled={updateDisabled || isRunActive}
          onClick={handleClick}
        >
          {t('browse_file_system')}
          <input
            ref={inputRef}
            type="file"
            onChange={handleChange}
            disabled={updateDisabled}
            css={HIDDEN_CSS}
          />
        </TertiaryButton>
        {updateFromFileDisabledReason != null && (
          <Tooltip tooltipProps={updateButtonTooltipProps}>
            {t(updateFromFileDisabledReason)}
          </Tooltip>
        )}
      </Flex>
      <Banner type="warning">
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('you_should_not_downgrade')}
        </StyledText>
      </Banner>
    </Flex>
  )
}
