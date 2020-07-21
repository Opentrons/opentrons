# `step-generation/`

## `step-generation` vs the rest of Protocol Designer

The `step-generation/` directory is intended to be treated as an independent library, of which PD is just one consumer. One day, we may actually make it independent and serve as a general Javascript library for creating Opentrons JSON protocols. In the meantime, conceptually splitting it out from the rest of PD is useful for separation of concerns.

### Timeline vs RobotState vs InvariantContext

Like in a video editing program, the `Timeline` is composed of "frames" of a protocol.

`RobotState` is a single frame. We might rename it "TimelineFrame". This includes all time-variant state that we care about in `step-generation` for a protocol on the robot at any point in time: liquid volumes, tip state, locations of liquids/labware/pipettes/modules, and module-specific state.

`InvariantContext` is stuff that does not vary across the timeline, like what the model of a particular pipette entity is, or what type of module some module entity is. You can move labware/pipette/module locations (not yet fully implemented!) and you can change certain properties, but you can't turn a P10 Single-Channel into a P300 Multi-Channel.

### Command creators

Strictly speaking, `type CommandCreator` is a function that takes `(RobotState, InvariantContext)` and returns either a new updated robot state and commands, or if something went wrong (eg ran out of tips), an error response object.

Motivation: ultimately, `step-generation`'s main job is to build a timeline that represents an array of all the commands and all the intermediate robot states in a protocol. To do that, it will eventually use the utility `commandCreatorsTimeline` to generate a timeline given initial state and an array of `CommandCreator`s. In order to reduce that cleanly, the functions need to have the same arguments: `(RobotState, InvariantContext)`

In practice, these functions are never written directly, `CommandCreator` functions are always created by other functions. For a simple example, see `aspirate.js`: `const aspirate = (args: AspirateParams): CommandCreator => (...) => {...}`. We also use the phrase "command creator" to refer to a function that returns a `CommandCreator`. (This wording needs to be refactored because it's very confusing. Sorry!)

Additionally, some of these functions return `Array<CommandCreator>`; we call these "compound command creators". Compound command creators can be curried into non-compound command creators by use of `reduceCommandCreators` util. We plan to homogenize these to make it all simpler. Part of the complexity comes from the requirement that we want to control the granularity of commands and frames: a single "frame" can encompass one or more atomic commands. For example a Transfer Step in PD should be a single frame in the PD timeline from `getRobotStateTimeline`, but it may contain many pickUpTip/aspirate/dispense/touchTip/dropTip/etc atomic commands. The meaning of that granularity depends on how the consumer (eg PD) wants to use it. It's not useful to have hundreds of frames representing every intermediate robot state throughout a protocol, we only want to remember the intermediate states associated with key points in time (eg, a Step).

### Creating a timeline

Given an initial robot state and an invariant context, the `commandCreatorsTimeline` utility builds a timeline from an array of command creators by moving down the command creators chain, passing the result of one into the next.

If there are any steps with errors, the timeline is truncated -- it can't reasonably proceed past an error-containing step.

The lightweight mapping function `compoundCommandCreatorFromStepArgs` determines which specific command creator function to call for each args object. (Not a lot of logic here, it's just mapping `args.commandCreatorFnName` to command creator functions. When this is being used for PD Step Forms, the real work has already been done in `{formName}ToArgs`.)

### Timeline warnings & errors

Before we talked about form/field-level errors & warnings. These can be purely generated from the form values, without taking Timeline/RobotState concerns into account.

Timeline warnings and errors are for situations when information from the timeline is relevant. For example: the error when running out of tips mid-protocol, or the warning when aspirating from a well that doesn't have enough liquid.

Timeline warnings/errors are generated in command creators. As mentioned above, when any command creator in the chain returns a timeline error, the timeline cannot continue to be built out. Timeline warnings do not have this halting effect.

Side note: in an effort to treat `step-generation/` as an independent library, it has its own error/warning messages, and PD UI overwrites these messages with custom text to support things like linking out to support articles or rich-text formatting.

### Offloaded computation of timeline + substeps

Generating the timeline, and generating the substeps (which are derived from a `Timeline`), can require significant computation. This can bog down the render thread, so this work is offloaded to a webworker.

- `timelineMiddleware/` is hooked into Redux. Like the old `getRobotStateTimeline` selector (via reselect), it memoizes the arguments that the worker will use to call `generateRobotStateTimeline` and `generateSubsteps`. When and only when any of those arguments have changed, it must recompute the timeline/substeps.
- Timeline middleware has a simple web worker that just calls `generateRobotStateTimeline` and/or `generateSubsteps` with the data that was passed to it, and returns the message as a result
- Timeline middleware triggers a timeline recomputation by posting to its worker. To make the loading spinner UI appear, it also dispatches `COMPUTE_ROBOT_STATE_TIMELINE_REQUEST` action (no payload)
- When the worker is complete, timeline middleware relays its message by dispatching a `COMPUTE_ROBOT_STATE_TIMELINE_SUCCESS` action (payload contains timeline and substeps)
- The `getRobotStateTimeline` selector, formerly responsible for doing that computation itself, now is dumb and just reads from a reducer which is also dumb, that reducer at `state.fileData.computedRobotStateTimeline` simply stores the last computed timeline (payload of `COMPUTE_ROBOT_STATE_TIMELINE_SUCCESS`)

# PD Step Form Data Flow & Error/Warning Reporting

The rest of this doc will describe the PD-specific side of things: how Step Forms work and the data transformations they undergo on their way to `step-generation/` utilities.

## Step Form/Field behavior overview

**Default form values**: `steplist/formLevel/getDefaultsForStepType` is responsible for returning initial default values for forms -- each stepType can have its own set of initial default values. (These values are static. They may be updated for a new form in the `selectStep` thunk, eg a default initial pipette is selected for forms that have a pipette field)

**Disabled fields**: `steplist/formLevel/getDisabledFields` contains logic for determining what fields are disabled, given the set of values in the form

**Conditionally hidden fields**: sometimes fields are hidden or shown depending on the values that other fields are set to. This is handled on the presentational level, using the `ConditionalOnField` component.

**Dependent/Codependent field value updates**: sometimes making a change to one field should update other fields. One complex example: changing the pipette or labware fields may need to reset or clear fields that relate to pipette or labware properties. This logic lives in `steplist/formLevel/handleFormChange`. For each stepType that needs it, there is a `dependentFieldsUpdate{formName}` function. This function, given a set of changed values from a user action (called a "patch"), returns an augmented patch that should capture dependent/codependent behaviors required of the form.

**Casting values**: `steplist/fieldLevel` allows you to specify `castValue` functions for each field. These simply take the "raw" form field value and return a cast value. (Only the `{formName}ToArgs` functions receive cast values. All functions dealing with form and field level get "raw" values that have not been cast.)

**Masking values**: Masking is a behavior where a field rejects updates when they fail to meet a certain condition -- for example, a field only intended for integers will reject changes to add a decimal point. Maskers are used in the presentational layer (specifically, in the `FieldConnector` component) where they should be applied to all updates.

**Field-level errors**: `steplist/fieldLevel` allows you to specify a `getErrors` function for each field. A field can have multiple "error checker" functions that can be composed together; the final result is an array of strings where each represents an error in the field. (NOTE: if there are multiple field-level errors, `FieldConnector` will just join them with `', '`.)

**Form-level errors & warnings**: When an error is related to the value of more than one field, it should be specified in `steplist/formLevel` under `getErrors` for that form's `stepType`. Also, there's no such thing as field-level warnings in PD; if need a warning in a form, go to `formLevel` and specify a `getWarnings` function. Form-level errors have a `dependentFields` array associated with them, which is used to ensure that all fields have been touched (are not pristine) before showing the error.

## Effects of field/form errors

- **Blocking Form Save:** Forms with field-level or form-level errors cannot be saved. The "Save" button will be disabled.

- **Timeline truncation:** If a saved step form has field/form errors, it will not be passed to `{formName}ToArgs` and when the timeline is built it will stop before the error-containing step form.

Unlike errors, **warnings** don't have behavioral side-effects; they are purely presentational. They can optionally be dismissed by the user.

## Form "Hydration"

Motivation: Entities like pipettes, labware, and modules are specified by ID in forms, and when we're dealing with the form as data, those IDs alone don't tell us anything. It's helpful to denormalize the form data by replacing things like `pipette: "some pipette ID here"` with `pipette: PipetteEntity`.

In `steplist/formLevel` the `hydrate` key allows you to hook up a function that hydrates a field.

### Form data to command creator args

Motivation: form field data is often tied to UI concerns in ways that complicate the data and make it inconvenient to work with. As a simple example, we might have 3 time fields (hours/minutes/seconds) in the form, but we only care about a single value, total time in milliseconds. This cleaned-up derivation of the step form data is called "command creator args", because it will be passed directly to command creators. PD's `...toArgs` functions are responsible for performing this tranformation.

`stepFormToArgs` is the entrypoint to all the inner `{formName}toArgs` functions. At this point all validation has been done; `stepFormToArgs` is never called when there are any field/form errors in the hydrated form. That ensures that we only have to deal with transformation of valid data. The `...ToArgs` fns have no mechanism to report errors & warnings to the user, that is not their responsibility.

1. Field casting: run all fields thru `castField`. This ensures that that `{formName}ToArgs` fns don't have to deal with casting.
2. Call `nameOfFormToArgs` fn, using `stepType` to determine which `{formName}ToArgs` fn corresponds to the form
3. Add `commandCreatorFnName`. This is because `stepType` doesn't always map 1:1 to a command creator function. For example the `"moveLiquid"` stepType can map to 3 different command creators, depending on certain values in the form.
4. Return cleaned up data to be passed directly into command creators

### Args to Commands + RobotState

The `step-forms` selector `getArgsAndErrorsByStepId` is used in several places across PD as the primary view into command creator args and step errors. It returns a group of objects that represent command creator args or field/form errors. Each args/errors object corresponds to a Step Form in a one-to-one ratio.

Now that we have the args and errors for all the Step Forms, we want to derive atomic commands and the robot state timeline (tip/liquid tracking, module state changes, etc). The `getRobotStateTimeline` selector is the main example of this in PD. It does a few things but at its core, it uses the `commandCreatorsTimeline` utility from `step-generation/` to create a timeline from the arguments.

### Substeps

Substeps are the visual elements on the Step List that are displayed when a Step Item in the list is expanded. They represent details of the saved step and are intended to improve a user's at-a-glance view of what's going on in the protocol.

Substeps use command creator args, eg via `getArgsAndErrorsById`. This ties substeps to command creator args, it's not just command creators.

# Hooking up step field components with `FieldConnector`

Form state of a step form that is being edited lives in Redux at `stepForms.unsavedForm` and all changes require dispatching a `CHANGE_FORM_INPUT` action. It may or may not make sense to keep unsaved form state in Redux, depending on PD's evolving requirements. So the best we can do is to preserve optionality by separating concerns. When we're dealing with the form field components, any form updates should be hooked up into some general function `updateValue`, and any form values should be provided without being tied to implementation details of where that value is from.

We also want to avoid boilerplate. Most field components in step forms need the same things:

- a `value`
- an `updateValue` function
- current errors to display, and functionality about field pristinity & focus state
- tooltip on mouse hover
- disabled/enabled status

We use the `FieldConnector` component in PD to pass in these props to step form field components. Given the `name` of the field, it contains all the machinery to pick out the correct props, and in general to interface the presentational field component(s) with all the relevant business logic that it should be associated with.

## Field Error Display & Pristine/Dirty State

On a new step form, we only want to show field errors for fields that have already been touched. Otherwise, upon creating a new form, a user would be confronted with "This field is required!" and similar errors on all required fields.

Also on the currently focused field, we don't want to show errors. Otherwise as a user types a series of characters into a field, transient errors may come and go in a way that would be confusing and distracting.

Step forms have the concept of "pristine" vs "dirty" state for fields. A field starts pristine and when it is blurred it is made "dirty". This state is held in `StepEditForm` React component state. A prop called `focusHandlers` is spread into individual field components to hook them up to this `StepEditForm` state.

Initially, a newly-created Step Form will have all of its fields marked as pristine, unless they don't match the default values for that step form type (which can happen for auto-populated fields) in which case they are marked as dirty. When an existing Step Form is opened (user is editing an existing step), then all the fields are marked as dirty immediately.

`FieldConnector` instances receive `focusHandlers` that are passed down into them from `StepEditForm`. `FieldConnector` uses those props to mask field-level errors based on pristinity. `FieldConnector` will pass down the prop `errorToShow` to its child, where any errors related to fields that are still pristine are excluded.

## Form Error/Warning Display

`FormAlerts` is used in `StepEditForm` to show form-level errors and warnings. It uses the same pristine/dirty state held by `StepEditForm`.

# Step form manipulation in Protocol Designer

(TODO: IL 2019-11-15) write this section after `legacySteps` reducer and the "saved but pristine" form concept is removed.

- Creating a new step form (without clicking "Save")
- `selectStep` thunk
- Opening an existing step form
- Saving a step form
