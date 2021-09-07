from opentrons.hardware_control.types import Axis


def test_engage_axes(api_client, hardware):
    hardware.engaged_axes = {
        "x": True,
        "y": True,
        "z": True,
        "a": True,
        "b": True,
        "c": True,
    }

    res0 = api_client.get("/motors/engaged")
    result0 = res0.json()
    assert res0.status_code == 200
    assert result0 == {
        "x": {"enabled": True},
        "y": {"enabled": True},
        "z": {"enabled": True},
        "a": {"enabled": True},
        "b": {"enabled": True},
        "c": {"enabled": True},
    }


def test_engage_invalid_axes(api_client, hardware):
    hardware.engaged_axes = {
        "B": True,
        "D": True,
        "z": True,
        "a": True,
        "b": True,
        "c": True,
    }

    res0 = api_client.get("/motors/engaged")
    assert res0.status_code == 500


def test_disengage_axes(api_client, hardware):
    postres = api_client.post("/motors/disengage", json={"axes": ["x", "b"]})

    hardware.disengage_axes.assert_called_once_with([Axis.X, Axis.B])

    assert postres.status_code == 200
    assert postres.json() == {"message": "Disengaged axes: x, b"}


def test_disengage_axes_case_insensitive(api_client, hardware):

    postres = api_client.post("/motors/disengage", json={"axes": ["Y", "A"]})

    hardware.disengage_axes.assert_called_once_with([Axis.Y, Axis.A])

    assert postres.status_code == 200
    assert postres.json() == {"message": "Disengaged axes: y, a"}


def test_disengage_invalid_axes(api_client, hardware):
    postres = api_client.post("/motors/disengage", json={"axes": ["u"]})

    hardware.disengage_axes.assert_not_called()

    assert postres.status_code == 422


def test_disengage_no_axes(api_client, hardware):
    postres = api_client.post("/motors/disengage", json={"axes": []})

    hardware.disengage_axes.assert_called_once_with([])

    assert postres.status_code == 200
    assert postres.json() == {"message": "Disengaged axes: "}
