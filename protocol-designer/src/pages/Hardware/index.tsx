import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
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
import { useKitchen } from '../../components/organisms/Kitchen/hooks'
import { getFileMetadata, getRobotType } from '../../file-data/selectors'
import { getAdditionalEquipmentEntities } from '../../step-forms/selectors'

export function Hardware(): JSX.Element {
  const { t } = useTranslation([
    'protocol_steps',
    'protocol_overview',
    'starting_deck_state',
    'shared',
  ])
  const fileMetadata = useSelector(getFileMetadata)
  const navigate = useNavigate()
  const { makeSnackbar } = useKitchen()
  const robotType = useSelector(getRobotType)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const hasTrash = Object.values(additionalEquipmentEntities).some(
    ae => ae.name === 'trashBin' || ae.name === 'wasteChute'
  )

  const protocolName =
    fileMetadata.protocolName != null && fileMetadata.protocolName !== ''
      ? fileMetadata.protocolName
      : t('protocol_overview:untitled_protocol')

  //  TODO: remove this when we do the routing refactor
  useEffect(() => {
    if (fileMetadata?.created == null) {
      console.warn(
        'fileMetadata was refreshed while on the hardware page, redirecting to landing page'
      )
      navigate('/')
    }
  }, [fileMetadata])

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
        >
          <StyledText desktopStyle="headingSmallBold">
            {protocolName}
          </StyledText>
          <PrimaryButton
            onClick={() => {
              if (hasTrash) {
                navigate('/overview')
              } else {
                makeSnackbar(t('starting_deck_state:trash_required') as string)
              }
            }}
          >
            {t('shared:save')}
          </PrimaryButton>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing16}
          padding={`${SPACING.spacing80} ${SPACING.spacing80} 0 ${SPACING.spacing80}`}
        >
          <StyledText desktopStyle="displayBold">
            {robotType === FLEX_ROBOT_TYPE
              ? t('edit_hardware')
              : t('edit_modules')}
          </StyledText>
          <StyledText desktopStyle="headingLargeRegular" color={COLORS.grey60}>
            {robotType === FLEX_ROBOT_TYPE
              ? t('place_hardware')
              : t('place_modules')}
          </StyledText>
          {robotType === FLEX_ROBOT_TYPE ? <FlexHardware /> : <Ot2Modules />}
        </Flex>
      </Flex>
    </Flex>
  )
}
