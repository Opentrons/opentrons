import * as React from 'react'
import reduce from 'lodash/reduce'

import {
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LabwareRender,
  RobotCoordinateSpace,
  StyledText,
  TYPOGRAPHY,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import { ALL, COLUMN } from '@opentrons/shared-data'
import {
  arrayToWellGroup,
  getCollidingWells,
  getWellSetForMultichannel,
} from './utils'
import { SelectionRect } from './SelectionRect'

import type { WellFill, WellGroup, WellStroke } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { GenericRect, NozzleType } from './types'
import { useTranslation } from 'react-i18next'

interface WellSelectionProps {
  definition: LabwareDefinition2
  /** array of primary wells. Overrides labwareProps.selectedWells */
  selectedPrimaryWells: WellGroup
  selectWells: (wellGroup: WellGroup) => unknown
  nozzleType: NozzleType | null
}

type ChannelType = 1 | 8 | 96

const getChannelsFromNozzleType = (nozzleType: NozzleType | null): ChannelType => {
  if (nozzleType === '8-channel' || nozzleType === COLUMN) {
    return 8
  } else if (nozzleType === ALL) {
    return 96
  } else {
    return 1
  }
}

export function WellSelection(props: WellSelectionProps): JSX.Element {
  const { definition, selectedPrimaryWells, selectWells, nozzleType } = props

  const [highlightedWells, setHighlightedWells] = React.useState<WellGroup>({})
  const showButtonControls = definition.parameters.format === '384Standard'
  const channels = getChannelsFromNozzleType(nozzleType)

  const _wellsFromSelected: (
    selectedWells: WellGroup
  ) => WellGroup = selectedWells => {
    // Returns PRIMARY WELLS from the selection.
    if (channels === 1) return selectedWells
    // for the wells that have been highlighted,
    // get all 8-well well sets and merge them
    const primaryWells: WellGroup = reduce(
      selectedWells,
      (acc: WellGroup, _, wellName: string): WellGroup => {
        const wellSet = getWellSetForMultichannel(
          definition,
          wellName,
          channels
        )
        if (!wellSet) return acc
        return { ...acc, [wellSet[0]]: null }
      },
      {}
    )
    return primaryWells
  }

  const _getWellsFromRect: (rect: GenericRect) => WellGroup = rect => {
    const selectedWells = getCollidingWells(rect)
    return _wellsFromSelected(selectedWells)
  }

  const handleSelectionMove: (rect: GenericRect) => void = rect => {
    const selectedWells = _getWellsFromRect(rect)
    if (channels != 1) {
      const allWellsForMulti: WellGroup = reduce(
        selectedWells,
        (acc: WellGroup, _, wellName: string): WellGroup => {
          const wellSetForMulti =
            getWellSetForMultichannel(definition, wellName, channels) || []
          const channelWells = arrayToWellGroup(wellSetForMulti)
          return {
            ...acc,
            ...channelWells,
          }
        },
        {}
      )
      setHighlightedWells(allWellsForMulti)
    } else {
      setHighlightedWells(selectedWells)
    }
  }

  const handleSelectionDone: (rect: GenericRect) => void = rect => {
    const wells = _wellsFromSelected(_getWellsFromRect(rect))

    selectWells(wells)
    setHighlightedWells({})
  }

  // For rendering, show all wells not just primary wells
  const allSelectedWells =
    channels != 1
      ? reduce<WellGroup, WellGroup>(
        selectedPrimaryWells,
        (acc, _, wellName): WellGroup => {
          const wellSet = getWellSetForMultichannel(
            definition,
            wellName,
            channels
          )
          if (!wellSet) return acc
          return { ...acc, ...arrayToWellGroup(wellSet) }
        },
        {}
      )
      : selectedPrimaryWells

  const wellFill: WellFill = {}
  const wellStroke: WellStroke = {}
  Object.keys(definition.wells).forEach(wellName => {
    wellFill[wellName] = COLORS.blue35
    wellStroke[wellName] = COLORS.transparent
  })
  Object.keys(allSelectedWells).forEach(wellName => {
    wellFill[wellName] = COLORS.blue50
  })
  Object.keys(highlightedWells).forEach(wellName => {
    wellFill[wellName] = COLORS.blue50
  })

  const labwareRender = (
    <RobotCoordinateSpace viewBox="0 0 128 86">
      <LabwareRender
        definition={definition}
        selectedWells={allSelectedWells}
        hideOutline
        isInteractive={!showButtonControls}
        wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
        wellFill={wellFill}
        wellStroke={wellStroke}
      />
    </RobotCoordinateSpace>
  )
  return showButtonControls ? (
    <>
      {labwareRender}
      <ButtonControls channels={channels} />
    </>
  ) : (
    <SelectionRect
      onSelectionMove={handleSelectionMove}
      onSelectionDone={handleSelectionDone}
    >
      {labwareRender}
    </SelectionRect>
  )
}

interface ButtonControlsProps {
  channels: ChannelType
}
function ButtonControls(props: ButtonControlsProps): JSX.Element {
  const { channels } = props
  const { t } = useTranslation('quick_transfer')

  const addOrRemoveButtons = channels !== 96 ? (
    <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_FLEX_START}>
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>{t('add_or_remove')}</StyledText>
    </Flex>
  ) : null
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {addOrRemoveButtons}
    </Flex>
  )
}