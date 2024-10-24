import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  Flex,
  Btn,
  JUSTIFY_SPACE_BETWEEN,
  SecondaryButton,
  PrimaryButton,
  SPACING,
  StyledText,
  DIRECTION_COLUMN,
  DropdownMenu,
  ALIGN_CENTER,
} from '@opentrons/components'
import { getMainPagePortalEl } from '../../components/portals/MainPageModalPortal'
import { BUTTON_LINK_STYLE } from '../../atoms'
import { WellOrderVisualization } from './WellOrderVisualization'
import type { WellOrderOption } from '../../form-types'

const DEFAULT_FIRST: WellOrderOption = 't2b'
const DEFAULT_SECOND: WellOrderOption = 'l2r'
const VERTICAL_VALUES: WellOrderOption[] = ['t2b', 'b2t']
const HORIZONTAL_VALUES: WellOrderOption[] = ['l2r', 'r2l']
const WELL_ORDER_VALUES: WellOrderOption[] = [
  ...VERTICAL_VALUES,
  ...HORIZONTAL_VALUES,
]

export interface WellOrderModalProps {
  isOpen: boolean
  closeModal: () => void
  prefix: 'aspirate' | 'dispense' | 'mix'
  firstName: string
  secondName: string
  firstValue?: WellOrderOption | null
  secondValue?: WellOrderOption | null
  updateValues: (
    firstValue?: WellOrderOption | null,
    secondValue?: WellOrderOption | null
  ) => void
}

interface State {
  firstValue: WellOrderOption
  secondValue: WellOrderOption
}

export const WellOrderModal = (
  props: WellOrderModalProps
): JSX.Element | null => {
  const { t } = useTranslation(['form', 'modal', 'shared'])
  const {
    isOpen,
    closeModal,
    updateValues,
    firstValue,
    secondValue,
    firstName,
    secondName,
  } = props
  const getInitialFirstValues = (): {
    initialFirstValue: WellOrderOption
    initialSecondValue: WellOrderOption
  } => {
    if (firstValue == null || secondValue == null) {
      return {
        initialFirstValue: DEFAULT_FIRST,
        initialSecondValue: DEFAULT_SECOND,
      }
    }
    return {
      initialFirstValue: firstValue,
      initialSecondValue: secondValue,
    }
  }
  const { initialFirstValue, initialSecondValue } = getInitialFirstValues()

  const [wellOrder, setWellOrder] = React.useState<State>({
    firstValue: initialFirstValue,
    secondValue: initialSecondValue,
  })

  React.useEffect(() => {
    setWellOrder({
      firstValue: initialFirstValue,
      secondValue: initialSecondValue,
    })
  }, [initialFirstValue, initialSecondValue])

  const applyChanges = (): void => {
    updateValues(wellOrder.firstValue, wellOrder.secondValue)
  }

  const handleReset = (): void => {
    setWellOrder({ firstValue: DEFAULT_FIRST, secondValue: DEFAULT_SECOND })
    applyChanges()
    closeModal()
  }

  const handleCancel = (): void => {
    const { initialFirstValue, initialSecondValue } = getInitialFirstValues()
    setWellOrder({
      firstValue: initialFirstValue,
      secondValue: initialSecondValue,
    })
    closeModal()
  }

  const handleDone = (): void => {
    applyChanges()
    closeModal()
  }

  const makeOnChange = (ordinality: 'first' | 'second') => (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const { value } = event.currentTarget
    let nextState: State = { ...wellOrder, [`${ordinality}Value`]: value }

    if (ordinality === 'first') {
      if (
        VERTICAL_VALUES.includes(value as WellOrderOption) &&
        VERTICAL_VALUES.includes(wellOrder.secondValue)
      ) {
        nextState = { ...nextState, secondValue: HORIZONTAL_VALUES[0] }
      } else if (
        HORIZONTAL_VALUES.includes(value as WellOrderOption) &&
        HORIZONTAL_VALUES.includes(wellOrder.secondValue)
      ) {
        nextState = { ...nextState, secondValue: VERTICAL_VALUES[0] }
      }
    }
    setWellOrder(nextState)
  }

  const isSecondOptionDisabled = (value: WellOrderOption): boolean => {
    if (VERTICAL_VALUES.includes(wellOrder.firstValue)) {
      return VERTICAL_VALUES.includes(value)
    } else if (HORIZONTAL_VALUES.includes(wellOrder.firstValue)) {
      return HORIZONTAL_VALUES.includes(value)
    } else {
      return false
    }
  }

  if (!isOpen) return null

  return createPortal(
    <Modal
      width="37.125rem"
      closeOnOutsideClick
      type="info"
      onClose={handleCancel}
      title={t('shared:edit_well_order')}
      footer={
        <Flex
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={SPACING.spacing24}
          alignItems={ALIGN_CENTER}
        >
          <Btn onClick={handleReset} css={BUTTON_LINK_STYLE}>
            {t('shared:reset_to_default')}
          </Btn>
          <Flex gridGap={SPACING.spacing8}>
            <SecondaryButton onClick={handleCancel}>
              {t('shared:cancel')}
            </SecondaryButton>
            <PrimaryButton onClick={handleDone}>
              {t('shared:save')}
            </PrimaryButton>
          </Flex>
        </Flex>
      }
    >
      <Flex gridGap={SPACING.spacing40}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('shared:change_robot_movement')}
          </StyledText>
          <DropdownMenu
            key={firstName}
            title={t('shared:primary_order')}
            dropdownType="neutral"
            currentOption={{
              name: t(
                `step_edit_form.field.well_order.option.${wellOrder.firstValue}`
              ),
              value: wellOrder.firstValue,
            }}
            onClick={() => {
              makeOnChange('first')
            }}
            filterOptions={WELL_ORDER_VALUES.map(value => ({
              value,
              name: t(`step_edit_form.field.well_order.option.${value}`),
            }))}
          />
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('modal:well_order.then')}
          </StyledText>
          <DropdownMenu
            key={secondName}
            title={t('shared:secondary_order')}
            dropdownType="neutral"
            currentOption={{
              name: t(
                `step_edit_form.field.well_order.option.${wellOrder.secondValue}`
              ),
              value: wellOrder.secondValue,
            }}
            onClick={() => {
              makeOnChange('second')
            }}
            filterOptions={WELL_ORDER_VALUES.map(value => ({
              value,
              name: t(`step_edit_form.field.well_order.option.${value}`),
              disabled: isSecondOptionDisabled(value),
            }))}
          />
        </Flex>
        <WellOrderVisualization
          firstValue={wellOrder.firstValue}
          secondValue={wellOrder.secondValue}
        />
      </Flex>
    </Modal>,
    getMainPagePortalEl()
  )
}
