// @flow
import type {CommandCreatorWarning} from './types'

export function aspirateMoreThanWellContents (): CommandCreatorWarning {
  return {
    type: 'ASPIRATE_MORE_THAN_WELL_CONTENTS',
    message: 'Not enough liquid in well(s)'
  }
}
