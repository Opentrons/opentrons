import pytest
from robot_server.service.legacy.models import networking


def test_validate_configuration_deduce_security_psk():
    n = networking.WifiConfiguration(ssid="a", psk="abc")
    expected = networking.NetworkingSecurityType.wpa_psk
    assert n.securityType == expected


def test_validate_configuration_deduce_security_eap():
    n = networking.WifiConfiguration(
        ssid="a",
        eapConfig={
            'eapType': 'peap/eap-mschapv2',
            'identity': 'test@hi.com',
            'password': 'passwd'
        }
    )
    expected = networking.NetworkingSecurityType.wpa_eap
    assert n.securityType == expected


def test_validate_configuration_deduce_security_invalid():
    """Test that we can't deduce security when both psk and eapConfig are
    present"""
    with pytest.raises(ValueError):
        networking.WifiConfiguration(
            ssid="a",
            psk="ee",
            eapConfig={
                'eapType': 'peap/eap-mschapv2',
                'identity': 'test@hi.com',
                'password': 'passwd'
            }
        )


def test_validate_configuration_deduce_security_none():
    n = networking.WifiConfiguration(
        ssid="a"
    )
    expected = networking.NetworkingSecurityType.none
    assert n.securityType == expected


def test_validate_configuration_psk_invalid():
    with pytest.raises(ValueError):
        networking.WifiConfiguration(
            ssid="a",
            securityType="wpa-psk",
            eapConfig={
                'eapType': 'peap/eap-mschapv2',
                'identity': 'test@hi.com',
                'password': 'passwd'
            }
        )


def test_validate_configuration_eap_invalid():
    with pytest.raises(ValueError):
        networking.WifiConfiguration(
            ssid="a",
            securityType="wpa-eap",
            psk="hohos"
        )


def test_eap_config_validate_missing_eap_type():
    with pytest.raises(ValueError, match="eapType must be defined"):
        networking.WifiConfiguration(ssid="a", eapConfig={})


def test_eap_config_validate_invalid_eap_config():
    with pytest.raises(ValueError, match="Required .+ not present"):
        networking.WifiConfiguration(
            ssid="a",
            eapConfig={
                'eapType': 'peap/eap-mschapv2'
            }
        )
