import { useSelector } from 'react-redux'
import { getFileMetadata, getRobotType } from '../../file-data/selectors'
import { useTranslation } from 'react-i18next'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  PrimaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { useNavigate } from 'react-router-dom'

export function Hardware(): JSX.Element {
  const { t } = useTranslation('protocol_overview')
  const fileMetadata = useSelector(getFileMetadata)
  const navigate = useNavigate()
  const robotType = useSelector(getRobotType)
  const protocolName =
    fileMetadata.protocolName != null && fileMetadata.protocolName !== ''
      ? fileMetadata.protocolName
      : t('untitled_protocol')
  return (
    <Flex
      padding={SPACING.spacing16}
      height="calc(100vh - 4rem)"
      width="100%"
      backgroundColor={COLORS.grey10}
    >
      <Flex
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius12}
        height="100%"
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        padding="24px 40px"
        gridGap="40px"
      >
        <Flex justifyContent="space-between">
          <StyledText desktopStyle="headingSmallBold">
            {protocolName}
          </StyledText>
          <PrimaryButton
            onClick={() => {
              navigate('/overview')
            }}
          >
            Save
          </PrimaryButton>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <StyledText desktopStyle="displayBold">
            {robotType === FLEX_ROBOT_TYPE
              ? 'Edit your deck hardware'
              : 'Edit modules'}
          </StyledText>
          <StyledText desktopStyle="headingLargeRegular" color={COLORS.grey60}>
            {robotType === FLEX_ROBOT_TYPE
              ? 'Place the modules and fixtures that you are using for this protocol onto the deck.'
              : 'Place the modules that you are using for this protocol onto the deck.'}
          </StyledText>
        </Flex>
      </Flex>
    </Flex>
  )
}
