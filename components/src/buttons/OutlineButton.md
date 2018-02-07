You can use an `<OutlineButton>` in exactly the same manner as a `<PrimaryButton>`

```js
<div style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
  <div style={{padding: '2rem', width: '20rem'}}>
    <OutlineButton onClick={() => alert('you clicked me')}>
      {'Click for alert'}
    </OutlineButton>
  </div>
</div>
```

Disabled:

```js
<div style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
  <div style={{padding: '2rem', width: '20rem'}}>
    <OutlineButton onClick={() => alert("can't click")} disabled>
      {'Disabled'}
    </OutlineButton>
  </div>
</div>
```
