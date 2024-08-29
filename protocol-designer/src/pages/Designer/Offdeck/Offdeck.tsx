import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DeckLabelSet,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
  RobotWorkSpace,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { getOnlyLatestDefs } from '../../../labware-defs'
import { DeckSetupTools } from '../DeckSetup/DeckSetupTools'
import { OffDeckDetails } from './OffDeckDetails'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'

export function OffDeck(): JSX.Element {
  const [toolbox, setToolbox] = React.useState<boolean>(false)
  const { t, i18n } = useTranslation('starting_deck_state')
  const [hoveredLabware, setHoveredLabware] = React.useState<string | null>(
    null
  )
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const {
    labware: deckSetupLabware,
  } = deckSetup
  const createdLabwareForSlot = Object.values(deckSetupLabware).find(
    lw => lw.slot === 'offDeck'
  )
  const [selecteLabwareDefURI, setSelectedLabwareDefURI] = React.useState<
    string | null
  >(createdLabwareForSlot?.labwareDefURI ?? null)
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getOnlyLatestDefs()

  const hoveredLabwareDef =
    hoveredLabware != null ? defs[hoveredLabware] ?? null : null
  const offDeckLabware =
    selecteLabwareDefURI != null ? defs[selecteLabwareDefURI] ?? null : null

  let labware = (
    <Box
      backgroundColor={COLORS.grey40}
      width="510.84px"
      height="342px"
      borderRadius="25.15px"
    />
  )
  if (hoveredLabwareDef != null && hoveredLabwareDef !== offDeckLabware) {
    labware = (
      <DeckLabelSet
        deckLabels={[
          {
            text: hoveredLabwareDef.metadata.displayName,
            isSelected: false,
          },
        ]}
      >
        <RobotWorkSpace
          key={hoveredLabwareDef.parameters.loadName}
          viewBox={`${hoveredLabwareDef.cornerOffsetFromSlot.x} ${hoveredLabwareDef.cornerOffsetFromSlot.y} ${hoveredLabwareDef.dimensions.xDimension} ${hoveredLabwareDef.dimensions.yDimension}`}
          width="510.84px"
          height="342px"
        >
          {() => (
            <>
              <LabwareRender definition={hoveredLabwareDef} />
            </>
          )}
        </RobotWorkSpace>
      </DeckLabelSet>
    )
  } else if (offDeckLabware != null) {
    const def = offDeckLabware
    labware = (
      <DeckLabelSet
        deckLabels={[
          {
            text: def.metadata.displayName,
            isSelected: true,
          },
        ]}
      >
        <RobotWorkSpace
          key={def.parameters.loadName}
          viewBox={`${def.cornerOffsetFromSlot.x} ${def.cornerOffsetFromSlot.y} ${def.dimensions.xDimension} ${def.dimensions.yDimension}`}
          width="510.84px"
          height="342px"
        >
          {() => (
            <>
              <LabwareRender definition={def} />
            </>
          )}
        </RobotWorkSpace>
      </DeckLabelSet>
    )
  }

  return (
    <>
      {toolbox ? (
        <>
          <Flex justifyContent="center" width="calc(100% - 25rem)">
            <Flex
              width="630.84px"
              height="514px"
              justifyContent="center"
              alignItems="center"
              borderRadius={BORDERS.borderRadius8}
              backgroundColor={COLORS.grey20}
            >
              <Flex
                padding="60px"
                width="100%"
                height="100%"
                flexDirection={DIRECTION_COLUMN}
              >
                <Flex
                  justifyContent={JUSTIFY_CENTER}
                  width="100%"
                  color={COLORS.grey60}
                  marginBottom={SPACING.spacing40}
                >
                  <StyledText desktopStyle="bodyDefaultSemiBold">
                    {i18n.format(t('off_deck_labware'), 'uppercase')}
                  </StyledText>
                </Flex>
                {labware}
              </Flex>
            </Flex>
          </Flex>
          <DeckSetupTools
            selecteLabwareDefURI={selecteLabwareDefURI}
            setSelectedLabwareDefURI={setSelectedLabwareDefURI}
            setHoveredLabware={setHoveredLabware}
            onCloseClick={() => {
              setToolbox(false)
            }}
            slot="offDeck"
          />
        </>
      ) : (
        <OffDeckDetails
          addLabware={() => {
            setToolbox(true)
          }}
        />
      )}
    </>
  )
}
