import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { clsx } from 'clsx'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DropdownMenu,
  Flex,
  ListItem,
  RobotInfoLabel,
  SPACING,
  StyledText,
} from '@opentrons/components'

import lineClampStyles from '/protocol-designer/styles/lineclamp.module.css'
import { selectDropdownItem } from '/protocol-designer/ui/steps/actions/actions'

import type { DropdownOption, MenuPlacement } from '@opentrons/components'
import type { FieldProps } from '/protocol-designer/pages/Designer/ProtocolSteps/StepForm/types'

export interface DropdownStepFormFieldProps extends FieldProps {
  options: DropdownOption[]
  title: string
  width?: string
  onEnter?: (id: string) => void
  onExit?: () => void
  menuPlacement?: MenuPlacement
}

const FIRST_FIELDS = ['aspirate_labware', 'labware', 'moduleId']
const SECOND_FIELDS = ['dispense_labware', 'newLocation']

export function DropdownStepFormField(
  props: DropdownStepFormFieldProps
): JSX.Element {
  const {
    options,
    value,
    updateValue,
    title,
    errorToShow,
    tooltipContent,
    padding = `0 ${SPACING.spacing16}`,
    width = '17.5rem',
    onFieldFocus,
    onEnter,
    onExit,
    onFieldBlur,
    name: fieldName,
    menuPlacement,
  } = props
  const { t } = useTranslation(['tooltip', 'application'])
  const dispatch = useDispatch()
  const availableOptionId = options.find(opt => opt.value === value)
  const handleSelection = (value: string): void => {
    let text = t('application:selected')
    if (fieldName === 'newLocation') {
      text = t('application:new_location')
    } else if (fieldName === 'aspirate_labware') {
      text = t('application:source')
    } else if (fieldName === 'dispense_labware') {
      text = t('application:dest')
    }

    const selection = {
      id: value,
      text,
    }
    if (FIRST_FIELDS.includes(fieldName)) {
      dispatch(
        selectDropdownItem({
          selection: { ...selection, field: '1' },
          mode: 'add',
        })
      )
    } else if (SECOND_FIELDS.includes(fieldName)) {
      dispatch(
        selectDropdownItem({
          selection: { ...selection, field: '2' },
          mode: 'add',
        })
      )
    }
  }
  useEffect(
    () => {
      if (options.length === 1) {
        updateValue(options[0].value)
      }
      const valueOptions = options.map(option => option.value)
      if (!valueOptions.includes(value as string)) {
        updateValue(null)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.length]
  )

  return (
    <Flex padding={padding ?? SPACING.spacing16}>
      {/* NOTE: we should not run into value == null when length === 1, but this
      just some extra error protection so users can't stuck where they can't select a value */}
      {options.length > 1 ||
      options.length === 0 ||
      (value == null && options.length === 1) ? (
        <DropdownMenu
          tooltipText={tooltipContent != null ? t(`${tooltipContent}`) : null}
          width={width}
          error={errorToShow}
          dropdownType="neutral"
          filterOptions={options}
          title={title}
          onBlur={onFieldBlur}
          onFocus={onFieldFocus}
          currentOption={
            availableOptionId ?? { name: 'Choose option', value: '' }
          }
          onClick={value => {
            updateValue(value)
            handleSelection(value)
          }}
          onEnter={onEnter}
          onExit={onExit}
          menuPlacement={menuPlacement}
          testId={fieldName}
        />
      ) : (
        <Flex
          gridGap={SPACING.spacing8}
          flexDirection={DIRECTION_COLUMN}
          width="100%"
        >
          <StyledText desktopStyle="bodyDefaultSemiBold">{title}</StyledText>
          <ListItem type="default">
            <Flex
              gridGap={SPACING.spacing8}
              alignItems={ALIGN_CENTER}
              padding={SPACING.spacing12}
            >
              {options[0].deckLabel != null ? (
                <RobotInfoLabel deckLabel={options[0].deckLabel} svgSize={13} />
              ) : null}
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={options[0].subtext != null ? SPACING.spacing4 : '0'}
              >
                {options[0].name !== options[0].deckLabel ? (
                  <StyledText
                    desktopStyle="captionRegular"
                    className={clsx(
                      lineClampStyles.line_clamp,
                      lineClampStyles.word_normal
                    )}
                    style={{ WebkitLineClamp: 3 }}
                  >
                    {options[0].name}
                  </StyledText>
                ) : null}
                <StyledText
                  desktopStyle="captionRegular"
                  color={COLORS.black70}
                >
                  {options[0].subtext}
                </StyledText>
              </Flex>
            </Flex>
          </ListItem>
          {errorToShow != null ? (
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.red50}>
              {errorToShow}
            </StyledText>
          ) : null}
        </Flex>
      )}
    </Flex>
  )
}
