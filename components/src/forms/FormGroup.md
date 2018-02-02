```js
initialState = {checkbox1: true, inputfield1: ''}

function isError(state) {
  return ((state.inputfield1 === '') || (parseFloat(state.inputfield1) > 0))
    ? undefined
    : 'volume must be a positive number'
}

;<FormGroup label='This is a FormGroup' error={isError(state)}>
  <CheckboxField
    label="Check Box 1"
    onChange={() => setState({...state, checkbox1: !state.checkbox1})}
    value={state.checkbox1}
  />
  <InputField
    placeholder='Placeholder Text'
    onChange={e => setState({...state, inputfield1: e.target.value})}
    value={state.inputfield1}
    units='μL'
    error={isError(state)}
  />
</FormGroup>
```
