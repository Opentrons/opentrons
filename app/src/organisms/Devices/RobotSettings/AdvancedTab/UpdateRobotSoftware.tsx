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
  DIRECTION_COLUMN,
  Tooltip,
  useHoverTooltip,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { ExternalLink } from '../../../../atoms/Link/ExternalLink'
import { TertiaryButton } from '../../../../atoms/buttons'
import { useIsRobotBusy } from '../../hooks'
import {
  getBuildrootUpdateDisplayInfo,
  startBuildrootUpdate,
} from '../../../../redux/buildroot'

import type { State, Dispatch } from '../../../../redux/types'

const OT_APP_UPDATE_PAGE_LINK = 'https://opentrons.com/ot-app/'
const HIDDEN_CSS = css`
  position: fixed;
  clip: rect(1px 1px 1px 1px);
`

interface UpdateRobotSoftwareProps {
  robotName: string
  updateIsRobotBusy: (isRobotBusy: boolean) => void
  onUpdateStart: () => void
}

export function UpdateRobotSoftware({
  robotName,
  updateIsRobotBusy,
  onUpdateStart,
}: UpdateRobotSoftwareProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const { updateFromFileDisabledReason } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robotName)
  })
  const updateDisabled = updateFromFileDisabledReason !== null
  const [updateButtonProps, updateButtonTooltipProps] = useHoverTooltip()
  const isBusy = useIsRobotBusy()

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    if (isBusy) {
      updateIsRobotBusy(true)
    } else {
      const { files } = event.target
      if (files?.length === 1 && !updateDisabled) {
        dispatch(startBuildrootUpdate(robotName, files[0].path))
        onUpdateStart()
      }
    }
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginBottom="2.5rem"
    >
      <Flex width="70%" flexDirection={DIRECTION_COLUMN}>
        <StyledText
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing2}
          id="AdvancedSettings_updateRobotSoftware"
        >
          {t('update_robot_software')}
        </StyledText>
        <StyledText as="p">{t('update_robot_software_description')}</StyledText>
        <ExternalLink href={OT_APP_UPDATE_PAGE_LINK}>
          {t('update_robot_software_link')}
        </ExternalLink>
      </Flex>
      <TertiaryButton
        as="label"
        marginLeft={SPACING_AUTO}
        id="AdvancedSettings_softwareUpdateButton"
        {...updateButtonProps}
      >
        {t('update_robot_software_browse_button')}
        <input
          type="file"
          onChange={handleChange}
          disabled={updateDisabled}
          css={HIDDEN_CSS}
        />
      </TertiaryButton>
      {updateFromFileDisabledReason != null && (
        <Tooltip {...updateButtonTooltipProps}>
          {updateFromFileDisabledReason}
        </Tooltip>
      )}
    </Flex>
  )
}
