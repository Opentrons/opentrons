// @flow
import { uuid } from '../../utils'
import type { ModuleType } from '@opentrons/shared-data'
import type { DeckSlot } from '../../types'

type CreateModuleAction = {|
  type: 'CREATE_MODULE',
  payload: {|
    slot: DeckSlot,
    type: ModuleType,
    model: string, // eg 'GEN1',
    id: string,
  |},
|}
export const createModule = (
  args: $Diff<$PropertyType<CreateModuleAction, 'payload'>, { id: any }>
): CreateModuleAction => ({
  type: 'CREATE_MODULE',
  payload: { ...args, id: `${uuid()}:${args.type}` },
})

type EditModuleAction = {|
  type: 'EDIT_MODULE',
  payload: {| id: string, model: string |},
|}
export const editModule = (
  args: $PropertyType<EditModuleAction, 'payload'>
): EditModuleAction => ({
  type: 'EDIT_MODULE',
  payload: args,
})

type DeleteModuleAction = {|
  type: 'DELETE_MODULE',
  payload: {| id: string |},
|}
export const deleteModule = (id: string): DeleteModuleAction => ({
  type: 'DELETE_MODULE',
  payload: { id },
})
