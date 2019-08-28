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
      {
        options: [
          {
            data: {
              channels: 1,
              displayName: 'P90 Single-Channel',
              displayCategory: 'GEN2',
            },
          },
          {
            data: {
              channels: 1,
              displayName: 'P40 Single-Channel',
              displayCategory: 'GEN2',
            },
          },
        ],
      },
      {
        options: [
          {
            data: {
              channels: 1,
              displayName: 'P30 Single-Channel',
              displayCategory: 'OG',
            },
          },
          {
            data: {
              channels: 8,
              displayName: 'P30 8-Channel',
              displayCategory: 'OG',
            },
          },
          {
            data: {
              channels: 1,
              displayName: 'P70 Single-Channel',
              displayCategory: 'OG',
            },
          },
          {
            data: {
              channels: 8,
              displayName: 'P70 8-Channel',
              displayCategory: 'OG',
            },
          },
          {
            data: {
              channels: 1,
              displayName: 'P150 Single-Channel',
              displayCategory: 'OG',
            },
          },
          {
            data: {
              channels: 8,
              displayName: 'P150 8-Channel',
              displayCategory: 'OG',
            },
          },
          {
            data: {
              channels: 1,
              displayName: 'P900 Single-Channel',
              displayCategory: 'OG',
            },
          },
        ],
      },
    ]}
  />
</div>
```
