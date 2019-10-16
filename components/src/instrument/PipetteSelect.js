// @flow
import * as React from 'react'
import cx from 'classnames'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import without from 'lodash/without'

import Select, { components } from 'react-select'

import {
  type PipetteNameSpecs,
  getAllPipetteNames,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'
import { Icon } from '../icons'
import styles from './PipetteSelect.css'

// TODO: BC 2019-09-17 This component has a lot of shared guts with SelectField
// Their shared characteristics can be summed up by their usage of react-select
// in combination with our Opentrons specific design. Ideally we'd
// like to have one component in CL that acts as our generic "custom" wrapper
// of react-select, and SelectField and PipetteSelect should contain instances
// of that generic component. This will be the first step towards using that
// generic component across all dropdowns in the JS codebase.

type Props = {|
  /** currently selected value, optional in case selecting triggers immediate action */
  value?: PipetteNameSpecs | null,
  /** react-select change handler */
  onPipetteChange: (option: PipetteNameSpecs | null) => mixed,
  /** list of pipette names to omit */
  nameBlacklist?: Array<string>,
  /** whether or not "None" shows up as the default option */
  enableNoneOption?: boolean,
  /** input tabIndex */
  tabIndex?: string,
  /** classes to apply to the top-level component */
  className?: string,
|}

type NoneOption = {| value: null |}
const OPTION_NONE: NoneOption = { value: null }
// TODO(mc, 2019-10-14): i18n
const OPTION_NONE_LABEL = 'None'

const SELECT_STYLES = {
  input: () => ({ padding: 0 }),
  groupHeading: () => ({ margin: 0 }),
  menu: () => ({ margin: 0 }),
  menuList: () => ({ padding: 0 }),
  valueContainer: base => ({
    ...base,
    padding: '0 0.75rem',
  }),
}

const clearStyles = () => null

const PipetteSelect = (props: Props) => {
  const filteredNames = without(
    getAllPipetteNames('maxVolume', 'channels'),
    ...(props.nameBlacklist || [])
  )
  const allPipetteNameSpecs = map(filteredNames, getPipetteNameSpecs)
  const nameSpecsByCategory = groupBy(allPipetteNameSpecs, 'displayCategory')
  let groupedOptions = map(nameSpecsByCategory, nameSpecs => ({
    options: nameSpecs,
  })).reverse()

  if (props.enableNoneOption === true) {
    groupedOptions = [{ options: [OPTION_NONE] }, ...groupedOptions]
  }

  const handleChange = (option: PipetteNameSpecs | NoneOption) => {
    const value = option.value === null ? null : option
    props.onPipetteChange(value)
  }

  return (
    <Select
      isSearchable={false}
      menuPosition="fixed"
      className={props.className}
      styles={SELECT_STYLES}
      components={{
        Control,
        DropdownIndicator,
        Menu,
        Group,
        Option,
        SingleValue,
        Placeholder: props.enableNoneOption
          ? NonePlaceholder
          : components.Placeholder,
        IndicatorSeparator: null,
      }}
      options={groupedOptions}
      onChange={handleChange}
      value={props.value}
    />
  )
}

function Control(props: any) {
  return (
    <components.Control
      {...props}
      getStyles={clearStyles}
      className={cx(styles.select_control, {
        [styles.focus]: props.selectProps.menuIsOpen,
      })}
    />
  )
}

function DropdownIndicator(props: any) {
  const iconWrapperCx = cx(styles.dropdown_icon_wrapper, {
    [styles.flipped]: props.selectProps.menuIsOpen,
  })

  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <div className={iconWrapperCx}>
          <Icon name="menu-down" width="100%" />
        </div>
      </components.DropdownIndicator>
    )
  )
}
// custom Menu (options dropdown) component
function Menu(props: any) {
  return (
    <components.Menu {...props}>
      <div className={styles.select_menu}>{props.children}</div>
    </components.Menu>
  )
}

// custom option group wrapper component
function Group(props: any) {
  return (
    <components.Group
      {...props}
      className={styles.select_group}
      getStyles={clearStyles}
    />
  )
}

function PipetteNameItem(props: PipetteNameSpecs) {
  const { channels, displayName, displayCategory } = props
  const volumeClassMaybeMatch = displayName && displayName.match(/P\d+/)
  const volumeClass = volumeClassMaybeMatch ? volumeClassMaybeMatch[0] : ''

  let displayChannels = ''
  if (channels === 1) {
    displayChannels = 'Single-Channel'
  } else if (channels === 8) {
    displayChannels = '8-Channel'
  }

  return (
    <>
      <div className={styles.pipette_volume_class}>{volumeClass}</div>
      <div className={styles.pipette_channels}>{displayChannels}</div>
      <div className={styles.pipette_category}>{displayCategory}</div>
    </>
  )
}

function Option(props: any) {
  const { innerRef, innerProps, data } = props

  return (
    <div ref={innerRef} className={styles.pipette_option} {...innerProps}>
      {data.value === null ? (
        <NonePlaceholder />
      ) : (
        <PipetteNameItem {...data} />
      )}
    </div>
  )
}

function NonePlaceholder() {
  return OPTION_NONE_LABEL
}

function SingleValue(props: any) {
  const { data } = props

  return (
    <components.SingleValue {...props}>
      {data.value === null ? <NonePlaceholder /> : data.displayName}
    </components.SingleValue>
  )
}

export default PipetteSelect
