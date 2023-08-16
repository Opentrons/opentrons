import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { css } from 'styled-components'

import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  SPACING_AUTO,
  Box,
  useHoverTooltip,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { ExternalLink } from '../../../../atoms/Link/ExternalLink'
import { TertiaryButton } from '../../../../atoms/buttons'
import { Tooltip } from '../../../../atoms/Tooltip'
import {
  getRobotUpdateDisplayInfo,
  startRobotUpdate,
} from '../../../../redux/robot-update'

import type { State, Dispatch } from '../../../../redux/types'

const OT_APP_UPDATE_PAGE_LINK = 'https://opentrons.com/ot-app/'
const HIDDEN_CSS = css`
  position: fixed;
  clip: rect(1px 1px 1px 1px);
`

interface UpdateRobotSoftwareProps {
  robotName: string
  onUpdateStart: () => void
  isRobotBusy: boolean
}

export function UpdateRobotSoftware({
  robotName,
  onUpdateStart,
  isRobotBusy,
}: UpdateRobotSoftwareProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const { updateFromFileDisabledReason } = useSelector((state: State) => {
    return getRobotUpdateDisplayInfo(state, robotName)
  })
  const updateDisabled = updateFromFileDisabledReason !== null
  const [updateButtonProps, updateButtonTooltipProps] = useHoverTooltip()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const { files } = event.target
    if (files?.length === 1 && !updateDisabled) {
      dispatch(startRobotUpdate(robotName, files[0].path))
      onUpdateStart()
    }
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    inputRef.current?.click()
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing8}
          id="AdvancedSettings_updateRobotSoftware"
        >
          {t('update_robot_software')}
        </StyledText>
        <StyledText as="p" marginBottom={SPACING.spacing8}>
          {t('update_robot_software_description')}
        </StyledText>
        <ExternalLink href={OT_APP_UPDATE_PAGE_LINK}>
          {t('update_robot_software_link')}
        </ExternalLink>
      </Box>
      <TertiaryButton
        marginLeft={SPACING_AUTO}
        id="AdvancedSettings_softwareUpdateButton"
        {...updateButtonProps}
        disabled={updateDisabled || isRobotBusy}
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
          {updateFromFileDisabledReason}
        </Tooltip>
      )}
    </Flex>
  )
}
