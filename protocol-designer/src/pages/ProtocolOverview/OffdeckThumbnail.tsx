import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_GRID,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  LabwareRender,
  OVERFLOW_SCROLL,
  RobotWorkSpace,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  getSlotInLocationStack,
  wellFillFromWellContents,
} from '@opentrons/step-generation'

import { getRobotType } from '../../file-data/selectors'
import { selectors } from '../../labware-ingred/selectors'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import { SlotHover } from './SlotHover'

import type { Dispatch, ReactNode, SetStateAction } from 'react'

interface OffDeckThumbnailProps {
  hover: string | null
  setHover: Dispatch<SetStateAction<string | null>>
  width?: string
}
export function OffDeckThumbnail(props: OffDeckThumbnailProps): ReactNode {
  const { hover, setHover, width = '32.5rem' } = props
  const { t, i18n } = useTranslation('starting_deck_state')
  const robotType = useSelector(getRobotType)
  const deckSetup = useSelector(getInitialDeckSetup)
  const offDeckLabware = Object.values(deckSetup.labware).filter(
    lw => getSlotInLocationStack(lw.stack) === 'offDeck'
  )
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )

  return (
    <Flex
      height="25.25rem"
      width={width}
      justifyContent={offDeckLabware.length === 0 ? JUSTIFY_CENTER : 'auto'}
      backgroundColor={
        offDeckLabware.length === 0 ? COLORS.grey30 : COLORS.grey10
      }
      flexDirection={DIRECTION_COLUMN}
      borderRadius={BORDERS.borderRadius8}
      gridGap={SPACING.spacing40}
    >
      {offDeckLabware.length === 0 ? (
        <Flex
          justifyContent={JUSTIFY_CENTER}
          width="100%"
          color={COLORS.grey60}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing12}
          flexDirection={DIRECTION_COLUMN}
        >
          <Icon name="ot-alert" size="1.25rem" />
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('no_offdeck_labware')}
          </StyledText>
        </Flex>
      ) : (
        <>
          <Flex
            justifyContent={JUSTIFY_CENTER}
            width="100%"
            paddingTop={SPACING.spacing16}
            color={COLORS.grey60}
          >
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {i18n.format(t('off_deck_labware'), 'upperCase')}
            </StyledText>
          </Flex>

          <Flex
            justifyContent={JUSTIFY_CENTER}
            width="100%"
            height="100%"
            padding={`0 ${SPACING.spacing40} ${SPACING.spacing16}`}
            overflowY={OVERFLOW_SCROLL}
          >
            <Box
              display={DISPLAY_GRID}
              gridTemplateColumns="repeat(4, 6.875rem)"
              gridGap={SPACING.spacing24}
              alignContent={ALIGN_FLEX_START}
              height="3.75rem"
            >
              {offDeckLabware.map(lw => {
                const wellContents =
                  allWellContentsForActiveItem !== null
                    ? allWellContentsForActiveItem[lw.id]
                    : null
                const definition = lw.def
                const { dimensions } = definition
                return (
                  <Flex flexDirection={DIRECTION_COLUMN} key={lw.id}>
                    <RobotWorkSpace
                      key={lw.id}
                      viewBox={`${definition.cornerOffsetFromSlot.x} ${definition.cornerOffsetFromSlot.y} ${dimensions.xDimension} ${dimensions.yDimension}`}
                      width="6.875rem"
                      height="3.75rem"
                    >
                      {() => (
                        <>
                          <LabwareRender
                            definition={definition}
                            positioningMode="offsetInSlot"
                            wellFill={wellFillFromWellContents(
                              wellContents,
                              liquidDisplayColors
                            )}
                          />
                          <SlotHover
                            robotType={robotType}
                            hover={hover}
                            setHover={setHover}
                            slotPosition={[0, 0, 0]}
                            slotId={lw.id}
                          />
                        </>
                      )}
                    </RobotWorkSpace>
                  </Flex>
                )
              })}
            </Box>
          </Flex>
        </>
      )}
    </Flex>
  )
}
