# AUTOFILL

"Autofill" is what LC uses to automatically fill in fields when the user has selected certain values for other fields. For example, if you choose an Opentrons Tube Rack with the 6-tube insert, then the dimensions having to do with that insert automatically get filled in. Currently in LC, only a few fields can cause autofill to happen (listed below).

## Autofills and hiding fields

In LC, fields that have been autofilled shouldn't be shown to the user. Also, we don't want to user to edit autofilled fields, because eg if you're selected a tip rack then the "well shape" should always be "circular", and if you choose a particular 6-tube tuberack insert the well grid should always be 3 x 2, and so on. So you can think of autofilled fields as not as "filled in with a default via other fields" but actually "determined by other fields and locked".

### `getIsHidden`

A field is hidden when it's autofilled or defaulted.

- We know it's autofilled if there is some defined value for the field in the corresponding autofill data object (listed out below). For example, if labwareType is tubeRack, we see if there's a value for our field in `tubeRackAutofills[values.tubeRckInsertLoadName`.
- Some fields are defaulted by the Yup schema. These are handled case-by-case in `_getIsDefaulted`. For example, if your labware has one column, `gridSpacingX` gets a default value from the Yup schema and so that field does not need to be displayed. Whereas "autofilled" has more to do with labwareType and secondary type, "defaulted" has to do with other fields besides those having an effect on other fields, in a way that doesn't have anything to do with labwareType.

TODO: do we really need both "autofill" AND "default"? Can they both use the same mechanism instead of having 2 different ways this is accomplished?

When the form is missing info (for example, no labwareType chosen yet, or chose aluminumBlock but no aluminumBlockType, etc), the default is "not hidden" bc we don't have enough info to hide it. (However, Labware Creator only shows most of the form after the user has clicked "Start Creating Labware" which can only happen after a user has chosen labwareType and if applicable a secondary type. So this is kind of a technicality.)

Each field component (eg `RadioField`, `TextField`) calls `getIsHidden` to determine whether to render itself.

Also, `isEveryFieldHidden` runs through all the fields of a `Section`, calling `getIsHidden` on each, to determine if a `Section` should overall be hidden bc all its constituent fields are hidden.

## Data

The data behind the autofills is from several types of objects listed below. These objects map some kind of key to a set of `field:value` pairs that will be spread into the form values to effect the autofill. They generally look like `{[someKindOfKey]: {gridRows: '8', gridColumns: '12'}}`.

- `tubeRackAutofills` is a map of `tubeRackInsertLoadName` to fields
- `aluminumBlockAutofills` maps aluminumBlockType to fields
- `labwareTypeAutofills` maps labwareType to fields, but only has content for `tipRack`

## `makeAutofillOnChange`

This fn is hooked into the `onValueChange` of three Dropdown fields, `labwareType`, `tubeRackInsertLoadName`, and `aluminumBlockType`, so every change to those particular fields triggers this autofill process.

Here, when one of these fields is updated, `setValues` is called to not only update the field itself, but all the fields that have their values autofilled as a result. Also, `setTouched` is called to make those autofilled fields non-pristine.

NOTE: Right now, if you choose a tube rack insert and then switch to a well plate, the autofilled values carry over. Ideally the autofill wouldn't modify `values` state, but rather autofill could one day be more like a lens or selector on top of `values`. It's hard to do this in Formik though bc there's not good ways to get "in between" the steps of the data flow :(
