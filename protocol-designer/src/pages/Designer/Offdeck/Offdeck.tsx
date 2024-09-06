import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
  RobotWorkSpace,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { getOnlyLatestDefs } from '../../../labware-defs'
import { selectors } from '../../../labware-ingred/selectors'
import { selectZoomedIntoSlot } from '../../../labware-ingred/actions'
import { DeckSetupTools } from '../DeckSetup/DeckSetupTools'
import { LabwareLabel } from '../LabwareLabel'
import { OffDeckDetails } from './OffDeckDetails'

export function OffDeck(): JSX.Element {
  const { t, i18n } = useTranslation('starting_deck_state')
  const [hoveredLabware, setHoveredLabware] = React.useState<string | null>(
    null
  )
  const dispatch = useDispatch()

  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedLabwareDefUri, selectedSlot } = selectedSlotInfo

  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getOnlyLatestDefs()

  const hoveredLabwareDef =
    hoveredLabware != null
      ? defs[hoveredLabware] ?? customLabwareDefs[hoveredLabware] ?? null
      : null
  const offDeckLabware =
    selectedLabwareDefUri != null ? defs[selectedLabwareDefUri] ?? null : null

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
      <RobotWorkSpace
        key={hoveredLabwareDef.parameters.loadName}
        viewBox={`0 -10 ${hoveredLabwareDef.dimensions.xDimension} ${hoveredLabwareDef.dimensions.yDimension}`}
        width="510.84px"
        height="342px"
      >
        {() => (
          <>
            <g transform="scale(0.8)">
              <LabwareRender definition={hoveredLabwareDef} />
              <LabwareLabel
                isLast={true}
                isSelected={false}
                labwareDef={hoveredLabwareDef}
                position={[0, 0, 0]}
              />
            </g>
          </>
        )}
      </RobotWorkSpace>
    )
  } else if (offDeckLabware != null) {
    const def = offDeckLabware
    labware = (
      <RobotWorkSpace
        key={def.parameters.loadName}
        viewBox={`0 -10 ${def.dimensions.xDimension} ${def.dimensions.yDimension}`}
        width="510.84px"
        height="352px"
      >
        {() => (
          <>
            <g transform=" scale(0.8)">
              <LabwareRender definition={def} />

              <LabwareLabel
                isLast={true}
                isSelected={true}
                labwareDef={def}
                position={[0, 0, 0]}
              />
            </g>
          </>
        )}
      </RobotWorkSpace>
    )
  }

  return (
    <>
      {selectedSlot.slot === 'offDeck' ? (
        <>
          <Flex justifyContent={JUSTIFY_CENTER} width="calc(100% - 25rem)">
            <Flex
              width="39.4275rem"
              height="32.125rem"
              justifyContent={JUSTIFY_CENTER}
              alignItems={ALIGN_CENTER}
              borderRadius={BORDERS.borderRadius8}
              backgroundColor={COLORS.grey20}
            >
              <Flex
                padding={SPACING.spacing60}
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
                    {i18n.format(t('off_deck_labware'), 'upperCase')}
                  </StyledText>
                </Flex>
                {labware}
              </Flex>
            </Flex>
          </Flex>
          <DeckSetupTools
            onDeckProps={null}
            setHoveredLabware={setHoveredLabware}
            onCloseClick={() => {
              dispatch(selectZoomedIntoSlot({ slot: null, cutout: null }))
            }}
          />
        </>
      ) : (
        <OffDeckDetails
          addLabware={() => {
            dispatch(selectZoomedIntoSlot({ slot: 'offDeck', cutout: null }))
          }}
        />
      )}
    </>
  )
}
