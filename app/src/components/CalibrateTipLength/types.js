// @flow
import type { Pipette } from '../../robot'
import type {
  SessionCommandString,
  SessionCommandData,
} from '../../sessions/types'

export type CalibrateTipLengthParentProps = {|
  ...Pipette,
  robotName: string | null,
|}

export type CalibrateTipLengthChildProps = {|
  ...CalibrateTipLengthParentProps,
  sendSessionCommand: (
    command: SessionCommandString,
    data: SessionCommandData
  ) => void,
|}
