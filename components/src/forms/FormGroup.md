```js
initialState = {checkbox1: true, inputfield1: null}

;<FormGroup label='This is a FormGroup'>
  <CheckboxField
    label="Check Box 1"
    onChange={e => setState({checkbox1: !state.checkbox1})}
    checked={state.checkbox1}
  />
  <InputField
    placeholder='Placeholder Text'
    onChange={e => setState({inputfield1: e.target.value})}
    value={state.inputfield1}
    units='μL'
  />
</FormGroup>
```
