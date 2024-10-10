import ReactSelect, { components } from 'react-select'

import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_ROW,
  Icon,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type {
  Props as ReactSelectProps,
  StylesConfig,
  OptionProps,
  CSSObjectWithLabel,
  DropdownIndicatorProps,
} from 'react-select'
import type { DropdownBorder } from '@opentrons/components'

export interface SelectOption {
  value: string
  label?: string
  isDisabled?: boolean
}

export type SelectProps = ReactSelectProps<SelectOption>

interface SelectComponentProps extends SelectProps {
  width?: string
  dropdownType?: DropdownBorder
}

const VOID_STYLE: unknown = undefined
const NO_STYLE_FN = (): CSSObjectWithLabel => VOID_STYLE as CSSObjectWithLabel

export function Select(props: SelectComponentProps): JSX.Element {
  const { dropdownType, menuIsOpen, width } = props
  const CLEAR_DEFAULT_STYLES_AND_SET_NEW_STYLES: StylesConfig<SelectOption> = {
    clearIndicator: NO_STYLE_FN,
    control: (styles: CSSObjectWithLabel) => ({
      ...styles,
      borderRadius:
        dropdownType === 'rounded'
          ? BORDERS.borderRadiusFull
          : BORDERS.borderRadius4,
      border: `1px ${BORDERS.styleSolid} ${
        menuIsOpen ? COLORS.blue50 : COLORS.grey50
      }`,
      width: width ?? 'auto',
      height: SPACING.spacing16,
      borderColor: COLORS.grey30,
      boxShadow: 'none',
      padding: SPACING.spacing6,
      flexDirection: DIRECTION_ROW,
      '&:hover': {
        borderColor: COLORS.grey50,
      },
      '&:active': {
        borderColor: COLORS.blue50,
      },
    }),
    container: (styles: CSSObjectWithLabel) => ({
      ...styles,
      position: POSITION_RELATIVE,
    }),
    dropdownIndicator: NO_STYLE_FN,
    group: NO_STYLE_FN,
    groupHeading: (styles: CSSObjectWithLabel) => ({
      ...styles,
      color: COLORS.black90,
      fontWeight: TYPOGRAPHY.fontWeightSemiBold,
      fontSize: TYPOGRAPHY.fontSizeP,
    }),
    indicatorsContainer: NO_STYLE_FN,
    indicatorSeparator: NO_STYLE_FN,
    input: (styles: CSSObjectWithLabel) => ({
      ...styles,
      zIndex: 5,
      position: POSITION_ABSOLUTE,
      top: SPACING.spacing4,
      paddingLeft: SPACING.spacing6,
      fontSize: TYPOGRAPHY.fontSizeP,
    }),
    loadingIndicator: NO_STYLE_FN,
    loadingMessage: NO_STYLE_FN,
    menu: (styles: CSSObjectWithLabel) => ({
      ...styles,
      backgroundColor: COLORS.white,
      width: width != null ? width : 'auto',
      boxShadowcha: '0px 1px 3px rgba(0, 0, 0, 0.2)',
      borderRadius: '4px 4px 0px 0px',
      marginTop: SPACING.spacing4,
      fontSize: TYPOGRAPHY.fontSizeP,
    }),
    menuList: (styles: CSSObjectWithLabel) => ({
      ...styles,
      maxHeight: '55vh',
      overflowY: 'scroll',
    }),
    menuPortal: (styles: CSSObjectWithLabel) => ({
      ...styles,
      zIndex: 10,
    }),
    multiValue: NO_STYLE_FN,
    multiValueLabel: NO_STYLE_FN,
    multiValueRemove: NO_STYLE_FN,
    noOptionsMessage: (styles: CSSObjectWithLabel) => ({
      ...styles,
      padding: SPACING.spacing6,
      color: COLORS.black90,
    }),
    option: (styles: CSSObjectWithLabel, state: OptionProps<SelectOption>) => ({
      ...styles,
      color: Boolean(state.isDisabled) ? COLORS.grey30 : COLORS.black90,
      backgroundColor: Boolean(state.isSelected) ? COLORS.blue10 : COLORS.white,
      '&:hover': {
        backgroundColor: COLORS.blue10,
      },
      '&:active': {
        backgroundColor: COLORS.blue10,
      },
    }),
    placeholder: (styles: CSSObjectWithLabel) => ({
      ...styles,
      marginLeft: SPACING.spacing8,
      color: COLORS.black90,
      fontSize: TYPOGRAPHY.fontSizeP,
      marginTop: '0.2rem',
    }),
    singleValue: (styles: CSSObjectWithLabel) => ({
      ...styles,
      marginRight: SPACING.spacing12,
      marginLeft: SPACING.spacing4,
      marginTop: '0.2rem',
      fontSize: TYPOGRAPHY.fontSizeP,
    }),
    valueContainer: NO_STYLE_FN,
  }

  return (
    <ReactSelect
      {...props}
      styles={CLEAR_DEFAULT_STYLES_AND_SET_NEW_STYLES}
      components={{ DropdownIndicator }}
    />
  )
}

function DropdownIndicator(
  props: DropdownIndicatorProps<SelectOption>
): JSX.Element {
  return (
    <components.DropdownIndicator {...props}>
      <Box
        position={POSITION_ABSOLUTE}
        top="0.55rem"
        right={SPACING.spacing8}
        width={SPACING.spacing20}
      >
        {Boolean(props.selectProps.menuIsOpen) ? (
          <Icon transform="rotate(180deg)" name="menu-down" height="1rem" />
        ) : (
          <Icon name="menu-down" height="1rem" />
        )}
      </Box>
    </components.DropdownIndicator>
  )
}
