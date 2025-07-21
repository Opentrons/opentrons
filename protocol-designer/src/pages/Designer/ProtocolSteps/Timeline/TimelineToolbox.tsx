import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  Btn,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  LINE_CLAMP_TEXT_STYLE,
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
import { useKitchen } from '../../../../components/organisms/Kitchen/useKitchen'
import { getFileMetadata } from '../../../../file-data/selectors'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import {
  getInitialDeckSetup,
  getUnsavedForm,
} from '../../../../step-forms/selectors'
import {
  END_TERMINAL_ITEM_ID,
  START_TERMINAL_ITEM_ID,
  actions as steplistActions,
} from '../../../../steplist'
import { actions as stepsActions } from '../../../../ui/steps'
import {
  selectDropdownItem,
  selectTerminalItem,
} from '../../../../ui/steps/actions/actions'
import { AddStepButton } from './AddStepButton'
import { Configurations } from './Configurations'
import { DraggableSteps } from './DraggableSteps'
import { PresavedStep } from './PresavedStep'
import { TerminalItemStep } from './TerminalItemStep'

import type { Dispatch, SetStateAction } from 'react'
import type { StepIdType } from '../../../../form-types'
import type { ThunkDispatch } from '../../../../types'

const SIDEBAR_MIN_WIDTH_FOR_ICON = 170
const SIDEBAR_MIN_WIDTH_FOR_BACK_TEXT = 100
interface TimelineToolboxProps {
  sidebarWidth: number
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
}

export function TimelineToolbox({
  sidebarWidth,
  showLiquidOverflowMenu,
}: TimelineToolboxProps): JSX.Element {
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
  const isWidthForBackText = sidebarWidth < SIDEBAR_MIN_WIDTH_FOR_BACK_TEXT
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

  const name: string =
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
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText
            desktopStyle="bodyLargeSemiBold"
            overflowWrap={OVERFLOW_WRAP_ANYWHERE}
            css={LINE_CLAMP_TEXT_STYLE(1)}
          >
            {name}
          </StyledText>
          <Btn css={LINK_BUTTON_STYLE} onClick={handleGoBack}>
            <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
              <Icon name="chevron-left" size="0.75rem" minWidth="0.75rem" />
              <StyledText
                desktopStyle="bodyDefaultRegular"
                css={isWidthForBackText ? undefined : LINE_CLAMP_TEXT_STYLE(1)}
              >
                {isWidthForBackText ? t('back') : t('back_to_overview')}
              </StyledText>
            </Flex>
          </Btn>
        </Flex>
      }
      titlePadding={SPACING.spacing12}
      childrenPadding="0px"
      confirmButton={
        formData != null ? undefined : (
          <AddStepButton
            hasText={sidebarWidth > SIDEBAR_MIN_WIDTH_FOR_ICON}
            sidebarWidth={sidebarWidth}
          />
        )
      }
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="100%"
      >
        <Configurations
          sidebarWidth={sidebarWidth}
          showLiquidOverflowMenu={showLiquidOverflowMenu}
        />
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
