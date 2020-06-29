// @flow

// TODO(mc, 2018-08-08): figure out type exports from app
import type { Logger } from '@opentrons/app/src/logger'
import type { Action, Error as PlainError } from '@opentrons/app/src/types'
export type { Action, PlainError }

// Node.js::fs::Dirent missing from flow lib
// https://nodejs.org/dist/latest-v10.x/docs/api/fs.html#fs_class_fs_dirent
export type Dirent = {|
  isBlockDevice: () => boolean,
  isCharacterDevice: () => boolean,
  isDirectory: () => boolean,
  isFIFO: () => boolean,
  isFile: () => boolean,
  isSocket: () => boolean,
  isSymbolicLink: () => boolean,
  name: string,
|}

export type Dispatch = Action => void

export type { Logger }
