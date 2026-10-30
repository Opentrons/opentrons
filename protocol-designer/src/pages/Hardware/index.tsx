import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { NAV_BAR_HEIGHT_REM } from '../../components/atoms'
import { FlexHardware, Ot2Modules } from '../../components/organisms'
import { getFileMetadata, getRobotType } from '../../file-data/selectors'

import type { ReactNode } from 'react'

export function Hardware(): ReactNode {
  const { t } = useTranslation([
    'protocol_steps',
    'protocol_overview',
    'starting_deck_state',
    'shared',
  ])
  const fileMetadata = useSelector(getFileMetadata)
  const navigate = useNavigate()
  const robotType = useSelector(getRobotType)

  const protocolName =
    fileMetadata.protocolName != null && fileMetadata.protocolName !== ''
      ? fileMetadata.protocolName
      : t('protocol_overview:untitled_protocol')

  //  TODO: remove this when we do the routing refactor
  useEffect(
    () => {
      if (fileMetadata?.created == null) {
        console.warn(
          'fileMetadata was refreshed while on the hardware page, redirecting to landing page'
        )
        navigate('/')
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileMetadata]
  )

  return (
    <Flex
      padding={SPACING.spacing16}
      height={`calc(100vh - ${NAV_BAR_HEIGHT_REM}rem)`}
      width="100%"
      backgroundColor={COLORS.grey10}
    >
      <Flex
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius12}
        height="100%"
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        overflowY="auto"
      >
        <Flex
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={`${SPACING.spacing24} ${SPACING.spacing40}`}
          alignItems={ALIGN_CENTER}
        >
          <StyledText desktopStyle="headingSmallBold">
            {protocolName}
          </StyledText>
          <PrimaryButton
            onClick={() => {
              navigate('/overview')
            }}
          >
            {t('shared:save')}
          </PrimaryButton>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing60}
          padding={SPACING.spacing80}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            <StyledText desktopStyle="displayBold">
              {robotType === FLEX_ROBOT_TYPE
                ? t('edit_hardware')
                : t('edit_modules')}
            </StyledText>
            <StyledText
              desktopStyle="headingLargeRegular"
              color={COLORS.grey60}
            >
              {robotType === FLEX_ROBOT_TYPE
                ? t('place_hardware')
                : t('place_modules')}
            </StyledText>
          </Flex>

          {robotType === FLEX_ROBOT_TYPE ? <FlexHardware /> : <Ot2Modules />}
        </Flex>
      </Flex>
    </Flex>
  )
}
