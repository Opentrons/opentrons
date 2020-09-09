// @flow
import * as React from 'react'

import { SecondaryBtn, Link } from '@opentrons/components'
import { useTrackEvent } from '../../analytics'
import { TitledControl } from '../TitledControl'

import type { StyleProps } from '@opentrons/components'

// TODO(mc, 2020-09-09): i18n
const OPEN = 'Open'
const JUPYTER_NOTEBOOK = 'Jupyter Notebook'
const OPEN_JUPYTER_DESCRIPTION = (
  <>
    Open the{' '}
    <Link external href="https://jupyter.org/">
      Jupyter Notebook
    </Link>{' '}
    running on this OT-2 in your web browser. (Experimental feature! See{' '}
    <Link
      external
      href="https://docs.opentrons.com/v2/new_advanced_running.html#jupyter-notebook"
    >
      documentation
    </Link>{' '}
    for more details.)
  </>
)

const EVENT_JUPYTER_OPEN = { name: 'jupyterOpen', properties: {} }

export type OpenJupyterControlProps = {|
  robotIp: string,
  ...StyleProps,
|}

export function OpenJupyterControl(props: OpenJupyterControlProps): React.Node {
  const { robotIp, ...styleProps } = props
  const href = `http://${robotIp}:48888`
  const trackEvent = useTrackEvent()

  return (
    <TitledControl
      {...styleProps}
      title={JUPYTER_NOTEBOOK}
      description={OPEN_JUPYTER_DESCRIPTION}
      control={
        <SecondaryBtn
          onClick={() => trackEvent(EVENT_JUPYTER_OPEN)}
          as={Link}
          href={href}
          width="9rem"
          external
        >
          {OPEN}
        </SecondaryBtn>
      }
    />
  )
}
