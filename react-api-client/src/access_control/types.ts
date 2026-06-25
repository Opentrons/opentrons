import type {
  MutationKey,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { AttachedModule } from '@opentrons/api-client'
import type { PipetteMount, RunTimeCommand } from '@opentrons/shared-data'

export type DocumentationReport = string & {
  readonly _brand: 'DocumentationReport'
}

export type DocumentedMutationErrorType =
  | 'no_documentation_report'
  | 'access_control_loading'
  | 'login_cancelled'

const DOCUMENTED_MUTATION_ERROR_MESSAGES: Record<
  DocumentedMutationErrorType,
  string
> = {
  no_documentation_report: 'No documentation report provided',
  access_control_loading: 'Access control queries are still loading',
  login_cancelled: 'Login cancelled by user',
}

export class DocumentedMutationError extends Error {
  declare readonly name: 'DocumentedMutationError'
  declare readonly type: DocumentedMutationErrorType

  constructor(type: DocumentedMutationErrorType) {
    super(DOCUMENTED_MUTATION_ERROR_MESSAGES[type])
    this.name = 'DocumentedMutationError'
    this.type = type
  }
}

export function isDocumentedMutationError(
  error: unknown
): error is DocumentedMutationError {
  return error instanceof DocumentedMutationError
}

/**
 * Documentation state to be passed to the useDocumentedMutation hook.
 *
 * @param accessControlEnabled - whether access control is enabled
 * @param docreport - the documentation report
 * @param askForDocumentation - a function that opens the documentation modal and returns the documentation report
 */
export type DocumentationState =
  | { isLoading: true }
  | {
      isLoading: false
      accessControlEnabled: false
    }
  | ({
      isLoading: false
    } & MutationAuthenticationState &
      MutationDocumentationState)

export interface MutationAuthenticationState {
  accessControlEnabled: true
  loginExpired: boolean
  askForLogin: () => Promise<{ username: string } | null>
}

export type MutationDocumentationState =
  | {
      reasonForInteractionRequired: false
    }
  | {
      reasonForInteractionRequired: true
      docreport: DocumentationReport | null
      askForDocumentation: (
        actionsToDocument: DocumentedAction[],
        onCancel?: () => void,
        initialDocreport?: DocumentationReport,
        username?: string
      ) => Promise<DocumentationReport>
    }

export interface DocumentedMutationParameters<TVariables = void> {
  userNotes: string
  variables: TVariables
}

export type DocumentedMutationFunction<TData = unknown, TVariables = void> = (
  parameters: DocumentedMutationParameters<TVariables>
) => Promise<TData>

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
    mutationFn: DocumentedMutationFunction<TData, TVariables>,
    options?: UseMutationOptions<TData, TError, TVariables, TContext>
  ): UseMutationResult<TData, TError, TVariables, TContext>

  <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    documentationState: DocumentationState,
    actionsToDocument: DocumentedAction[],
    mutationKey: MutationKey,
    mutationFn: DocumentedMutationFunction<TData, TVariables>,
    options?: UseMutationOptions<TData, TError, TVariables, TContext>
  ): UseMutationResult<TData, TError, TVariables, TContext>
}
export interface PipetteWizardFlowAction {
  type: 'pipette_wizard_flow'
  mount: PipetteMount
  pipette: '96-Channel' | 'Single-Channel_and_8-Channel'
  flowType: string
  pipetteInfo: PipetteInformation | null
  step: 'start' | 'end'
}

interface PipetteInformation {
  displayName: string
}

export interface AttachingModuleAction {
  module: AttachedModule
  type: 'attach_module'
  step: 'start' | 'end'
}

type AuditLogAction =
  | 'stop_run'
  | 'play_run'
  | 'place_plate_reader_lid'
  | 'end_plate_reader_lid'
  | 'home_pipettes'
  | 'end_home_pipettes'
  | 'attach_gripper'
  | 'detach_gripper'
  | 'recalibrate_gripper'
  | 'lpc_flow'
  | 'drop_tips'
  | 'end_calibration'
  | 'add_module'
  | 'end_module_setup'
  | 'end_lpc_flow'
  | 'finish_attach_gripper'
  | 'finish_detach_gripper'
  | 'finish_recalibrate_gripper'
  | 'end_drop_tips'
  | 'attach_pipette_left'
  | 'attach_pipette_right'

export type DocumentedAction =
  | AuditLogAction
  | RunTimeCommand
  | PipetteWizardFlowAction
  | AttachingModuleAction
