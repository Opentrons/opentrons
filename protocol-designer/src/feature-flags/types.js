// @flow

// When flag types are removed from this list, the browser will hold on to that value indefinitely.
// To avoid being surprised when/if we deprecate and then re-introduce a flag with the same type string,
// let's keep this list here.
// Deprecated types should never be reused (unless there's a really good reason).
//
// LIST OF DEPRECATED FLAG TYPES:
// - (none yet)
export type FlagTypes = 'OT_PD_SHOW_UPLOAD_CUSTOM_LABWARE_BUTTON' // NOTE: any additional flag types should be added here with | (Union)

export type Flags = {
  [FlagTypes]: ?boolean,
}
