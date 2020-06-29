// @flow
import type { Mount } from '@opentrons/components'

import type {
  Session,
  SessionCommandData,
  SessionCommandString,
} from '../../sessions/types'

export type CalibrateTipLengthParentProps = {|
  isMulti: boolean,
  mount: Mount,
  probed: boolean,
  robotName: string | null,
  session: Session,
|}

export type CalibrateTipLengthChildProps = {|
  ...CalibrateTipLengthParentProps,
  sendSessionCommand: (
    command: SessionCommandString,
    data: SessionCommandData
  ) => void,
|}
