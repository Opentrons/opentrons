```js
initialState = {isChecked: true}

;<div>
  <CheckboxField
    label="Check Box"
    className="display-block"
    onChange={() => setState({isChecked: !state.isChecked})}
    checked={state.isChecked}
  />
</div>
```
