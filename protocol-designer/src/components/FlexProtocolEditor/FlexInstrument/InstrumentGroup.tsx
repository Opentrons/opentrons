import * as React from 'react'

import { InstrumentInfo } from './InstrumentInfo'
import styles from './instrument.css'

import type { InstrumentInfoProps } from './InstrumentInfo'
import { SecondaryButton } from '@opentrons/components'
import { i18n } from '../../../localization'

export interface InstrumentGroupProps {
  showMountLabel?: boolean | null | undefined
  left?: InstrumentInfoProps | null | undefined
  right?: InstrumentInfoProps | null | undefined
}

const EMPTY_INSTRUMENT_PROPS = {
  description: 'None',
  tiprackModel: 'N/A',
  isDisabled: false,
}

/**
 * Renders a left and right pipette diagram & info.
 * Takes child `InstrumentInfo` props in `right` and `left` props.
 */
export function InstrumentGroup(props: InstrumentGroupProps): JSX.Element {
  const { left, right } = props

  const leftProps = left || { ...EMPTY_INSTRUMENT_PROPS, mount: 'left' }
  const rightProps = right || { ...EMPTY_INSTRUMENT_PROPS, mount: 'right' }
  return (
    <section className={styles.pipette_group}>
      {props.left && (
        <InstrumentInfo
          {...leftProps}
          showMountLabel={Object.keys(props).length !== 1}
        />
      )}
      {props.right ? (
        <InstrumentInfo
          {...rightProps}
          showMountLabel={Object.keys(props).length !== 1}
        />
      ) : (
        <SecondaryButton
          onClick={e => {
            e.preventDefault()
          }}
        >
          {i18n.t('flex.file_tab.add_pipette')}
        </SecondaryButton>
      )}
    </section>
  )
}
