import * as React from 'react'
import { CONTEXT_MENU } from '@opentrons/components'
import { SelectField } from '../../../../../atoms/SelectField'
import * as Copy from '../i18n'
import { NetworkOptionLabel, NetworkActionLabel } from './NetworkOptionLabel'

import type { SelectOptionOrGroup } from '@opentrons/components'

import type { WifiNetwork } from '../types'

export interface SelectSsidProps {
  list: WifiNetwork[]
  value: string | null
  onConnect: (ssid: string) => unknown
  onJoinOther: () => unknown
  isRobotBusy: boolean
}

const FIELD_NAME = '__SelectSsid__'

const JOIN_OTHER_VALUE = '__join-other-network__'

const SELECT_JOIN_OTHER_GROUP = {
  options: [{ value: JOIN_OTHER_VALUE, label: Copy.LABEL_JOIN_OTHER_NETWORK }],
}

const formatOptions = (list: WifiNetwork[]): SelectOptionOrGroup[] => {
  const ssidOptionsList = {
    options: list?.map(({ ssid }) => ({ value: ssid })),
  }
  const options = [ssidOptionsList, SELECT_JOIN_OTHER_GROUP]

  return options
}

export function SelectSsid(props: SelectSsidProps): JSX.Element {
  const { list, value, onConnect, onJoinOther, isRobotBusy } = props

  const handleValueChange = (_: string, value: string): void => {
    if (value === JOIN_OTHER_VALUE) {
      onJoinOther()
    } else {
      onConnect(value)
    }
  }

  const formatOptionLabel: React.ComponentProps<
    typeof SelectField
  >['formatOptionLabel'] = (option, { context }): JSX.Element | null => {
    const { value, label } = option

    if (label != null) return <NetworkActionLabel label={label} />
    const network = list.find(nw => nw.ssid === value)

    // react-select sets context to tell us if the value is rendered in the
    // options menu list or in the currently selected value. If it's being
    // rendered in the menu, we want to show a connected icon if the network
    // is active, but if the context is value, we want to hide the icon
    return network != null ? (
      <NetworkOptionLabel
        {...network}
        showConnectedIcon={context === CONTEXT_MENU}
      />
    ) : null
  }

  return (
    <SelectField
      disabled={isRobotBusy}
      name={FIELD_NAME}
      value={value}
      options={formatOptions(list)}
      placeholder={Copy.SELECT_NETWORK}
      onValueChange={handleValueChange}
      formatOptionLabel={formatOptionLabel}
      width="16rem"
    />
  )
}
