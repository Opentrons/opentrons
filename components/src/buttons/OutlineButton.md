You can use an `<OutlineButton>` in exactly the same manner as a `<PrimaryButton>`

```js
<div>
  <div style={{padding: '2rem', width: '20rem'}}>
    <OutlineButton onClick={() => alert('you clicked me')}>
      {'Click for alert'}
    </OutlineButton>
  </div>
</div>
```
```js
<div className='dark_background'>
  <div style={{padding: '2rem', width: '20rem'}}>
    <OutlineButton onClick={() => alert('you clicked me')} inverted>
      {'Click for alert'}
    </OutlineButton>
  </div>
</div>
```

Disabled:

```js
<div>
  <div style={{padding: '2rem', width: '20rem'}}>
    <OutlineButton onClick={() => alert("can't click")} disabled>
      {'Disabled'}
    </OutlineButton>
  </div>
</div>
```
```js
<div className='dark_background'>
  <div style={{padding: '2rem', width: '20rem'}}>
    <OutlineButton onClick={() => alert("can't click")} disabled inverted>
      {'Disabled'}
    </OutlineButton>
  </div>
</div>
```
