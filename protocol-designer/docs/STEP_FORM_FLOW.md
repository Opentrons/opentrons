# PD Step Form Data Flow & Error/Warning Reporting

## `step-generation` vs the rest of Protocol Designer

The `step-generation/` directory is intended to be treated as an independent library of which PD is one consumer. One day, we plan to actually make it independent and serve as a general Javascript library for creating Opentrons JSON protocols.

## Creating a new step form (without clicking "Save")

TODO

- `selectStep` thunk

## Field/form behavior

**Default form values**: `steplist/formLevel/getDefaultsForStepType` is responsible for returning initial default values for forms -- each stepType can have its own set of initial default values. (These values are static. They may be updated for a new form in the `selectStep` thunk, eg a default initial pipette is selected for forms that have a pipette field)

**Disabled fields**: `steplist/formLevel/getDisabledFields` contains logic for determining what fields are disabled, given the set of values in the form

**Conditionally hidden fields**: sometimes fields are hidden or shown depending on the values that other fields are set to. This is handled on the presentational level, using the `ConditionalOnField` component.

**Dependent/Codependent field value updates**: sometimes making a change to one field should update other fields. One complex example: changing the pipette or labware fields may need to reset or clear fields that relate to pipette or labware properties. This logic lives in `steplist/formLevel/handleFormChange`. For each stepType that needs it, there is a `dependentFieldsUpdate{formName}` function. This function, given a set of changed values from a user action (called a "patch"), returns an augmented patch that should capture dependent/codependent behaviors required of the form.

## Form "Hydration"

TODO

## Field/Form Validation

TODO. `steplist/fieldLevel` and `steplist/formLevel`

- `getFieldErrors` and `getFormErrors` in `step-forms/selectors`

### Form data to command creator args

Motivation: form field data is often tied to UI concerns in ways that complicate the data and make it inconvenient to work with. As a simple example, we might have 3 time fields (hours/minutes/seconds) in the form, but we only care about a single value, total time in milliseconds. This cleaned-up derivation of the step form data is called "command creator args", because it will be passed directly to command creators. PD's `...toArgs` functions are responsible for performing this tranformation.

`stepFormToArgs` is the entrypoint to all the inner `{formName}toArgs` functions. At this point all validation has been done; `stepFormToArgs` is never called when there are any field/form errors in the hydrated form. That ensures that we only have to deal with transformation of valid data. The `...ToArgs` fns have no mechanism to report errors & warnings to the user, that is not their responsibility.

1. Field casting: run all fields thru `castField`. This ensures that that `{formName}ToArgs` fns don't have to deal with casting.
2. Call `nameOfFormToArgs` fn, using `stepType` to determine which `{formName}ToArgs` fn corresponds to the form
3. Add `commandCreatorFnName`. This is because `stepType` doesn't always map 1:1 to a command creator function. For example the `"moveLiquid"` stepType can map to 3 different command creators, depending on certain values in the form.
4. Return cleaned up data to be passed directly into command creators

### Timeline vs RobotState vs InvariantContext

Like in a video editing program, the `Timeline` is composed of "frames" of a protocol.

`RobotState` is a single frame. We might rename it "TimelineFrame" or something like that. It includes all state that we care about in `step-generation` for a protocol on the robot at any point in time: liquid volumes and locations, tips, locations of labware, pipettes, and modules, and module-specific state.

`InvariantContext` is stuff that does not vary across the timeline, like what the model of a particular pipette entity is, or what type of module some module entity is. You can move labware/pipette/module locations (once we implement it!) and you can change certain properties, but you can't turn a P10 Single-Channel into a P300 Multi-Channel.

### Command creators

Strictly speaking, `type CommandCreator` is a function that takes `(RobotState, InvariantContext)` and returns either a new updated robot state and commands, or if something went wrong (eg ran out of tips), an error response object.

Motivation: ultimately, `step-generation`'s job is to build a timeline that represents an array of all the commands and all the intermediate robot states in a protocol. To do that, it will eventually use the utility `commandCreatorsTimeline` to generate a timeline given initial state and an array of `CommandCreator`s. In order to reduce that cleanly, the functions need to have the same arguments: `(RobotState, InvariantContext)`

In practice, these functions are never written directly, `CommandCreator` functions are always created by other functions. For a simple example, see `aspirate.js`: `const aspirate = (args: AspirateParams): CommandCreator => (...) => {...}`. We also use the phrase "command creator" to refer to a function that returns a `CommandCreator`. (This wording needs to be refactored because it's very confusing. Sorry!) Additionally, some of these functions return `Array<CommandCreator>`; we call these "compound command creators". Compound command creators can be curried into non-compound command creators by use of `reduceCommandCreators` util. We plan to homogenize these to make it all simpler. Part of the complexity comes from the problem that we want to control the granularity of commands and frames: a single "frame" can encompass one or more atomic commands. For example a Transfer Step in PD should be a single frame in the PD timeline from `getRobotStateTimeline`, but it may contain many pickUpTip/aspirate/dispense/touchTip/dropTip/etc atomic commands. The meaning of that granularity depends on how the consumer (eg PD) wants to use it.

### Args to Commands + RobotState

The `step-forms` selector `getArgsAndErrorsByStepId` is used in several places across PD as the primary view into command creator args and step errors. It returns a group of objects that represent command creator args or field/form errors. Each args/errors object corresponds to a Step Form in a one-to-one ratio.

Now that we have the args and errors for all the Step Forms, we want to derive atomic commands and the robot state timeline (tip/liquid tracking, module state changes, etc). The `getRobotStateTimeline` selector is the main example of this in PD.

- If there are any steps with errors, the timeline is truncated -- it can't reasonably proceed past an error-containing step.
- Lightweight mapping fn `compoundCommandCreatorFromStepArgs` determines which specific command creator function to call for each args object. (Not a lot of logic here, it's just mapping `commandCreatorFnName` to command creator functions. The real work has already been done in `{formName}ToArgs`.)
- Finally, the utility `commandCreatorsTimeline`

### Timeline warnings & errors

Before we talked about form/field-level errors & warnings. These can be purely generated from the form values, without taking Timeline/RobotState concerns into account.

Timeline warnings and errors are for situations when information from the timeline is relevant. For example: the error when running out of tips mid-protocol, or the warning when aspirating from a well that doesn't have enough liquid.

Timeline warnings/errors are generated in command creators. As mentioned above, when any command creator in the chain returns a timeline error, the timeline cannot continue to be built out. Timeline warnings do not have this halting effect.

TODO: out of tips error example.
TODO: over-aspiration warning example.

Side note: in an effort to treat `step-generation` as an independent library, it has its own error/warning messages, and PD UI overwrites these messages with custom text to support things like linking out to support articles or rich-text formatting.

### Substeps

Substeps are the visual elements on the Step List that are displayed when a Step Item in the list is expanded. They represent details of the saved step and are intended to improve a user's at-a-glance view of what's going on in the protocol.

TODO use of CC args, eg via `getArgsAndErrorsById`, by substeps. This ties substeps to command creator args, it's not just command creators.

## Step forms in PD (well before step-generation concerns)

### Form "Hydration"

TODO

### Saving a step form: form to commands

### Editing an existing step

TODO
