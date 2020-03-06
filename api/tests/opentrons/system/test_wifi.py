import os
import tempfile
import random

import pytest
from opentrons.system import wifi


def test_check_eap_config(wifi_keys_tempdir):
    wifi_key_id = '88188cafcf'
    os.mkdir(os.path.join(wifi_keys_tempdir, wifi_key_id))
    with open(os.path.join(wifi_keys_tempdir,
                           wifi_key_id,
                           'test.pem'), 'w') as f:
        f.write('what a terrible key')
    # Bad eap types should fail
    with pytest.raises(wifi.ConfigureArgsError):
        wifi.eap_check_config({'eapType': 'afaosdasd'})
    # Valid (if short) arguments should work
    wifi.eap_check_config({'eapType': 'peap/eap-mschapv2',
                           'identity': 'test@hi.com',
                           'password': 'passwd'})
    # Extra args should fail
    with pytest.raises(wifi.ConfigureArgsError):
        wifi.eap_check_config({'eapType': 'tls',
                               'identity': 'test@example.com',
                               'privateKey': wifi_key_id,
                               'clientCert': wifi_key_id,
                               'phase2CaCertf': 'foo'})
    # Filenames should be rewritten
    rewritten = wifi.eap_check_config({'eapType': 'ttls/eap-md5',
                                       'identity': 'hello@example.com',
                                       'password': 'hi',
                                       'caCert': wifi_key_id})
    assert rewritten['caCert'] == os.path.join(wifi_keys_tempdir,
                                               wifi_key_id,
                                               'test.pem')
    # A config should be returned with the same keys
    config = {'eapType': 'ttls/eap-tls',
              'identity': "test@hello.com",
              'phase2ClientCert': wifi_key_id,
              'phase2PrivateKey': wifi_key_id}
    out = wifi.eap_check_config(config)
    for key in config.keys():
        assert key in out


def test_eap_check_option():
    # Required arguments that are not specified should raise
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_option_ok({'name': 'test-opt', 'required': True,
                                   'displayName': 'Test Option'},
                                  {'eapType': 'test'})
    # Non-required arguments that are not specified should not raise
    wifi._eap_check_option_ok({'name': 'test-1',
                               'required': False,
                               'type': 'string',
                               'displayName': 'Test Option'},
                              {'eapType': 'test'})

    # Check type mismatch detection pos and neg
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_option_ok({'name': 'identity',
                                   'displayName': 'Username',
                                   'required': True,
                                   'type': 'string'},
                                  {'identity': 2,
                                   'eapType': 'test'})
    wifi._eap_check_option_ok({'name': 'identity',
                               'required': True,
                               'displayName': 'Username',
                               'type': 'string'},
                              {'identity': 'hi',
                               'eapType': 'test'})
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_option_ok({'name': 'password',
                                   'required': True,
                                   'displayName': 'Password',
                                   'type': 'password'},
                                  {'password': [2, 3],
                                   'eapType': 'test'})
    wifi._eap_check_option_ok({'name': 'password',
                               'required': True,
                               'displayName': 'password',
                               'type': 'password'},
                              {'password': 'secret',
                               'eapType': 'test'})
    with pytest.raises(wifi.ConfigureArgsError):
        wifi._eap_check_option_ok({'name': 'phase2CaCert',
                                   'displayName': 'some file who cares',
                                   'required': True,
                                   'type': 'file'},
                                  {'phase2CaCert': 2,
                                   'eapType': 'test'})
    wifi._eap_check_option_ok({'name': 'phase2CaCert',
                               'required': True,
                               'displayName': 'hello',
                               'type': 'file'},
                              {'phase2CaCert': '82141cceaf',
                               'eapType': 'test'})


async def test_list_keys(loop, wifi_keys_tempdir):
    dummy_names = ['ad12d1df199bc912', 'cbdda8124128cf', '812410990c5412']
    for dn in dummy_names:
        os.mkdir(os.path.join(wifi_keys_tempdir, dn))
        open(os.path.join(wifi_keys_tempdir, dn, 'test.pem'), 'w').write('hi')

    keys = list(wifi.list_keys())
    assert len(keys) == 3
    for dn in dummy_names:
        for keyfile in keys:
            if keyfile.directory == dn:
                assert keyfile.file == 'test.pem'
                break
        else:
            raise KeyError(dn)


async def test_key_lifecycle(loop, wifi_keys_tempdir):
    with tempfile.TemporaryDirectory() as source_td:
        keys = list(wifi.list_keys())
        assert keys == []

        results = {}
        # We should be able to add multiple keys
        for fn in ['test1.pem', 'test2.pem', 'test3.pem']:
            path = os.path.join(source_td, fn)
            with open(path, 'w') as f:
                f.write(str(random.getrandbits(2048)))

            with open(path, 'rb') as f:
                add_response = wifi.add_key(fn, f.read())
                assert add_response.created is True
                assert add_response.key.file == fn
                results[fn] = add_response

        # We should not be able to upload a duplicate
        with open(os.path.join(source_td, 'test1.pem'), 'rb') as f:
            add_response = wifi.add_key('test1.pem', f.read())
            assert add_response.created is False

        # We should be able to see them all
        list_resp = list(wifi.list_keys())
        assert len(list_resp) == 3
        for elem in list_resp:
            assert elem.directory in {r.key.directory
                                      for r in results.values()}

        for fn, data in results.items():
            del_resp = wifi.remove_key(data.key.directory)
            assert del_resp == fn

            del_list_resp = list(wifi.list_keys())
            assert data.key.directory not in {k.directory
                                              for k in del_list_resp}

        dup_del_resp = wifi.remove_key(results['test1.pem'].key.directory)
        assert dup_del_resp is None
