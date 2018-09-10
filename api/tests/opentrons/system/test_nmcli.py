import pytest # noqa

from opentrons.system import nmcli


def test_sanitize_args():
    cmd = ['nmcli',
           'connection', 'add', 'wifi.ssid', 'Opentrons',
           'wifi-sec.psk', 'test-password',
           'wifi-sec.key-mgmt', 'wpa2-psk']
    sanitized = nmcli.sanitize_args(cmd)
    # Check preconditions
    assert 'test-password' in cmd
    # Check output
    assert 'test-password' not in sanitized

    cmd2 = ['nmcli',
            'connection', 'modify',
            '+wifi-sec.psk', 'test-password']
    sanitized = nmcli.sanitize_args(cmd2)
    assert 'test-password' in cmd2
    assert 'test-password' not in sanitized


def test_output_transformations():
    fields = ['name', 'type', 'autorun', 'active', 'iface', 'state']
    should_have = [['static-eth0',
                   '802-3-ethernet',
                    'yes', 'yes', 'eth0', 'activated'],
                   ['wifi-wlan0',
                    '802-11-wireless',
                    'yes', 'no', 'wlan0', '--']]
    # This test input is taken from the result of
    # nmcli -t -f name,type,autoconnect,active,device,state connection show
    test_input = '''static-eth0:802-3-ethernet:yes:yes:eth0:activated
wifi-wlan0:802-11-wireless:yes:no:wlan0:--
'''
    # No transforms: correctly parse fields
    split = nmcli._dict_from_terse_tabular(fields, test_input)
    assert len(split) == 2
    for outp in zip(split, should_have):
        # All fields, in order, should be in the output
        assert fields == list(outp[0].keys())
        assert outp[1] == list(outp[0].values())

    # Transforms for some but not all keys
    transforms = {'name': lambda s: s.upper(),
                  'active': lambda s: s == 'yes'}
    split = nmcli._dict_from_terse_tabular(fields, test_input, transforms)
    assert split[0]['name'] == should_have[0][0].upper()
    assert split[1]['name'] == should_have[1][0].upper()
    assert split[0]['active'] is True
    assert split[1]['active'] is False
