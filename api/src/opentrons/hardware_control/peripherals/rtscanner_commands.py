"""A big long list of all of the specific byte strings this device recognizes."""

import enum
from typing import List

menu_prefix = [0x7E, 0x01, 0x30, 0x30, 0x30, 0x30]
menu_suffix = [0x3B, 0x03]
temporary_write = [0x23]
permanent_write = [0x40]

ack = [0x06]
nack = [0x15]

# commands
scan_trigger = [0x1B, 0x31]
sense_trigger = [0x1B, 0x32]
continuous_trigger = [0x1B, 0x33]


class ledColor(enum.Enum):
    """Used for the good/bad read led color."""

    red = ord("0")
    white = ord("1")
    green = ord("2")
    blue = ord("3")


def create_activate_good_read_led_cmd(color: ledColor, duration: int) -> List[int]:
    """Creates a bytestring used to turn on the good read led."""
    # input from 10 to 3600000ms
    assert duration >= 10 and duration <= 3600000
    cmd = (
        [ord(c) for c in "LEDONS"]
        + [color.value, ord("C")]
        + [ord(c) for c in str(duration)]
        + [ord("D")]
    )
    return cmd


def create_activate_illumination_led_cmd(color: ledColor, duration: int) -> List[int]:
    """Creates a bytestring used to turn on the illumination led."""
    # input from 10 to 3600000ms
    assert duration >= 10 and duration <= 3600000
    cmd = (
        [ord(c) for c in "LEDONI"]
        + [color.value, ord("C")]
        + [ord(c) for c in str(duration)]
        + [ord("D")]
    )
    return cmd


turn_on_aimer = [ord(c) for c in "LEDONA"]  # input from 10 to 3600000ms

######### boolean settings, # 1 for enable 0 for disable###########
illumination_led_enable = [
    ord(c) for c in "ILLSCN"
]  # use the white illumination led when scanning
aiming_led_enable = [ord(c) for c in "AMLENA"]  # use the red aiming led when scanning
good_read_led_enable = [ord(c) for c in "GRLENA"]  # use the UI led
power_on_beep_enable = [ord(c) for c in "PWBENA"]  # beep on powerup
good_read_beep_enable = [ord(c) for c in "GRBENA"]  # beep on good scan
reread_timeout_enable = [
    ord(c) for c in "RRDENA"
]  # don't report a scan of the same barcode within this timeout
reread_reset_enable = [
    ord(c) for c in "RRDREN"
]  # if a barcode is seen again within the timeout this will start the timeout over when true
good_read_delay_enable = [
    ord(c) for c in "GRDENA"
]  # delay after a good read before starting to look for a new barcode
add_parentheses_GS1_AI = [
    ord(c) for c in "GS1AIP"
]  # if GS1 application id is on, put () around the ID prefix
bad_read_message_enable = [
    ord(c) for c in "NGRENA"
]  # the barcode scanner will send a message over serial when it fails
auto_sleep_enable = [ord(c) for c in "ATSENA"]
# symbologies settings
all_symbologies_enable = [ord(c) for c in "ALLENA"]
enable_1d_symbologies = [ord(c) for c in "ALL1DC"]
enable_2d_symbologies = [ord(c) for c in "ALL2DC"]
enable_code_128 = [ord(c) for c in "128ENA"]
enable_code_EAN8 = [ord(c) for c in "EA8ENA"]
enable_EAN8_add2 = [ord(c) for c in "EA8AD2"]
enable_EAN8_add5 = [ord(c) for c in "EA8AD5"]
enable_EAN8_add_on_required = [ord(c) for c in "EA8REQ"]
convert_EAN8_to_EAN13 = [ord(c) for c in "EA8EXP"]
enable_EAN13 = [ord(c) for c in "E13ENA"]
enable_EAN13_add2 = [ord(c) for c in "E13AD2"]
enable_EAN13_add5 = [ord(c) for c in "E13AD5"]
enable_EAN13_add_on_required = [ord(c) for c in "E13REQ"]
enable_290_EAN13_add_on_required = [ord(c) for c in "E13290"]
enable_37X_EAN13_add_on_required = [ord(c) for c in "E13378"]
enable_41x_EAN13_add_on_required = [ord(c) for c in "E13414"]
enable_43x_EAN13_add_on_required = [ord(c) for c in "E13434"]
enable_977_EAN13_add_on_required = [ord(c) for c in "E13977"]
enable_978_EAN13_add_on_required = [ord(c) for c in "E13978"]
enable_979_EAN13_add_on_required = [ord(c) for c in "E13979"]
enable_UPCE = [ord(c) for c in "UPEENA"]
enable_UPCE_add2 = [ord(c) for c in "UPEAD2"]
enable_UPCE_add5 = [ord(c) for c in "UPEAD5"]
enable_UPCE_add_on_required = [ord(c) for c in "UPEREQ"]
convert_UPCE_to_UPCA = [ord(c) for c in "UPEEXP"]
enable_UPCA = [ord(c) for c in "UPAENA"]
enable_UPCA_add2 = [ord(c) for c in "UPAAD2"]
enable_UPCA_add5 = [ord(c) for c in "UPAAD5"]
enable_UPCA_add_on_required = [ord(c) for c in "UPAREQ"]
enable_interleaved_2of5 = [ord(c) for c in "125ENA"]
enable_febraban = [ord(c) for c in "I25FBB"]
enable_ITF14 = [ord(c) for c in "I14ENA"]
enable_matric_2of5 = [ord(c) for c in "M25ENA"]
enable_code_39 = [ord(c) for c in "C39ENA"]
enable_code_39_start_stop_char = [ord(c) for c in "C39TSC"]
enable_code_39_full_ascii = [ord(c) for c in "C39ASC"]
enable_code_32 = [ord(c) for c in "C39E32"]
enable_code_32_prefix = [ord(c) for c in "C39S32"]
enable_code_32_start_stop_char = [ord(c) for c in "C39T32"]
enable_code_32_check_char = [ord(c) for c in "C39C32"]
enable_codebar = [ord(c) for c in "CBAENA"]
enable_codebar_start_stop_char = [ord(c) for c in "CBATSC"]
enable_code_93 = [ord(c) for c in "C93ENA"]
enable_GS1_128 = [ord(c) for c in "GS1ENA"]
enable_GS1_databar = [ord(c) for c in "RSSENA"]
GS1_databar_transmit_01_app_id = [ord(c) for c in "RSSTAI"]
enable_code_11 = [ord(c) for c in "C11ENA"]
code_11_transmit_check = [ord(c) for c in "C11TCK"]
ISBN_enable = [ord(c) for c in "ISBENA"]
ISSN_enable = [ord(c) for c in "ISSENA"]
industrial_25_enable = [ord(c) for c in "L25ENA"]
standard_25_enable = [ord(c) for c in "S25ENA"]
plessey_enable = [ord(c) for c in "PLYENA"]
msi_plessey_enable = [ord(c) for c in "MSIENA"]
msi_plessey_transmit_check = [ord(c) for c in "MSITCK"]
aim_128_enable = [ord(c) for c in "AIMENA"]
pdf417_enable = [ord(c) for c in "PDFENA"]
pdf417_use_utf_8 = [ord(c) for c in "PDFENC"]
pdf417_eci_out = [ord(c) for c in "PDFECI"]
QR_enable = [ord(c) for c in "QRCENA"]
QR_use_utf_8 = [ord(c) for c in "QRCENC"]
QR_eci_out = [ord(c) for c in "QRCECI"]
mirror_QR_enable = [ord(c) for c in "MQRENA"]
datamatrix_enable = [ord(c) for c in "DMCENA"]
datamatrix_use_utf8 = [ord(c) for c in "DMCENC"]
datamatrix_eci_out = [ord(c) for c in "DMCECI"]
rectangular_datamatrix_enable = [ord(c) for c in "DMCREC"]
enable_prefix_suffixs = [ord(c) for c in "APSENA"]
enable_custom_prefix = [ord(c) for c in "CPRENA"]
enable_aim_id = [ord(c) for c in "AIDENA"]
enable_code_id_prefix = [ord(c) for c in "CIDENA"]
enable_custom_suffix = [ord(c) for c in "CSUENA"]

################# numerical value settings ############
good_read_led_duration = [ord(c) for c in "GRLDUR"]  # from 1 to 2500 ms
good_read_beep_duration = [ord(c) for c in "GRBDUR"]  # from 20 to 300ms
good_read_beep_frequency = [ord(c) for c in "GRBFRQ"]  # from 20 to 20k hz
good_read_beep_volume = [ord(c) for c in "GRBVLL"]  # from 1 - 20
decode_timeout = [ord(c) for c in "ORTSET"]  # 1 to 3000 ms
image_stabilization_timeout = [ord(c) for c in "SENIST"]  # 0 to 3000 ms
reread_timeout = [ord(c) for c in "RPDDUR"]  # 0 to 3000 ms
image_decode_timeout = [ord(c) for c in "DETSET"]  # 1 to 3000 ms
good_read_delay = [ord(c) for c in "GRDDUR"]  # from 1 and 3,600,000ms
sensitivity = [ord(c) for c in "SENLVL"]  # from 1 and 20, lower is more sensitive
auto_sleep_time = [ord(c) for c in "ATSDUR"]  # from 1 to 36000 seconds

# code specific settings
code_128_min_length = [ord(c) for c in "128MIN"]  # 1 to 48 char
code_128_max_length = [ord(c) for c in "128MAX"]  # 1 to 48 char
interleaved_2of5_min_length = [ord(c) for c in "I25MIN"]  # 1 to 48 char
interleaved_2of5_max_length = [ord(c) for c in "I25MAX"]  # 1 to 48 char
matrix_2of5_min_length = [ord(c) for c in "M25MIN"]  # 1 to 80 char
matrix_2of5_max_length = [ord(c) for c in "M25MAX"]  # 1 to 80 char
code_39_min_length = [ord(c) for c in "C39MIN"]  # 1 to 48 char
code_39_max_length = [ord(c) for c in "C39MAX"]  # 1 to 48 char
codebar_min_length = [ord(c) for c in "CBAMIN"]  # 1 to 60 char
codebar_max_length = [ord(c) for c in "CBAMAX"]  # 1 to 60 char
code_93_min_length = [ord(c) for c in "C93MIN"]  # 1 to 48 char
code_93_max_length = [ord(c) for c in "C93MAX"]  # 1 to 48 char
gs1_128_min_length = [ord(c) for c in "GS1MIN"]  # 1 to 48 char
gs1_128_max_length = [ord(c) for c in "GS1MAX"]  # 1 to 48 char
code_11_min_length = [ord(c) for c in "C11MIN"]  # 1 to 48 char
code_11_max_length = [ord(c) for c in "C11MAX"]  # 1 to 48 char
industrial_25_min_length = [ord(c) for c in "L25MIN"]  # 1 to 48 char
industrial_25_max_length = [ord(c) for c in "L25MAX"]  # 1 to 48 char
standard_25_min_length = [ord(c) for c in "S25MIN"]  # 1 to 48 char
standard_25_max_length = [ord(c) for c in "S25MAX"]  # 1 to 48 char
plessey_min_length = [ord(c) for c in "PLYMIN"]  # 1 to 48 char
plessey_max_length = [ord(c) for c in "PLYMAX"]  # 1 to 48 char
msi_plessey_min_length = [ord(c) for c in "MSIMIN"]  # 1 to 48 char
msi_plessey_max_length = [ord(c) for c in "MSIMAX"]  # 1 to 48 char
aim_min_length = [ord(c) for c in "AIMMIN"]  # 1 to 48 char
aim_max_length = [ord(c) for c in "AIMMAX"]  # 1 to 48 char
pdf_417_min_length = [ord(c) for c in "PDFMIN"]  # 1 to 2710 char
pdf_417_max_length = [ord(c) for c in "PDFMAX"]  # 1 to 2710 char
qr_min_length = [ord(c) for c in "PDFMIN"]  # 1 to 7089 char
qr_max_length = [ord(c) for c in "PDFMAX"]  # 1 to 7089 char
mirror_qr_min_length = [ord(c) for c in "MQRMIN"]  # 1 to 35 char
mirror_qr_max_length = [ord(c) for c in "MQRMAX"]  # 1 to 35 char
datamatrix_min_length = [ord(c) for c in "DMCMIN"]  # 1 to 3116 char
datamatrix_max_length = [ord(c) for c in "DMCMAX"]  # 1 to 3116 char

# Text settings
modify_scan_command = [
    ord(c) for c in "SCNTCT"
]  # replace the trigger command with 1-10 ascii chars
modify_stop_scan_command = [
    ord(c) for c in "SCNTCP"
]  # replace the end command with 1-10 ascii chars
bad_read_message = [ord(c) for c in "NGRSET"]  # up to 7 ascii characters
set_custom_prefix = [ord(c) for c in "CPRSET"]  # up to 10 ascii characters
set_custom_suffix = [ord(c) for c in "CSUSET"]  # up to 10 ascii characters


# special settings
class ScanMode(enum.Enum):
    level = ord("0")  # decoder starts on trigger pull or serial command
    sense = ord("2")  # the decoder starts when the camera sees motion
    continous = ord("3")  # the decoder is always looking
    batch = ord(
        "7"
    )  # on a trigger pull the scanner just keeps looking for barcodes until the trigger is released.


set_scan_mode = [ord(c) for c in "SCNMOD"]  # ScanMode


class ScanAreaMode(enum.Enum):
    whole_area = ord("0")  # return first barcode scanned in whole field of vision
    specified_area = ord("1")  # scan certain quadrants of the field of vision
    acuread = ord("2")  # only scan the barcode centered on the aiming led


set_scan_area = [ord(c) for c in "CADENA"]  # ScanAreaMode
# when using specified area mode you can set the section of field of view
top_of_decoding_area = [ord(c) for c in "CADTOP"]  # 0-100 % of field of view
bottom_of_decoding_area = [ord(c) for c in "CADBOT"]  # 0-100 % of field of view
left_of_decoding_area = [ord(c) for c in "CADLEF"]  # 0-100 % of field of view
right_of_decoding_area = [ord(c) for c in "CADRIG"]  # 0-100 % of field of view


class MirrorSetting(enum.Enum):
    do_not_flip = ord("0")
    flip_horizontally = ord("1")
    flip_vertically = ord("2")
    flip_horizontally_vertically = ord("3")


set_mirror_setting = [ord(c) for c in "MIRROR"]  # MirrorSetting


# why the break the 1 for enable 0 for disable here I have no idea
# EAN's last digit is a checksum, we can optionally send it with the rest of the data
class EANCheckChar(enum.Enum):
    enable = ord("2")
    disable = ord("1")


enable_EAN8_check_char = [ord(c) for c in "EA8CHK"]
enable_EAN13_check_char = [ord(c) for c in "E13CHK"]
enable_UPCE_check_char = [ord(c) for c in "UPECHK"]


# UPC has a country digit first, then a system digit, and these can be optionally turned off/on
class UPCPreambleChar(enum.Enum):
    none = ord("0")
    system = ord("1")
    system_and_country = ord("2")


set_UPCE_preamble = [ord(c) for c in "UPEPRE"]
set_UPCA_preamble = [ord(c) for c in "UPAPRE"]


class StandardCheckChar(enum.Enum):
    disable = ord("0")  # don't check the last character and just transmit it
    dont_transmit = ord(
        "1"
    )  # verify the checksum before sending data but don't include the check char
    transmit = ord("2")  # verify and send the check char


I25_check_char_verifcation = [ord(c) for c in "I25CHK"]
M25_check_char_verifcation = [ord(c) for c in "M25CHK"]
code_39_check_char_verifcation = [ord(c) for c in "C39CHK"]
codebar_check_char_verifcation = [ord(c) for c in "CBACHK"]
code_39_check_char_verifcation = [ord(c) for c in "C93CHK"]
industrial_25_check_char_verifcation = [ord(c) for c in "L25CHK"]
standard_25_check_char_verifcation = [ord(c) for c in "S25CHK"]
plessey_check_char_verifcation = [ord(c) for c in "PLYCHK"]


# once again breaking the standard rules where this is both the enable and setting argument
class ITF6Enable(enum.Enum):
    disable = ord("0")  # disable this symbology
    dont_transmit_check = ord("1")  # check the integrety but don't send the check char
    transmit_check = ord("2")  # check and send the check char


enable_ITF6 = [ord(c) for c in "IT6ENA"]


# rarely used codebar checksum settings
class CodebarStartStopPair(enum.Enum):
    ABCD_ABCD = ord("0")
    ABCD_TNxE = ord("1")
    abcd_abcd = ord("2")
    abcd_tnxe = ord("3")


set_codebar_start_stop_pair = [ord(c) for c in "CBASCF"]


class Code11CheckCharVerifcation(enum.Enum):
    disable = ord("0")
    one_check_char_mod_11 = ord("1")
    two_check_char_mod_11_mod_11 = ord("2")
    two_check_char_mod_11_mod_9 = ord("3")
    one_or_two_mod_11 = ord("4")
    one_or_two_mod_11_mod_9 = ord("5")


code_11_check_char_verification = [ord(c) for c in "C11CHK"]


class MSICheckCharVerifcation(enum.Enum):
    disable = ord("0")
    one_check_char_mod_10 = ord("1")
    two_check_char_mod_10_mod_10 = ord("2")
    two_check_char_mod_10_mod_11 = ord("3")


msi_plessey_check_char_verifcation = [ord(c) for c in "MSICHK"]


class TwinCodeSettings(enum.Enum):
    single_only = ord("0")
    twin_only = ord("1")
    singe_and_twin = ord("2")


twin_PDF417_barcodes = [ord(c) for c in "PDFDOU"]
twin_QR_barcodes = [ord(c) for c in "QRCDOU"]
twin_datamatrix_barcodes = [ord(c) for c in "DMCDOU"]
