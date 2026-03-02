import time

from .rtscanner_commands import (
    create_activate_illumination_led_cmd,
    int_conv,
    turn_on_aimer,
)
from .rtscanner_driver import RTScanner

c = 261
d = 294
e = 329
f = 349
g = 391
gS = 415
a = 440
aS = 455
b = 466
cH = 523
cSH = 554
dH = 587
dSH = 622
eH = 659
fH = 698
fSH = 740
gH = 784
gSH = 830
aH = 880

level = 1


async def march(scanner: RTScanner) -> None:
    async def fun_beep(frequency: int, duration_ms: int) -> None:
        if frequency != 0:
            await scanner.do_beep(
                level=level, duration_ms=duration_ms, frequency_hz=frequency
            )
            if frequency < 550:
                await scanner.set_menu_option(
                    create_activate_illumination_led_cmd(duration_ms - 30)
                )
            else:
                await scanner.set_menu_option(
                    turn_on_aimer + int_conv(duration_ms - 30)
                )
        time.sleep(duration_ms / 1000)

    impmar = [
        (a, 500),
        (a, 500),
        (f, 350),
        (cH, 150),
        (a, 500),
        (f, 350),
        (cH, 150),
        (a, 1000),
        (eH, 500),
        (eH, 500),
        (eH, 500),
        (fH, 350),
        (cH, 150),
        (gS, 500),
        (f, 350),
        (cH, 150),
        (a, 1000),
        (aH, 500),
        (a, 350),
        (a, 150),
        (aH, 500),
        (gSH, 250),
        (gH, 250),
        (fSH, 125),
        (fH, 125),
        (fSH, 250),
        (0, 250),
        (aS, 250),
        (dSH, 500),
        (dH, 250),
        (cSH, 250),
        (cH, 125),
        (b, 125),
        (cH, 250),
        (0, 250),
        (f, 125),
        (gS, 500),
        (f, 375),
        (a, 125),
        (cH, 500),
        (a, 375),
        (cH, 125),
        (eH, 1000),
        (aH, 500),
        (a, 350),
        (a, 150),
        (aH, 500),
        (gSH, 250),
        (gH, 250),
        (fSH, 125),
        (fH, 125),
        (fSH, 250),
        (0, 250),
        (aS, 250),
        (dSH, 500),
        (dH, 250),
        (cSH, 250),
        (cH, 125),
        (b, 125),
        (cH, 250),
        (0, 250),
        (f, 250),
        (gS, 500),
        (f, 375),
        (cH, 125),
        (a, 500),
        (f, 375),
        (c, 125),
        (a, 1000),
    ]
    for freq, dur in impmar:
        await fun_beep(freq, dur)
