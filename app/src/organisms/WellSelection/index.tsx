import * as React from 'react'
import { useTranslation } from 'react-i18next'
import flatten from 'lodash/flatten'
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
  deselectWells: (wells: string[]) => void
  resetWells: () => void
  selectedPrimaryWells: WellGroup
  selectWells: (wellGroup: WellGroup) => unknown
  channels: PipetteChannels
}

export function WellSelection(props: WellSelectionProps): JSX.Element {
  const {
    definition,
    deselectWells,
    resetWells,
    selectedPrimaryWells,
    selectWells,
    channels,
  } = props
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
    <Selection384Wells
      allSelectedWells={allSelectedWells}
      channels={channels}
      definition={definition}
      deselectWells={deselectWells}
      labwareRender={labwareRender}
      resetWells={resetWells}
      selectWells={selectWells}
    />
  ) : (
    <SelectionRect
      onSelectionMove={handleSelectionMove}
      onSelectionDone={handleSelectionDone}
    >
      {labwareRender}
    </SelectionRect>
  )
}

interface Selection384WellsProps {
  allSelectedWells: WellGroup
  channels: PipetteChannels
  definition: LabwareDefinition2
  deselectWells: (wells: string[]) => void
  labwareRender: React.ReactNode
  resetWells: () => void
  selectWells: (wellGroup: WellGroup) => unknown
}

function Selection384Wells({
  allSelectedWells,
  channels,
  definition,
  deselectWells,
  labwareRender,
  resetWells,
  selectWells,
}: Selection384WellsProps): JSX.Element {
  const [selectBy, setSelectBy] = React.useState<'columns' | 'wells'>('columns')
  const [startingWell, setStartingWell] = React.useState<
    'A1' | 'A2' | 'B1' | 'B2'
  >('A1')

  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<
    number | null
  >(null)

  // to reset last selected index on page-level selected well reset
  React.useEffect(() => {
    if (Object.keys(allSelectedWells).length === 0) {
      setLastSelectedIndex(null)
    }
  }, [allSelectedWells])

  const columns = definition.ordering
  const wells = flatten(columns)

  // for 96 channel: even/odd columns to be used based on labware column label, not index
  const oddColumns = columns.filter((_column, i) => i % 2 === 0)
  const oddColumnWells = flatten(oddColumns)

  const evenColumns = columns.filter((_column, i) => i % 2 !== 0)
  const evenColumnWells = flatten(evenColumns)

  // select even/odd members of even/odd columns based on starting well
  const A1WellGroup = oddColumnWells.reduce((acc, well, i) => {
    if (i % 2 === 0) {
      return { ...acc, [well]: null }
    } else return acc
  }, {})

  const B1WellGroup = oddColumnWells.reduce((acc, well, i) => {
    if (i % 2 !== 0) {
      return { ...acc, [well]: null }
    } else return acc
  }, {})

  const A2WellGroup = evenColumnWells.reduce((acc, well, i) => {
    if (i % 2 === 0) {
      return { ...acc, [well]: null }
    } else return acc
  }, {})

  const B2WellGroup = evenColumnWells.reduce((acc, well, i) => {
    if (i % 2 !== 0) {
      return { ...acc, [well]: null }
    } else return acc
  }, {})

  // TODO: refactor checkboxes to reflect multiselect
  // change starting well state to object, true/false for keys

  // to set 96 channel selected wells based on starting well
  React.useEffect(() => {
    if (channels === 96) {
      if (startingWell === 'A1') {
        selectWells(A1WellGroup)
      } else if (startingWell === 'B1') {
        selectWells(B1WellGroup)
      } else if (startingWell === 'A2') {
        selectWells(A2WellGroup)
      } else if (startingWell === 'B2') {
        selectWells(B2WellGroup)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, startingWell])

  const handleMinus = (): void => {
    if (lastSelectedIndex == null) {
      return
    }
    const deselectIndex =
      selectBy === 'wells'
        ? lastSelectedIndex - (lastSelectedIndex % 16)
        : lastSelectedIndex

    if (selectBy === 'wells') {
      deselectWells(wells.slice(deselectIndex, lastSelectedIndex + 1))
    } else {
      deselectWells(columns[lastSelectedIndex])
    }

    setLastSelectedIndex(lastSelectedIndex => {
      if (lastSelectedIndex != null && lastSelectedIndex !== 0) {
        const deselectQuantity =
          selectBy === 'wells' ? lastSelectedIndex % 16 : 0
        return lastSelectedIndex - deselectQuantity - 1
      } else {
        return null
      }
    })
  }
  const handlePlus = (): void => {
    const nextIndex = lastSelectedIndex == null ? 0 : lastSelectedIndex + 1

    if (selectBy === 'columns') {
      selectWells(
        columns[nextIndex].reduce((acc, well) => {
          return { ...acc, [well]: null }
        }, {})
      )
    } else if (selectBy === 'wells') {
      selectWells({
        [wells[nextIndex]]: null,
      })
    }

    setLastSelectedIndex(lastSelectedIndex =>
      lastSelectedIndex == null ? 0 : lastSelectedIndex + 1
    )
  }
  return (
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
        {channels === 1 ? (
          <SelectBy
            selectBy={selectBy}
            setSelectBy={selectBy => {
              resetWells()
              setLastSelectedIndex(null)
              setSelectBy(selectBy)
            }}
          />
        ) : (
          <StartingWell
            channels={channels}
            startingWell={startingWell}
            setStartingWell={setStartingWell}
          />
        )}
        <ButtonControls
          channels={channels}
          handleMinus={handleMinus}
          handlePlus={handlePlus}
          lastSelectedIndex={lastSelectedIndex}
          selectBy={selectBy}
        />
      </Flex>
    </Flex>
  )
}

interface SelectByProps {
  selectBy: 'columns' | 'wells'
  setSelectBy: React.Dispatch<React.SetStateAction<'columns' | 'wells'>>
}

function SelectBy({ selectBy, setSelectBy }: SelectByProps): JSX.Element {
  const { t, i18n } = useTranslation('quick_transfer')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {i18n.format(t('select_by'), 'capitalize')}
      </StyledText>
      <RadioButton
        buttonLabel={i18n.format(t('columns'), 'capitalize')}
        buttonValue="columns"
        isSelected={selectBy === 'columns'}
        onChange={() => {
          setSelectBy('columns')
        }}
        radioButtonType="small"
      />
      <RadioButton
        buttonLabel={i18n.format(t('wells'), 'capitalize')}
        buttonValue="wells"
        isSelected={selectBy === 'wells'}
        onChange={() => {
          setSelectBy('wells')
        }}
        radioButtonType="small"
      />
    </Flex>
  )
}

function StartingWell({
  channels,
  startingWell,
  setStartingWell,
}: {
  channels: PipetteChannels
  startingWell: 'A1' | 'B1' | 'A2' | 'B2'
  setStartingWell: React.Dispatch<
    React.SetStateAction<'A1' | 'B1' | 'A2' | 'B2'>
  >
}): JSX.Element {
  const { t, i18n } = useTranslation('quick_transfer')

  const checkboxWellOptions: Array<'A1' | 'B1' | 'A2' | 'B2'> =
    channels === 8 ? ['A1', 'B1'] : ['A1', 'A2', 'B1', 'B2']

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {i18n.format(t('starting_well'), 'capitalize')}
      </StyledText>
      {checkboxWellOptions.map(well => (
        <Checkbox
          key={well}
          isChecked={startingWell === well}
          labelText={well}
          onClick={() => {
            setStartingWell(well)
          }}
        />
      ))}
    </Flex>
  )
}

interface ButtonControlsProps {
  channels: PipetteChannels
  handleMinus: () => void
  handlePlus: () => void
  lastSelectedIndex: number | null
  selectBy: 'columns' | 'wells'
}
function ButtonControls(props: ButtonControlsProps): JSX.Element {
  const {
    channels,
    handleMinus,
    handlePlus,
    lastSelectedIndex,
    selectBy,
  } = props
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
            disabled={lastSelectedIndex == null}
            onClick={handleMinus}
            iconName="minus"
            hasBackground
            flex="1"
          />
          <IconButton
            disabled={
              selectBy === 'columns'
                ? lastSelectedIndex === 23
                : lastSelectedIndex === 383
            }
            onClick={handlePlus}
            iconName="plus"
            hasBackground
            flex="1"
          />
        </Flex>
      </Flex>
    ) : null
  return <Flex flexDirection={DIRECTION_COLUMN}>{addOrRemoveButtons}</Flex>
}
