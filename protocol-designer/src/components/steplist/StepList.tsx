import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  DIRECTION_COLUMN,
  Flex,
  Modal,
  PrimaryButton,
  SPACING,
  SecondaryButton,
  SidePanel,
} from '@opentrons/components'

import { END_TERMINAL_TITLE } from '../../constants'
import {
  END_TERMINAL_ITEM_ID,
  actions as steplistActions,
} from '../../steplist'
import { actions as stepsActions, getIsMultiSelectMode } from '../../ui/steps'
import { selectors as stepFormSelectors } from '../../step-forms'
import { StepCreationButton } from '../StepCreationButton'
import { DraggableStepItems } from './DraggableStepItems'
import { MultiSelectToolbar } from './MultiSelectToolbar'
import { PresavedStepItem } from './PresavedStepItem'
import { StartingDeckStateTerminalItem } from './StartingDeckStateTerminalItem'
import { TerminalItem } from './TerminalItem'

import type { StepIdType } from '../../form-types'
import type { ThunkDispatch } from '../../types'
import { getUnsavedGroup } from '../../step-forms/selectors'
import {
  addStepToGroup,
  clearGroup,
  createGroup,
} from '../../step-forms/actions/groups'

export interface StepListProps {
  isMultiSelectMode?: boolean | null
  orderedStepIds: StepIdType[]
  reorderSelectedStep: (delta: number) => void
  reorderSteps: (steps: StepIdType[]) => void
}

export const StepList = (): JSX.Element => {
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const [group, setGroup] = React.useState<boolean>(false)

  const [groupName, setGroupName] = React.useState<string>('')
  const stepIds = useSelector(getUnsavedGroup)

  const handleCreateGroup = (): void => {
    if (groupName && stepIds.length > 0) {
      dispatch(createGroup({ groupName }))
      dispatch(addStepToGroup({ groupName, stepIds }))
      dispatch(clearGroup())
      setGroupName('')
    }
  }

  const handleKeyDown: (e: KeyboardEvent) => void = e => {
    const key = e.key
    const altIsPressed = e.altKey

    if (altIsPressed) {
      let delta = 0
      if (key === 'ArrowUp') {
        delta = -1
      } else if (key === 'ArrowDown') {
        delta = 1
      }
      if (!delta) return
      dispatch(stepsActions.reorderSelectedStep(delta))
    }
  }

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      handleKeyDown(e)
    }

    global.addEventListener('keydown', onKeyDown, false)

    return () => {
      global.removeEventListener('keydown', onKeyDown, false)
    }
  }, [])

  return group ? (
    <Modal>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <PrimaryButton
          onClick={() => {
            setGroup(false)
          }}
        >
          close
        </PrimaryButton>
        <input
          type="text"
          value={groupName}
          onChange={e => {
            setGroupName(e.target.value)
          }}
          placeholder="Enter group name"
        />
        <SecondaryButton onClick={handleCreateGroup}>
          create group
        </SecondaryButton>
      </Flex>
    </Modal>
  ) : (
    <SidePanel title="Protocol Timeline">
      <PrimaryButton
        onClick={() => {
          setGroup(true)
        }}
      >
        make group
      </PrimaryButton>
      <MultiSelectToolbar isMultiSelectMode={Boolean(isMultiSelectMode)} />

      <StartingDeckStateTerminalItem />
      <DraggableStepItems
        orderedStepIds={orderedStepIds}
        reorderSteps={(stepIds: StepIdType[]) => {
          dispatch(steplistActions.reorderSteps(stepIds))
        }}
      />
      <PresavedStepItem />
      <StepCreationButton />
      <TerminalItem id={END_TERMINAL_ITEM_ID} title={END_TERMINAL_TITLE} />
    </SidePanel>
  )
}
