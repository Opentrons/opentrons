def verify_settings_value(response, id: str, value: str):
    """ Verify settings are updated as expectted """
    for setting in response.json().get('settings'):
        if setting.get('id') == id:
            assert str(setting.get('value')) == str(value)
            return
    assert False
