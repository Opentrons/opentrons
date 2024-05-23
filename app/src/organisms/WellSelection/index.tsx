import * as React from 'react'
import { useTranslation } from 'react-i18next'
import reduce from 'lodash/reduce'

import {
  Box,
  Checkbox,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LabwareRender,
  RobotCoordinateSpace,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'

import { IconButton } from '../../atoms/buttons/IconButton'
import { RadioButton } from '../../atoms/buttons/RadioButton'
import {
  arrayToWellGroup,
  getCollidingWells,
  getWellSetForMultichannel,
} from './utils'
import { SelectionRect } from './SelectionRect'

import type { WellFill, WellGroup, WellStroke } from '@opentrons/components'
import type {
  LabwareDefinition2,
  PipetteChannels,
} from '@opentrons/shared-data'
import type { GenericRect } from './types'

interface WellSelectionProps {
  definition: LabwareDefinition2
  selectedPrimaryWells: WellGroup
  selectWells: (wellGroup: WellGroup) => unknown
  channels: PipetteChannels
}

export function WellSelection(props: WellSelectionProps): JSX.Element {
  const { definition, selectedPrimaryWells, selectWells, channels } = props

  const [highlightedWells, setHighlightedWells] = React.useState<WellGroup>({})

  const _wellsFromSelected: (
    selectedWells: WellGroup
  ) => WellGroup = selectedWells => {
    // Returns PRIMARY WELLS from the selection.
    if (channels === 8 || channels === 96) {
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

    // single-channel or ingred selection mode
    return selectedWells
  }

  const _getWellsFromRect: (rect: GenericRect) => WellGroup = rect => {
    const selectedWells = getCollidingWells(rect)
    return _wellsFromSelected(selectedWells)
  }

  const handleSelectionMove: (rect: GenericRect) => void = rect => {
    if (channels === 8 || channels === 96) {
      const selectedWells = _getWellsFromRect(rect)
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
      setHighlightedWells(_getWellsFromRect(rect))
    }
  }

  const handleSelectionDone: (rect: GenericRect) => void = rect => {
    const wells = _wellsFromSelected(_getWellsFromRect(rect))

    selectWells(wells)
    setHighlightedWells({})
  }

  // For rendering, show all wells not just primary wells
  const allSelectedWells =
    channels === 8 || channels === 96
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
    wellStroke[wellName] = COLORS.transparent
  })
  Object.keys(highlightedWells).forEach(wellName => {
    wellFill[wellName] = COLORS.blue50
    wellStroke[wellName] = COLORS.transparent
  })

  const labwareRender = (
    <RobotCoordinateSpace viewBox="0 0 128 86">
      <LabwareRender
        definition={definition}
        hideOutline
        isInteractive
        wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
        wellFill={wellFill}
        wellStroke={wellStroke}
      />
    </RobotCoordinateSpace>
  )
  return definition.parameters.format === '384Standard' ? (
    <Flex
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      gridGap={SPACING.spacing40}
      width="100%"
    >
      <Box flex="2 0 0">{labwareRender}</Box>
      <Flex
        flex="1 0 0"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
      >
        {channels === 1 ? <SelectBy /> : <StartingWell channels={channels} />}
        <ButtonControls channels={channels} />
      </Flex>
    </Flex>
  ) : (
    <SelectionRect
      onSelectionMove={handleSelectionMove}
      onSelectionDone={handleSelectionDone}
    >
      {labwareRender}
    </SelectionRect>
  )
}

function SelectBy(): JSX.Element {
  const { t, i18n } = useTranslation('quick_transfer')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {i18n.format(t('select_by'), 'capitalize')}
      </StyledText>
      <RadioButton
        buttonLabel={i18n.format(t('columns'), 'capitalize')}
        buttonValue="columns"
        onChange={() => console.log('columns')}
        radioButtonType="small"
      />
      <RadioButton
        buttonLabel={i18n.format(t('wells'), 'capitalize')}
        buttonValue="wells"
        onChange={() => console.log('wells')}
        radioButtonType="small"
      />
    </Flex>
  )
}

function StartingWell({
  channels,
}: {
  channels: PipetteChannels
}): JSX.Element {
  const { t, i18n } = useTranslation('quick_transfer')

  const checkboxWellOptions =
    channels === 8 ? ['A1', 'B1'] : ['A1', 'A2', 'B1', 'B2']

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {i18n.format(t('starting_well'), 'capitalize')}
      </StyledText>
      {checkboxWellOptions.map(well => (
        <Checkbox
          key={well}
          isChecked
          labelText={well}
          onClick={() => console.log(well)}
        />
      ))}
    </Flex>
  )
}

interface ButtonControlsProps {
  channels: PipetteChannels
}
function ButtonControls(props: ButtonControlsProps): JSX.Element {
  const { channels } = props
  const { t, i18n } = useTranslation('quick_transfer')

  const addOrRemoveButtons =
    channels !== 96 ? (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {i18n.format(
            t(channels === 8 ? 'add_or_remove_columns' : 'add_or_remove'),
            'capitalize'
          )}
        </StyledText>
        <Flex gridGap={SPACING.spacing16}>
          <IconButton
            onClick={() => {
              console.log('TODO handle minus')
            }}
            iconName="minus"
            hasBackground
            flex="1"
          />
          <IconButton
            onClick={() => {
              console.log('TODO handle plus')
            }}
            iconName="plus"
            hasBackground
            flex="1"
          />
        </Flex>
      </Flex>
    ) : null
  return <Flex flexDirection={DIRECTION_COLUMN}>{addOrRemoveButtons}</Flex>
}
