import type {
  MutationFunction,
  MutationKey,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { AttachedModule } from '@opentrons/api-client'
import type { RunTimeCommand } from '@opentrons/shared-data'

export type DocumentationReport = string & {
  readonly _brand: 'DocumentationReport'
}

/**
 * Documentation state to be passed to the useDocumentedMutation hook.
 *
 * @param accessControlEnabled - whether access control is enabled
 * @param docreport - the documentation report
 * @param askForDocumentation - a function that opens the documentation modal and returns the documentation report
 */
export type DocumentationState =
  | { accessControlEnabled: false }
  | { accessControlEnabled: true; docreport: DocumentationReport }
  | {
      accessControlEnabled: true
      docreport: null
      askForDocumentation: (
        actionsToDocument: DocumentedAction[]
      ) => Promise<DocumentationReport>
    }

/**
 * Call signatures for useDocumentedMutation — mirrors the `useMutation`
 * shapes actually used in this codebase:
 *   (state, mutationFn, options?)
 *   (state, mutationKey, mutationFn, options?)
 */
export interface UseDocumentedMutation {
  <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    documentationState: DocumentationState,
    actionsToDocument: DocumentedAction[],
    mutationFn: MutationFunction<TData, TVariables>,
    options?: UseMutationOptions<TData, TError, TVariables, TContext>
  ): UseMutationResult<TData, TError, TVariables, TContext>

  <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    documentationState: DocumentationState,
    actionsToDocument: DocumentedAction[],
    mutationKey: MutationKey,
    mutationFn: MutationFunction<TData, TVariables>,
    options?: UseMutationOptions<TData, TError, TVariables, TContext>
  ): UseMutationResult<TData, TError, TVariables, TContext>
}

export type PipetteWizardFlowName = string & {
  readonly _brand: 'PipetteWizardFlow'
}

export type AttachingModule = AttachedModule & {
  readonly _brand: 'Attaching'
}

export type DocumentedAction =
  | 'stop_run'
  | 'play_run'
  | 'place_plate_reader_lid'
  | 'home_pipettes'
  | 'attach_gripper'
  | 'detach_gripper'
  | 'recalibrate_gripper'
  | 'lpc_flow'
  | 'drop_tips'
  | 'end_calibration'
  | 'add_module'
  | 'attach_pipette'
  | RunTimeCommand
  | PipetteWizardFlowName
  | AttachingModule
