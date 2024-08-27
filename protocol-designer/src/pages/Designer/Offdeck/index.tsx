import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  EmptySelectorButton,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
  RobotWorkSpace,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import * as wellContentsSelectors from '../../../top-selectors/well-contents'
import { wellFillFromWellContents } from '../../../components/labware'
import { selectors } from '../../../labware-ingred/selectors'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { DeckSetupTools } from '../DeckSetup/DeckSetupTools'

export function OffDeck(): JSX.Element {
  const { t } = useTranslation('starting_deck_state')
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const [toolbox, setToolbox] = React.useState<boolean>(false)
  const offDeckLabware = Object.values(deckSetup.labware).filter(
    lw => lw.slot === 'offDeck'
  )
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )

  return (
    <>
      {toolbox ? (
        <DeckSetupTools
          onCloseClick={() => {
            setToolbox(false)
          }}
          slot="offDeck"
        />
      ) : (
        <Flex
          backgroundColor={COLORS.white}
          borderRadius={BORDERS.borderRadius8}
          width="100%"
          height="70vh"
          justifyContent={JUSTIFY_CENTER}
        >
          <Flex
            margin="40px 307px"
            width="100%"
            borderRadius={SPACING.spacing12}
            padding="16px 40px"
            backgroundColor={COLORS.grey20}
            flexDirection={DIRECTION_COLUMN}
          >
            <Flex
              justifyContent={JUSTIFY_CENTER}
              width="100%"
              color={COLORS.grey60}
              textTransform={TYPOGRAPHY.textTransformUppercase}
              marginBottom={SPACING.spacing40}
            >
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('off_deck_labware')}
              </StyledText>
            </Flex>
            <Flex flexWrap={WRAP} gridGap={SPACING.spacing32}>
              {offDeckLabware.map(lw => {
                const wellContents = allWellContentsForActiveItem
                  ? allWellContentsForActiveItem[lw.id]
                  : null
                const definition = lw.def
                return (
                  <Flex width="9.5625rem" height="6.375rem" key={lw.id}>
                    <RobotWorkSpace
                      key={lw.id}
                      viewBox={`${definition.cornerOffsetFromSlot.x} ${definition.cornerOffsetFromSlot.y} ${definition.dimensions.xDimension} ${definition.dimensions.yDimension}`}
                      width="100%"
                      height="100%"
                    >
                      {() => (
                        <LabwareRender
                          definition={definition}
                          wellFill={wellFillFromWellContents(
                            wellContents,
                            liquidDisplayColors
                          )}
                        />
                      )}
                    </RobotWorkSpace>
                  </Flex>
                )
              })}
              <Flex width="9.5625rem" height="6.375rem">
                <EmptySelectorButton
                  onClick={() => {
                    setToolbox(true)
                  }}
                  text={t('add_labware')}
                  textAlignment="middle"
                  size="large"
                  iconName="plus"
                />
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      )}
    </>
  )
}
