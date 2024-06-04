import * as React from 'react'
import { useTranslation } from 'react-i18next'
import flatten from 'lodash/flatten'

import {
  Box,
  Checkbox,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { IconButton } from '../../atoms/buttons/IconButton'
import { RadioButton } from '../../atoms/buttons/RadioButton'

import type { WellGroup } from '@opentrons/components'
import type {
  LabwareDefinition2,
  PipetteChannels,
} from '@opentrons/shared-data'

interface Selection384WellsProps {
  allSelectedWells: WellGroup
  channels: PipetteChannels
  definition: LabwareDefinition2
  deselectWells: (wells: string[]) => void
  labwareRender: React.ReactNode
  resetWells: () => void
  selectWells: (wellGroup: WellGroup) => unknown
}

export function Selection384Wells({
  allSelectedWells,
  channels,
  definition,
  deselectWells,
  labwareRender,
  resetWells,
  selectWells,
}: Selection384WellsProps): JSX.Element {
  const [selectBy, setSelectBy] = React.useState<'columns' | 'wells'>('columns')

  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<
    number | null
  >(null)

  const [startingWellState, setStartingWellState] = React.useState<
    Record<StartingWellOption, boolean>
  >({ A1: false, A2: false, B1: false, B2: false })

  // to reset last selected index and starting well state on page-level selected well reset
  React.useEffect(() => {
    if (Object.keys(allSelectedWells).length === 0) {
      setLastSelectedIndex(null)
      if (channels === 96) {
        // uncheck 96-channel starting wells
        setStartingWellState({ A1: false, A2: false, B1: false, B2: false })
      }
      // ensure A1 starting well is checked on mount
    } else if (allSelectedWells.A1 === null && channels === 96) {
      setStartingWellState(startingWellState => ({
        ...startingWellState,
        A1: true,
      }))
    }
  }, [allSelectedWells, channels])

  const columns = definition.ordering
  const wells = flatten(columns)

  // for 8-channel, filter members of columns for odd/even depending on starting well
  const oddRowColumns = columns.map(column =>
    column.filter((_row, i) => i % 2 === 0)
  )

  const evenRowColumns = columns.map(column =>
    column.filter((_row, i) => i % 2 !== 0)
  )

  const multichannelColumns = startingWellState.A1
    ? oddRowColumns
    : evenRowColumns

  const selectableColumns =
    // for 8-channel, use all rows unless only one starting well option is selected
    channels === 8 && startingWellState.A1 !== startingWellState.B1
      ? multichannelColumns
      : columns

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
      deselectWells(selectableColumns[lastSelectedIndex])
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
        selectableColumns[nextIndex].reduce((acc, well) => {
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
            columns={columns}
            deselectWells={deselectWells}
            selectWells={selectWells}
            startingWellState={startingWellState}
            setStartingWellState={setStartingWellState}
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

type StartingWellOption = 'A1' | 'B1' | 'A2' | 'B2'

function StartingWell({
  channels,
  columns,
  deselectWells,
  selectWells,
  startingWellState,
  setStartingWellState,
}: {
  channels: PipetteChannels
  columns: string[][]
  deselectWells: (wells: string[]) => void
  selectWells: (wellGroup: WellGroup) => void
  startingWellState: Record<StartingWellOption, boolean>
  setStartingWellState: React.Dispatch<
    React.SetStateAction<Record<StartingWellOption, boolean>>
  >
}): JSX.Element {
  const { t, i18n } = useTranslation('quick_transfer')

  const checkboxWellOptions: StartingWellOption[] =
    channels === 8 ? ['A1', 'B1'] : ['A1', 'A2', 'B1', 'B2']

  // for 96-channel: even/odd columns to be used based on labware column label, not index
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

  const wellGroupByStartingWell: Record<StartingWellOption, WellGroup> = {
    A1: A1WellGroup,
    B1: B1WellGroup,
    A2: A2WellGroup,
    B2: B2WellGroup,
  }

  // on mount, select A1 well group for 96-channel
  React.useEffect(() => {
    if (channels === 96) {
      selectWells(wellGroupByStartingWell.A1)
    }
    setStartingWellState({ A1: true, A2: false, B1: false, B2: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {i18n.format(t('starting_well'), 'capitalize')}
      </StyledText>
      {checkboxWellOptions.map(well => (
        <Checkbox
          key={well}
          isChecked={startingWellState[well]}
          labelText={well}
          onClick={() => {
            if (channels === 96) {
              if (startingWellState[well]) {
                deselectWells(Object.keys(wellGroupByStartingWell[well]))
              } else {
                selectWells(wellGroupByStartingWell[well])
              }
            }

            setStartingWellState(startingWellState => ({
              ...startingWellState,
              [well]: !startingWellState[well],
            }))
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
