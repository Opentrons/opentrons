This component is a wrapper around our `Select` component optimized for usage with `Formik`.
The `onChange` and `onBlur` events of `Select` component are provided by `react-select`; they
are not normal DOM events. To make the difference clear, `SelectField` instead has
`onValueChange` and `onLoseFocus` that are passed the `name` of the field and the `value` of
the selected option.

To use `SelectField` with `Formik`, pass `formikProps.setFieldValue` to `onValueChange` and `formikProps.setFieldTouched` to `onLoseFocus`.

```js
const [state, setState] = React.useState({ selectedValue: null })
;<SelectField
  onValueChange={(name, value) => setState({ selectedValue: value })}
  value={state.selectedValue}
  caption={`Selected value: ${state.selectedValue}`}
  error={state.selectedValue === 'dna' ? 'DNA IS NOT ALLOWED!' : null}
  options={[
    { label: 'DNA', value: 'dna' },
    { label: 'RNA', value: 'rna' },
    {
      label: 'Protein',
      options: [
        { label: 'Hemoglobin', value: 'hemoglobin' },
        { label: 'Actin', value: 'actin' },
      ],
    },
  ]}
  formatOptionLabel={option =>
    option.value === 'dna' ? (
      <div style={{ color: 'red' }}>{option.label}</div>
    ) : (
      option.label
    )
  }
/>
```
