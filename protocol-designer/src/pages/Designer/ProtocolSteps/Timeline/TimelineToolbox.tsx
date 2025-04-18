import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  Btn,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  OVERFLOW_WRAP_ANYWHERE,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  Toolbox,
} from '@opentrons/components'

import {
  LINK_BUTTON_STYLE,
  NAV_BAR_HEIGHT_REM,
} from '../../../../components/atoms'
import {
  END_TERMINAL_ITEM_ID,
  START_TERMINAL_ITEM_ID,
  actions as steplistActions,
} from '../../../../steplist'
import { useKitchen } from '../../../../components/organisms/Kitchen/hooks'
import { actions as stepsActions } from '../../../../ui/steps'
import { getFileMetadata } from '../../../../file-data/selectors'
import {
  selectDropdownItem,
  selectTerminalItem,
} from '../../../../ui/steps/actions/actions'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import {
  getInitialDeckSetup,
  getUnsavedForm,
} from '../../../../step-forms/selectors'
import { TerminalItemStep } from './TerminalItemStep'
import { AddStepButton } from './AddStepButton'
import { PresavedStep } from './PresavedStep'
import { DraggableSteps } from './DraggableSteps'
import { truncateString } from './utils'
import { HardwareStep } from './HardwareStep'

import type { StepIdType } from '../../../../form-types'
import type { ThunkDispatch } from '../../../../types'

const SIDEBAR_MIN_WIDTH_FOR_ICON = 170
interface TimelineToolboxProps {
  sidebarWidth: number
}

export const TimelineToolbox = ({
  sidebarWidth,
}: TimelineToolboxProps): JSX.Element => {
  const { t } = useTranslation([
    'protocol_steps',
    'protocol_overview',
    'starting_deck_state',
  ])
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  const formData = useSelector(getUnsavedForm)
  const fileMetadata = useSelector(getFileMetadata)
  const navigate = useNavigate()
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const { makeSnackbar } = useKitchen()
  const { additionalEquipmentOnDeck } = initialDeckSetup
  const hasTrash = Object.values(additionalEquipmentOnDeck).some(
    ae => ae.name === 'trashBin' || ae.name === 'wasteChute'
  )
  const isSidebarWidthSmall = sidebarWidth < 162
  const protocolName = fileMetadata.protocolName

  const handleKeyDown: (e: KeyboardEvent) => void = e => {
    const { key, altKey: altIsPressed } = e

    if (altIsPressed) {
      let delta = 0
      if (key === 'ArrowUp') {
        delta = -1
      } else if (key === 'ArrowDown') {
        delta = 1
      }
      dispatch(stepsActions.reorderSelectedStep(delta))
    }
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      handleKeyDown(e)
    }

    global.addEventListener('keydown', onKeyDown, false)

    return () => {
      global.removeEventListener('keydown', onKeyDown, false)
    }
  }, [])

  const handleGoBack = (): void => {
    if (hasTrash) {
      navigate('/overview')
      dispatch(selectTerminalItem(START_TERMINAL_ITEM_ID))
      dispatch(
        selectDropdownItem({
          selection: null,
          mode: 'clear',
        })
      )
    } else {
      makeSnackbar(t('starting_deck_state:trash_required') as string)
    }
  }

  const name =
    protocolName != null && protocolName !== ''
      ? protocolName
      : t('protocol_overview:untitled_protocol')

  return (
    <Toolbox
      position={POSITION_RELATIVE}
      height="100%"
      maxHeight={`calc(100vh - ${NAV_BAR_HEIGHT_REM}rem - 2 * ${SPACING.spacing12})`}
      width={`${sidebarWidth / 16}rem`}
      title={
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText
            desktopStyle="bodyDefaultSemiBold"
            overflowWrap={OVERFLOW_WRAP_ANYWHERE}
          >
            {isSidebarWidthSmall
              ? truncateString(name, Math.floor(sidebarWidth / 10))
              : name}
          </StyledText>
          <Btn css={LINK_BUTTON_STYLE} onClick={handleGoBack}>
            <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
              <Icon name="chevron-left" size="12px" />
              <StyledText desktopStyle="bodyDefaultRegular" width="max-content">
                {isSidebarWidthSmall
                  ? truncateString(
                      t('back_to_overview'),
                      Math.floor(sidebarWidth / 10),
                      true
                    )
                  : t('back_to_overview')}
              </StyledText>
            </Flex>
          </Btn>
        </Flex>
      }
      titlePadding={SPACING.spacing12}
      childrenPadding="0px"
      confirmButton={
        formData != null ? undefined : (
          <AddStepButton hasText={sidebarWidth > SIDEBAR_MIN_WIDTH_FOR_ICON} />
        )
      }
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="100%"
      >
        <HardwareStep sidebarWidth={sidebarWidth} />
        <Flex
          padding={SPACING.spacing12}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
        >
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('timeline')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <TerminalItemStep
              id={START_TERMINAL_ITEM_ID}
              sidebarWidth={sidebarWidth}
            />
            <DraggableSteps
              orderedStepIds={orderedStepIds}
              reorderSteps={(stepIds: StepIdType[]) => {
                dispatch(steplistActions.reorderSteps(stepIds))
              }}
              sidebarWidth={sidebarWidth}
            />
            <PresavedStep sidebarWidth={sidebarWidth} />
            <TerminalItemStep
              id={END_TERMINAL_ITEM_ID}
              sidebarWidth={sidebarWidth}
            />
          </Flex>
        </Flex>
      </Flex>
    </Toolbox>
  )
}
