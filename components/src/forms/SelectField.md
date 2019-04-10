This component uses the `react-select` library. So the change/blur events are not
normal DOM events, but special ones. To make the difference clear, `SelectField`
doesn't have `onChange` and `onBlur` but instead `onValueChange` and `onLoseFocus`.

To use `<SelectField>` with Formik, **do not** try to of pass `formikProps.handleChange` and `formikProps.handleBlur` to `onChange` and `onBlur`. Instead, pass `formikProps.setFieldValue` and `formikProps.setFieldTouched` to `onValueChange` and `onLoseFocus`.

```js
initialState = { selectedValue: null }
;<div style={{ paddingBottom: '10rem' }}>
  {/* Add some space because options menu does not behave well when overlapping with styleguidist's code blocks! */}
  <SelectField
    onValueChange={(name, value) => setState({ selectedValue: value })}
    value={state.selectedValue}
    caption={`Selected value: ${state.selectedValue}`}
    error={state.selectedValue === 'dna' ? 'DNA IS NOT ALLOWED!' : null}
    options={[
      { label: <div style={{ color: 'red' }}>DNA</div>, value: 'dna' },
      { label: 'RNA', value: 'rna' },
      {
        label: 'Protein',
        options: [
          { label: 'Hemoglobin', value: 'hemoglobin' },
          { label: 'Actin', value: 'actin' },
        ],
      },
    ]}
  />
</div>
```
