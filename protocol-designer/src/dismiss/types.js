// @flow
import type {CommandCreatorWarning} from '../step-generation'

export type DismissInfo = {
  ...CommandCreatorWarning,
  stepId: string | number, // warnings are per-step, need stepId added in
  isDismissable: true
}
