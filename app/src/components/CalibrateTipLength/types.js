// @flow
import type { Mount } from '@opentrons/components'
import type {
  SessionCommandString,
  SessionCommandData,
  Session,
} from '../../sessions/types'

export type CalibrateTipLengthParentProps = {|
  isMulti: boolean,
  mount: Mount,
  probed: boolean,
  robotName: string | null,
  haveBlock: boolean | null,
  session: Session,
|}

export type CalibrateTipLengthChildProps = {|
  ...CalibrateTipLengthParentProps,
  sendSessionCommand: (
    command: SessionCommandString,
    data: SessionCommandData
  ) => void,
|}
