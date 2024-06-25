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
  LegacyStyledText,
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
  selectWells: (wellGroup: WellGroup) => unknown
}

// magic numbers for 384 well plates
const WELL_COUNT_384 = 384
const COLUMN_COUNT_384 = 24
const ROW_COUNT_384 = 16

export function Selection384Wells({
  allSelectedWells,
  channels,
  definition,
  deselectWells,
  labwareRender,
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

  const handleMinus = (): void => {
    if (lastSelectedIndex == null) {
      return
    }

    if (selectBy === 'wells') {
      deselectWells([wells[lastSelectedIndex]])
    } else {
      deselectWells(columns[lastSelectedIndex])
    }

    setLastSelectedIndex(lastSelectedIndex => {
      if (lastSelectedIndex != null && lastSelectedIndex !== 0) {
        return lastSelectedIndex - 1
      } else {
        return null
      }
    })
  }
  const handlePlus = (): void => {
    const nextIndex = lastSelectedIndex == null ? 0 : lastSelectedIndex + 1

    if (selectBy === 'columns') {
      if (channels === 8) {
        // for 8-channel, select first and second member of column (all rows) unless only one starting well option is selected
        if (startingWellState.A1 === startingWellState.B1) {
          selectWells({
            [columns[nextIndex][0]]: null,
            [columns[nextIndex][1]]: null,
          })
        } else if (startingWellState.A1) {
          selectWells({
            [columns[nextIndex][0]]: null,
          })
        } else if (startingWellState.B1) {
          selectWells({
            [columns[nextIndex][1]]: null,
          })
        }
      } else {
        // for single channel, select all members of column
        selectWells(
          columns[nextIndex].reduce((acc, well) => {
            return { ...acc, [well]: null }
          }, {})
        )
      }
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
            setSelectBy={setSelectBy}
            setLastSelectedIndex={setLastSelectedIndex}
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
  setLastSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>
}

function SelectBy({
  selectBy,
  setSelectBy,
  setLastSelectedIndex,
}: SelectByProps): JSX.Element {
  const { t, i18n } = useTranslation('quick_transfer')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {i18n.format(t('select_by'), 'capitalize')}
      </LegacyStyledText>
      <RadioButton
        buttonLabel={i18n.format(t('columns'), 'capitalize')}
        buttonValue="columns"
        isSelected={selectBy === 'columns'}
        onChange={() => {
          setSelectBy('columns')
          setLastSelectedIndex(lastSelectedIndex =>
            lastSelectedIndex != null
              ? Math.floor(lastSelectedIndex / ROW_COUNT_384)
              : lastSelectedIndex
          )
        }}
        radioButtonType="small"
      />
      <RadioButton
        buttonLabel={i18n.format(t('wells'), 'capitalize')}
        buttonValue="wells"
        isSelected={selectBy === 'wells'}
        onChange={() => {
          setSelectBy('wells')
          setLastSelectedIndex(lastSelectedIndex =>
            lastSelectedIndex != null
              ? (lastSelectedIndex + 1) * ROW_COUNT_384 - 1
              : lastSelectedIndex
          )
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

  // on mount, select A1 well group for 96-channel
  React.useEffect(() => {
    if (channels === 96) {
      selectWells({ A1: null })
    }
    setStartingWellState({ A1: true, A2: false, B1: false, B2: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {i18n.format(t('starting_well'), 'capitalize')}
      </LegacyStyledText>
      {checkboxWellOptions.map(well => (
        <Checkbox
          key={well}
          isChecked={startingWellState[well]}
          labelText={well}
          onClick={() => {
            if (channels === 96) {
              if (startingWellState[well]) {
                deselectWells([well])
              } else {
                selectWells({ [well]: null })
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
        <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {i18n.format(
            t(channels === 8 ? 'add_or_remove_columns' : 'add_or_remove'),
            'capitalize'
          )}
        </LegacyStyledText>
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
                ? lastSelectedIndex === COLUMN_COUNT_384 - 1
                : lastSelectedIndex === WELL_COUNT_384 - 1
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
