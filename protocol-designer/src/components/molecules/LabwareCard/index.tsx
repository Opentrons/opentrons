import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_START,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  ListItem,
  OverflowBtn,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { LINK_BUTTON_STYLE } from '../../atoms'

import type { LabwareOnDeck } from '../../../step-forms'

interface LabwareCardProps {
  labware: LabwareOnDeck
}

export function LabwareCard(props: LabwareCardProps): JSX.Element {
  const { labware } = props
  const navigate = useNavigate()
  const { t } = useTranslation('starting_deck_state')
  const { def } = labware
  const displayName = def.metadata.displayName
  const isAdapter = def.allowedRoles?.includes('adapter')
  return (
    <ListItem type="default" backgroundColor={COLORS.grey30}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        alignItems={ALIGN_START}
        padding={SPACING.spacing16}
        position={POSITION_RELATIVE}
        width="100%"
      >
        <Flex
          position={POSITION_ABSOLUTE}
          top={SPACING.spacing4}
          right={SPACING.spacing4}
        >
          <OverflowBtn
            data-testid="LabwareCard_overflowBtn"
            onClick={() => {
              console.log('wire up')
            }}
          />
        </Flex>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {displayName}
        </StyledText>
        {!isAdapter ? (
          <Btn
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
            css={LINK_BUTTON_STYLE}
            onClick={() => {
              navigate('/liquids')
            }}
          >
            <StyledText desktopStyle="captionRegular">
              {t('add_liquid')}
            </StyledText>
          </Btn>
        ) : null}
      </Flex>
    </ListItem>
  )
}
