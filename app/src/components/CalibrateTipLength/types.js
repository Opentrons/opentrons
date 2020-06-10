// @flow
import type { Pipette } from '../../robot'
import type {
  SessionCommandString,
  SessionCommandData,
  Session,
} from '../../sessions/types'

export type CalibrateTipLengthParentProps = {|
  ...Pipette,
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
