// @flow
import type {PipetteData} from '../step-generation'
// TODO: Ian 2018-06-22 move PipetteData type into pipettes dir

export type PipetteState = {|
  left: ?PipetteData,
  right: ?PipetteData
|}

export type RootState = {
  pipettes: PipetteState
}
