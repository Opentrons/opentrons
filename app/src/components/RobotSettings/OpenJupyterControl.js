// @flow
import * as React from 'react'

import { SecondaryBtn, Link } from '@opentrons/components'
import { useTrackEvent } from '../../analytics'
import { TitledControl } from '../TitledControl'

const OPEN = 'Open'
const JUPYTER_NOTEBOOK = 'Jupyter Notebook'
const OPEN_JUPYTER_DESCRIPTION =
  "Open this OT-2's Jupyter Notebook in your web browser"

const EVENT_JUPYTER_OPEN = { name: 'jupyterOpen', properties: {} }

export type OpenJupyterControlProps = {|
  ip: string,
|}

export function OpenJupyterControl(props: OpenJupyterControlProps): React.Node {
  const href = `http://${props.ip}:48888`
  const trackEvent = useTrackEvent()

  return (
    <TitledControl
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
