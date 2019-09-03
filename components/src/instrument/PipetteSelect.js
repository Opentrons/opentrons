// @flow
import * as React from 'react'
import cx from 'classnames'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import without from 'lodash/without'

import Select, { components } from 'react-select'

import {
  type PipetteNameSpec,
  getAllPipetteNames,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'
import { Icon } from '../icons'
import styles from './PipetteSelect.css'

type SelectProps = {|
  /** currently selected value, optional in case selecting triggers immediate action */
  value?: string,
  /** react-select change handler */
  onChange: (option: *) => mixed,
  /** list of pipette names to omit */
  nameBlacklist?: Array<string>,
|}

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

const PipetteSelect = (props: SelectProps) => {
  const filteredNames = without(
    getAllPipetteNames('maxVolume', 'channels'),
    ...(props.nameBlacklist || [])
  )
  const allPipetteNameSpecs = map(filteredNames, getPipetteNameSpecs)
  const nameSpecsByCategory = groupBy(allPipetteNameSpecs, 'displayCategory')
  const groupedOptions = map(nameSpecsByCategory, nameSpecs => ({
    options: nameSpecs,
  })).reverse()
  return (
    <Select
      isSearchable={false}
      className={styles.pipette_select}
      styles={SELECT_STYLES}
      components={{
        Control,
        DropdownIndicator,
        Menu,
        Group,
        Option,
        ValueContainer,
        IndicatorSeparator: null,
      }}
      options={groupedOptions}
      {...props}
    />
  )
}

function Control(props: *) {
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

function DropdownIndicator(props: *) {
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
function Menu(props: *) {
  return (
    <components.Menu {...props}>
      <div className={styles.select_menu}>{props.children}</div>
    </components.Menu>
  )
}

// custom option group wrapper component
function Group(props: *) {
  return (
    <components.Group
      {...props}
      className={styles.select_group}
      getStyles={clearStyles}
    />
  )
}

function PipetteNameItem(props: PipetteNameSpec) {
  const { channels, displayName, displayCategory } = props
  const volumeClassMaybeMatch = displayName && displayName.match(/P\d+/)
  const volumeClass = volumeClassMaybeMatch ? volumeClassMaybeMatch[0] : ''

  let displayChannels = ''
  if (channels === 1) {
    displayChannels = 'Single-Channel'
  } else if (channels === 8) {
    displayChannels = '8-Channel'
  }

  const cleanDisplayCategory = displayCategory === 'OG' ? '' : displayCategory

  return (
    <>
      <div className={styles.pipette_volume_class}>{volumeClass}</div>
      <div className={styles.pipette_channels}>{displayChannels}</div>
      <div className={styles.pipette_category}>{cleanDisplayCategory}</div>
    </>
  )
}

function Option(props: *) {
  const { innerRef, innerProps, data } = props

  return (
    <div ref={innerRef} className={styles.pipette_option} {...innerProps}>
      <PipetteNameItem {...data} />
    </div>
  )
}

function ValueContainer(props: *) {
  if (!props.hasValue) {
    return <components.ValueContainer {...props} />
  }
  const value = props.getValue()

  return (
    <components.ValueContainer {...props}>
      <PipetteNameItem {...value[0]} />
    </components.ValueContainer>
  )
}

export default PipetteSelect
