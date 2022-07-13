import * as React from 'react'
import ReactSelect, { components, DropdownIndicatorProps } from 'react-select'
import { css, CSSObject } from 'styled-components'
import {
  Icon,
  BORDERS,
  TYPOGRAPHY,
  COLORS,
  Box,
  SPACING,
  DIRECTION_ROW,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
} from '@opentrons/components'

import type { Props as ReactSelectProps } from 'react-select'

export interface SelectOption {
  value: string
  label?: string
  isDisabled?: boolean
}

export type SelectProps = ReactSelectProps<SelectOption>

interface SelectComponentProps extends SelectProps {
  width?: string
}

const VOID_STYLE: unknown = undefined
const NO_STYLE_FN = (): CSSObject => VOID_STYLE as CSSObject

const SELECT_STYLES = css`
  position: ${POSITION_RELATIVE};
  font-size: ${TYPOGRAPHY.fontSizeP};
`

const INDICATOR_STYLES = css`
  position: ${POSITION_ABSOLUTE};
  top: 0.75rem;
  right: ${SPACING.spacing2};
  width: ${SPACING.spacingM};
`
export function Select(props: SelectComponentProps): JSX.Element {
  const CLEAR_DEFAULT_STYLES_AND_SET_NEW_STYLES = {
    clearIndicator: NO_STYLE_FN,
    control: (styles: any) => ({
      ...styles,
      borderRadius: BORDERS.radiusRoundEdge,
      border: BORDERS.lineBorder,
      width: props.width != null ? props.width : 'auto',
      height: SPACING.spacing4,
      borderColor: COLORS.medGrey,
      boxShadow: 'none',
      padding: '0.375rem',
      margin: '0rem',
      flexDirection: DIRECTION_ROW,
      '&:hover': {
        borderColor: COLORS.medGreyHover,
      },
      '&:active': {
        borderColor: COLORS.medGreyHover,
      },
    }),
    container: NO_STYLE_FN,
    dropdownIndicator: NO_STYLE_FN,
    group: NO_STYLE_FN,
    groupHeading: NO_STYLE_FN,
    indicatorsContainer: NO_STYLE_FN,
    indicatorSeparator: NO_STYLE_FN,
    input: (styles: any) => ({
      ...styles,
      zIndex: 5,
      position: 'absolute',
      top: SPACING.spacingXS,
      paddingLeft: '0.375rem',
    }),
    loadingIndicator: NO_STYLE_FN,
    loadingMessage: NO_STYLE_FN,
    menu: (styles: any) => ({
      ...styles,
      backgroundColor: COLORS.white,
      width: props.width != null ? props.width : 'auto',
      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)',
      borderRadius: '4px 4px 0px 0px',
    }),
    menuList: NO_STYLE_FN,
    menuPortal: NO_STYLE_FN,
    multiValue: NO_STYLE_FN,
    multiValueLabel: NO_STYLE_FN,
    multiValueRemove: NO_STYLE_FN,
    noOptionsMessage: (styles: any) => ({
      ...styles,
      padding: '0.375rem',
      color: COLORS.darkBlack,
    }),
    option: (styles: any, state: any) => ({
      ...styles,
      color: COLORS.darkBlack,
      backgroundColor: state.isSelected ? COLORS.lightBlue : COLORS.white,
      '&:hover': {
        backgroundColor: COLORS.lightBlue,
      },
      '&:active': {
        backgroundColor: COLORS.lightBlue,
      },
    }),
    placeholder: (styles: any) => ({
      ...styles,
      marginLeft: SPACING.spacingSS,
      color: COLORS.darkBlack,
    }),
    singleValue: (styles: any) => ({
      ...styles,
      marginRight: '0.75rem',
      marginTop: SPACING.spacing1,
      marginLeft: SPACING.spacing3,
    }),
    valueContainer: NO_STYLE_FN,
  }

  return (
    <ReactSelect
      {...props}
      styles={CLEAR_DEFAULT_STYLES_AND_SET_NEW_STYLES}
      components={{ DropdownIndicator }}
      css={SELECT_STYLES}
    />
  )
}

function DropdownIndicator(
  props: DropdownIndicatorProps<SelectOption>
): JSX.Element {
  return (
    <components.DropdownIndicator {...props}>
      <Box css={INDICATOR_STYLES}>
        <Icon
          name={props.selectProps.menuIsOpen ? 'chevron-up' : 'chevron-down'}
          height={TYPOGRAPHY.lineHeight16}
        />
      </Box>
    </components.DropdownIndicator>
  )
}
