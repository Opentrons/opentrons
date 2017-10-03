import pytest
from unittest import mock

from fixtures import main_router, model


def state(state):
    def _match(item):
        return item['name'] == 'state' and \
               item['topic'] == 'calibration' and \
               item['payload'].state == state

    return _match


async def test_tip_probe(main_router):
    # TODO (artyom, 20171002): remove create=True once driver code is merged
    with mock.patch(
         'opentrons.util.calibration_functions.probe_instrument',
         create=True) as patch:
        main_router.calibration_manager.tip_probe('instrument')
        patch.assert_called_with(
            'instrument',
            main_router.calibration_manager._robot)

        await main_router.wait_until(state('probing'))
        await main_router.wait_until(state('ready'))


async def test_move_to_front(main_router, model):
    # TODO (artyom, 20171002): remove create=True once driver code is merged
    with mock.patch(
         'opentrons.util.calibration_functions.move_instrument_for_probing_prep',  # NOQA
         create=True) as patch:

        main_router.calibration_manager.move_to_front(model.instrument)
        patch.assert_called_with(
            model.instrument._instrument,
            main_router.calibration_manager._robot)

        await main_router.wait_until(state('moving'))
        await main_router.wait_until(state('ready'))


async def test_move_to(main_router, model):
    with mock.patch.object(model.instrument._instrument, 'move_to') as move_to:
        main_router.calibration_manager.move_to(
            model.instrument,
            model.container)

        move_to.assert_called_with(model.container._container[0])

        await main_router.wait_until(state('moving'))
        await main_router.wait_until(state('ready'))


async def test_jog(main_router, model):
    # TODO (artyom, 20171002): remove create=True once driver code is merged
    with mock.patch.object(
             model.instrument._instrument, 'jog', create=True) as jog:
        main_router.calibration_manager.jog(
            model.instrument,
            (1, 2, 3)
        )

        jog.assert_called_with((1, 2, 3))

        await main_router.wait_until(state('moving'))
        await main_router.wait_until(state('ready'))


async def test_update_container_offset(main_router, model):
    with mock.patch.object(
            main_router.calibration_manager._robot,
            'calibrate_container_with_instrument') as call:
        main_router.calibration_manager.update_container_offset(
                model.container,
                model.instrument
            )
        call.assert_called_with(
            container=model.container._container,
            instrument=model.instrument._instrument,
            save=True
        )
