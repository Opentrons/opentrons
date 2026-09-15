import { useEffect, useRef, useState } from 'react'
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
import { useGatedStartRobotUpdate } from '/app/local-resources/access-control/useGatedStartRobotUpdate'
import { isTerminalRunStatus } from '/app/local-resources/runs/utils'
import { getRobotUpdateDisplayInfo } from '/app/redux/robot-update'
import { remote } from '/app/redux/shell/remote'

import type { ChangeEventHandler, MouseEventHandler } from 'react'
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
}: UpdateRobotSoftwareProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'branded'])
  const { updateFromFileDisabledReason } = useSelector((state: State) => {
    return getRobotUpdateDisplayInfo(state, robotName)
  })
  const updateDisabled = updateFromFileDisabledReason !== null
  const [updateButtonProps, updateButtonTooltipProps] = useHoverTooltip()
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingFilePathRef = useRef<string | null>(null)
  const onUpdateStartRef = useRef(onUpdateStart)
  onUpdateStartRef.current = onUpdateStart
  const { startUpdate, isLoading } = useGatedStartRobotUpdate(robotName)
  const [isStarting, setIsStarting] = useState(false)
  const isRunActive =
    currentRun != null && !isTerminalRunStatus(currentRun.data.status)

  useEffect(() => {
    if (!isStarting || isLoading) {
      return
    }

    const filePath = pendingFilePathRef.current
    pendingFilePathRef.current = null
    setIsStarting(false)
    if (filePath == null || filePath === '') {
      return
    }

    const started = startUpdate(filePath)
    if (started) {
      onUpdateStartRef.current()
    }
  }, [isLoading, isStarting, startUpdate])

  const handleChange: ChangeEventHandler<HTMLInputElement> = event => {
    const file = event.target.files?.[0] ?? null
    if (inputRef.current != null) {
      inputRef.current.value = ''
    }
    if (file == null || updateDisabled || isStarting) {
      return
    }

    void remote
      .getFilePathFrom(file)
      .then(filePath => {
        if (filePath === '') {
          return
        }
        pendingFilePathRef.current = filePath
        setIsStarting(true)
      })
      .catch(() => {})
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
        <Box marginLeft={SPACING_AUTO}>
          <TertiaryButton
            {...updateButtonProps}
            disabled={updateDisabled || isRunActive}
            onClick={handleClick}
          >
            {t('browse_file_system')}
          </TertiaryButton>
          <input
            ref={inputRef}
            data-testid="UpdateRobotSoftware_fileInput"
            type="file"
            onChange={handleChange}
            disabled={updateDisabled}
            css={HIDDEN_CSS}
          />
        </Box>
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
