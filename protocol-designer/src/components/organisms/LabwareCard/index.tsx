import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_START,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  OverflowBtn,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { openIngredientSelector } from '../../../labware-ingred/actions'
import { getLabwareNicknamesById } from '../../../ui/labware/selectors'
import { LINK_BUTTON_STYLE } from '../../atoms'
import { LabwareCardOverflowMenu } from '../LabwareCardOverflowMenu'

import type { LabwareOnDeck } from '../../../step-forms'
import type { ThunkDispatch } from '../../../types'

interface LabwareCardProps {
  labware: LabwareOnDeck
  lidDisplayName?: string
}

//  TODO: add stacking capabilities for Flex Stacker work, currently not
//  ready Design-wise.
export function LabwareCard(props: LabwareCardProps): JSX.Element {
  const { labware, lidDisplayName } = props
  const navigate = useNavigate()
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { t } = useTranslation('starting_deck_state')
  const { def } = labware
  const nickNames = useSelector(getLabwareNicknamesById)
  const displayName = nickNames[labware.id]
  const isAdapterOrTiprack =
    def.allowedRoles?.includes('adapter') || def.parameters.isTiprack
  const [showOverflowMenu, setShowOverflowMenu] = useState<boolean>(false)
  return (
    <Box position={POSITION_RELATIVE}>
      {showOverflowMenu ? (
        <LabwareCardOverflowMenu
          setShowOverflowMenu={setShowOverflowMenu}
          labwareId={labware.id}
        />
      ) : null}
      <ListItem type="default" backgroundColor={COLORS.grey30}>
        <Flex
          gridGap={SPACING.spacing16}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          position={POSITION_RELATIVE}
          width="100%"
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_START}
            gridGap={SPACING.spacing16}
            padding={SPACING.spacing16}
          >
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {displayName}
              </StyledText>
              {lidDisplayName != null ? (
                <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
                  {lidDisplayName}
                </StyledText>
              ) : null}
            </Flex>
            {!isAdapterOrTiprack ? (
              <Btn
                textDecoration={TYPOGRAPHY.textDecorationUnderline}
                css={LINK_BUTTON_STYLE}
                onClick={() => {
                  dispatch(openIngredientSelector(labware.id))
                  navigate('/liquids')
                }}
              >
                <StyledText desktopStyle="captionRegular">
                  {t('add_liquid')}
                </StyledText>
              </Btn>
            ) : null}
          </Flex>
        </Flex>
        <Flex padding={`${SPACING.spacing4} ${SPACING.spacing4} 0 0`}>
          <OverflowBtn
            data-testid="LabwareCard_overflowBtn"
            onClick={() => {
              setShowOverflowMenu(true)
            }}
          />
        </Flex>
      </ListItem>
    </Box>
  )
}
