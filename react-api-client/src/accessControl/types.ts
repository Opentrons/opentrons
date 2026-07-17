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

/**
 * Documentation state to be passed to the useDocumentedMutation hook.
 *
 * @param isLoading - whether the access control queries are still loading
 * @param accessControlEnabled - whether access control is enabled
 * @param loginExpired - whether the login has expired
 * @param askForLogin - a function that opens the login modal and returns the username
 * @param reasonForInteractionRequired - whether user documentation is required
 * @param docreport - the documentation report, a branded string
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

/**
 * State of user login and authentication. Necessary to pop up login modal when user is idle logged out.
 */
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

/**
 * Signature to enable passing along documentation state with mutations.
 * All mutation functions should have this signature.
 */
export type DocumentedMutationFunction<TData = unknown, TVariables = void> = (
  parameters: DocumentedMutationParameters<TVariables>
) => Promise<TData>

/**
 * Call signatures for useDocumentedMutation
 * these mirror the `useMutation` shapes used in this codebase:
 *   (state, mutationFn, options?)
 *   (state, mutationKey, mutationFn, options?)
 */
export interface UseDocumentedMutation {
  <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    documentationState: DocumentationState,
    actionsToDocument:
      DocumentedAction[] | ((variables: TVariables) => DocumentedAction[]),
    mutationFn: DocumentedMutationFunction<TData, TVariables>,
    options?: UseMutationOptions<TData, TError, TVariables, TContext>
  ): UseMutationResult<TData, TError, TVariables, TContext>

  <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    documentationState: DocumentationState,
    actionsToDocument:
      DocumentedAction[] | ((variables: TVariables) => DocumentedAction[]),
    mutationKey: MutationKey,
    mutationFn: DocumentedMutationFunction<TData, TVariables>,
    options?: UseMutationOptions<TData, TError, TVariables, TContext>
  ): UseMutationResult<TData, TError, TVariables, TContext>
}

/**
 * DocumentedActions for pipette wizard flows.
 */
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

/**
 * DocumentedActions for one-off mutations without more needed context.
 * These should match keys in audit_log.json
 */
type AuditLogAction =
  | 'stop_run'
  | 'play_run'
  | 'place_plate_reader_lid'
  | 'end_plate_reader_lid'
  | 'home_pipettes'
  | 'home_robot'
  | 'end_home_pipettes'
  | 'home_gantry'
  | 'end_home_gantry'
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
  | 'create_protocol'
  | 'launching_error_recovery'
  | 'resume_run_from_recovery'
  | 'dismiss_run'
  | 'retry_action'
  | 'shutdown_robot'
  | 'update_robot_name'
  | 'capture_preview_image'
  | 'create_camera_image_settings'
  | 'update_camera'
  | 'update_camera_settings_for_run'
  | 'pause_run'
  | 'delete_run'
  | 'delete_run_images'
  | 'delete_runs'
  | 'update_deck_configuration'

/**
 * Type used for DocumentedActions - keys and info to enable correct rendering of actions in the 'list actions' popup in the Documentation Required Modal.
 */
export type DocumentedAction =
  | AuditLogAction
  | RunTimeCommand
  | PipetteWizardFlowAction
  | AttachingModuleAction

/**
 * Error specification for errors thrown by useDocumentedMutation.
 * no_documentation_report: user closed out of the documentation modal
 * access_control_loading: access control queries are still loading
 * login_cancelled: user closed out of the login modal
 */
export type DocumentedMutationErrorType =
  'no_documentation_report' | 'access_control_loading' | 'login_cancelled'

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
