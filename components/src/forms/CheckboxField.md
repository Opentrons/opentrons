```js
initialState = {isChecked1: true, isChecked2: false}

;<div>
  <CheckboxField
    label="Check Box 1"
    className="display-block"
    onChange={() => setState({...state, isChecked1: !state.isChecked1})}
    checked={state.isChecked1}
  />
  <CheckboxField
    label="Check Box 2"
    className="display-block"
    onChange={() => setState({...state, isChecked2: !state.isChecked2})}
    checked={state.isChecked2}
  />
</div>
```
