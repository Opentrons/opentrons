"""A big long list of all of the specific byte strings this device recognizes."""

import enum
from typing import ByteString


def bool_conv(boolean: bool) -> ByteString:
    return b"1" if boolean else b"0"


def int_conv(num: int) -> ByteString:
    return bytes([ord(c) for c in str(num)])


def expand_ascii_args(text: str) -> ByteString:
    """Double encode ascii for some reason."""
    bytestring = text.encode("ascii")
    bytes_as_str = [f"{b:02X}" for b in bytestring]
    expanded = []
    for b in bytes_as_str:
        expanded += [ord(c) for c in b]
    return bytes(expanded)


menu_prefix = b"~\x010000"
menu_suffix = b";\x03"
temporary_write = b"#"
permanent_write = b"@"

ack = b"\x06"
nack = b"\x15"

# commands
scan_trigger = b"\x1b1"
sense_trigger = b"\x1b2"
continuous_trigger = b"\x1b3"

# Device info query's
request_serial = b"QRYPSN"
request_fw_ver = b"QRYFWV"
request_decoder_ver = b"QRYDCV"
request_hw_ver = b"QRYHWV"
request_product_name = b"QRYPDN"
request_manuf_date = b"QRYDAT"
request_oem_sn = b"QRYESN"
request_data_format_ver = b"QRYDFM"
request_ccs = b"QRYCCS"
request_ccf = b"QRYCCF"


def create_activate_illumination_led_cmd(duration: int) -> ByteString:
    """Creates a bytestring used to turn on the illumination led."""
    # input from 10 to 3600000ms
    assert duration >= 10 and duration <= 3600000
    cmd = b"LEDONI0C" + int_conv(duration) + b"D"
    return cmd


turn_on_aimer = b"LEDONA"  # input from 10 to 3600000ms

######### boolean settings, # 1 for enable 0 for disable###########
illumination_led_enable = b"ILLSCN"  # use the white illumination led when scanning
aiming_led_enable = b"AMLENA"  # use the red aiming led when scanning
good_read_led_enable = b"GRLENA"  # use the UI led
power_on_beep_enable = b"PWBENA"  # beep on powerup
good_read_beep_enable = b"GRBENA"  # beep on good scan
reread_timeout_enable = (
    b"RRDENA"  # don't report a scan of the same barcode within this timeout
)
reread_reset_enable = b"RRDREN"  # if a barcode is seen again within the timeout this will start the timeout over when true
good_read_delay_enable = (
    b"GRDENA"  # delay after a good read before starting to look for a new barcode
)
add_parentheses_GS1_AI = (
    b"GS1AIP"  # if GS1 application id is on, put () around the ID prefix
)
bad_read_message_enable = (
    b"NGRENA"  # the barcode scanner will send a message over serial when it fails
)
auto_sleep_enable = b"ATSENA"
# symbologies settings
all_symbologies_enable = b"ALLENA"
enable_1d_symbologies = b"ALL1DC"
enable_2d_symbologies = b"ALL2DC"
enable_code_128 = b"128ENA"
enable_code_EAN8 = b"EA8ENA"
enable_EAN8_add2 = b"EA8AD2"
enable_EAN8_add5 = b"EA8AD5"
enable_EAN8_add_on_required = b"EA8REQ"
convert_EAN8_to_EAN13 = b"EA8EXP"
enable_EAN13 = b"E13ENA"
enable_EAN13_add2 = b"E13AD2"
enable_EAN13_add5 = b"E13AD5"
enable_EAN13_add_on_required = b"E13REQ"
enable_290_EAN13_add_on_required = b"E13290"
enable_37X_EAN13_add_on_required = b"E13378"
enable_41x_EAN13_add_on_required = b"E13414"
enable_43x_EAN13_add_on_required = b"E13434"
enable_977_EAN13_add_on_required = b"E13977"
enable_978_EAN13_add_on_required = b"E13978"
enable_979_EAN13_add_on_required = b"E13979"
enable_UPCE = b"UPEENA"
enable_UPCE_add2 = b"UPEAD2"
enable_UPCE_add5 = b"UPEAD5"
enable_UPCE_add_on_required = b"UPEREQ"
convert_UPCE_to_UPCA = b"UPEEXP"
enable_UPCA = b"UPAENA"
enable_UPCA_add2 = b"UPAAD2"
enable_UPCA_add5 = b"UPAAD5"
enable_UPCA_add_on_required = b"UPAREQ"
enable_interleaved_2of5 = b"125ENA"
enable_febraban = b"I25FBB"
enable_ITF14 = b"I14ENA"
enable_matric_2of5 = b"M25ENA"
enable_code_39 = b"C39ENA"
enable_code_39_start_stop_char = b"C39TSC"
enable_code_39_full_ascii = b"C39ASC"
enable_code_32 = b"C39E32"
enable_code_32_prefix = b"C39S32"
enable_code_32_start_stop_char = b"C39T32"
enable_code_32_check_char = b"C39C32"
enable_codebar = b"CBAENA"
enable_codebar_start_stop_char = b"CBATSC"
enable_code_93 = b"C93ENA"
enable_GS1_128 = b"GS1ENA"
enable_GS1_databar = b"RSSENA"
GS1_databar_transmit_01_app_id = b"RSSTAI"
enable_code_11 = b"C11ENA"
code_11_transmit_check = b"C11TCK"
ISBN_enable = b"ISBENA"
ISSN_enable = b"ISSENA"
industrial_25_enable = b"L25ENA"
standard_25_enable = b"S25ENA"
plessey_enable = b"PLYENA"
msi_plessey_enable = b"MSIENA"
msi_plessey_transmit_check = b"MSITCK"
aim_128_enable = b"AIMENA"
pdf417_enable = b"PDFENA"
pdf417_use_utf_8 = b"PDFENC"
pdf417_eci_out = b"PDFECI"
QR_enable = b"QRCENA"
QR_use_utf_8 = b"QRCENC"
QR_eci_out = b"QRCECI"
mirror_QR_enable = b"MQRENA"
datamatrix_enable = b"DMCENA"
datamatrix_use_utf8 = b"DMCENC"
datamatrix_eci_out = b"DMCECI"
rectangular_datamatrix_enable = b"DMCREC"
enable_prefix_suffixs = b"APSENA"
enable_custom_prefix = b"CPRENA"
enable_aim_id = b"AIDENA"
enable_code_id_prefix = b"CIDENA"
enable_custom_suffix = b"CSUENA"
enable_terminating_suffix = b"TSUENA"

################# numerical value settings ############
good_read_led_duration = b"GRLDUR"  # from 1 to 2500 ms
good_read_beep_duration = b"GRBDUR"  # from 20 to 300ms
good_read_beep_frequency = b"GRBFRQ"  # from 20 to 20k hz
good_read_beep_volume = b"GRBVLL"  # from 1 - 20
decode_timeout = b"ORTSET"  # 1 to 3000 ms
image_stabilization_timeout = b"SENIST"  # 0 to 3000 ms
reread_timeout = b"RPDDUR"  # 0 to 3000 ms
image_decode_timeout = b"DETSET"  # 1 to 3000 ms
good_read_delay = b"GRDDUR"  # from 1 and 3,600,000ms
sensitivity = b"SENLVL"  # from 1 and 20, lower is more sensitive
auto_sleep_time = b"ATSDUR"  # from 1 to 36000 seconds

# code specific settings
code_128_min_length = b"128MIN"  # 1 to 48 char
code_128_max_length = b"128MAX"  # 1 to 48 char
interleaved_2of5_min_length = b"I25MIN"  # 1 to 48 char
interleaved_2of5_max_length = b"I25MAX"  # 1 to 48 char
matrix_2of5_min_length = b"M25MIN"  # 1 to 80 char
matrix_2of5_max_length = b"M25MAX"  # 1 to 80 char
code_39_min_length = b"C39MIN"  # 1 to 48 char
code_39_max_length = b"C39MAX"  # 1 to 48 char
codebar_min_length = b"CBAMIN"  # 1 to 60 char
codebar_max_length = b"CBAMAX"  # 1 to 60 char
code_93_min_length = b"C93MIN"  # 1 to 48 char
code_93_max_length = b"C93MAX"  # 1 to 48 char
gs1_128_min_length = b"GS1MIN"  # 1 to 48 char
gs1_128_max_length = b"GS1MAX"  # 1 to 48 char
code_11_min_length = b"C11MIN"  # 1 to 48 char
code_11_max_length = b"C11MAX"  # 1 to 48 char
industrial_25_min_length = b"L25MIN"  # 1 to 48 char
industrial_25_max_length = b"L25MAX"  # 1 to 48 char
standard_25_min_length = b"S25MIN"  # 1 to 48 char
standard_25_max_length = b"S25MAX"  # 1 to 48 char
plessey_min_length = b"PLYMIN"  # 1 to 48 char
plessey_max_length = b"PLYMAX"  # 1 to 48 char
msi_plessey_min_length = b"MSIMIN"  # 1 to 48 char
msi_plessey_max_length = b"MSIMAX"  # 1 to 48 char
aim_min_length = b"AIMMIN"  # 1 to 48 char
aim_max_length = b"AIMMAX"  # 1 to 48 char
pdf_417_min_length = b"PDFMIN"  # 1 to 2710 char
pdf_417_max_length = b"PDFMAX"  # 1 to 2710 char
qr_min_length = b"PDFMIN"  # 1 to 7089 char
qr_max_length = b"PDFMAX"  # 1 to 7089 char
mirror_qr_min_length = b"MQRMIN"  # 1 to 35 char
mirror_qr_max_length = b"MQRMAX"  # 1 to 35 char
datamatrix_min_length = b"DMCMIN"  # 1 to 3116 char
datamatrix_max_length = b"DMCMAX"  # 1 to 3116 char

# Text settings
modify_scan_command = b"SCNTCT"  # replace the trigger command with 1-10 ascii chars
modify_stop_scan_command = b"SCNTCP"  # replace the end command with 1-10 ascii chars
bad_read_message = b"NGRSET"  # up to 7 ascii characters
set_custom_prefix = b"CPRSET"  # up to 10 ascii characters
set_custom_suffix = b"CSUSET"  # up to 10 ascii characters
set_terminating_suffix = b"TSUSET"  # up to 2 ascii characters


# special settings

do_beep = b"BEEPON"  # BEEPON2000F50T20V command[frequency]F[duration]T[volume]V


class ScanMode(enum.Enum):
    level = b"0"  # decoder starts on trigger pull or serial command
    sense = b"2"  # the decoder starts when the camera sees motion
    continous = b"3"  # the decoder is always looking
    # on a trigger pull the scanner just keeps looking for barcodes until the trigger is released.
    batch = b"7"


set_scan_mode = b"SCNMOD"  # ScanMode


class ScanAreaMode(enum.Enum):
    whole_area = b"0"  # return first barcode scanned in whole field of vision
    specified_area = b"1"  # scan certain quadrants of the field of vision
    acuread = b"2"  # only scan the barcode centered on the aiming led


set_scan_area = b"CADENA"  # ScanAreaMode
# when using specified area mode you can set the section of field of view
top_of_decoding_area = b"CADTOP"  # 0-100 % of field of view
bottom_of_decoding_area = b"CADBOT"  # 0-100 % of field of view
left_of_decoding_area = b"CADLEF"  # 0-100 % of field of view
right_of_decoding_area = b"CADRIG"  # 0-100 % of field of view


class MirrorSetting(enum.Enum):
    do_not_flip = b"0"
    flip_horizontally = b"1"
    flip_vertically = b"2"
    flip_horizontally_vertically = b"3"


set_mirror_setting = b"MIRROR"  # MirrorSetting


# why the break the 1 for enable 0 for disable here I have no idea
# EAN's last digit is a checksum, we can optionally send it with the rest of the data
class EANCheckChar(enum.Enum):
    enable = b"2"
    disable = b"1"


enable_EAN8_check_char = b"EA8CHK"
enable_EAN13_check_char = b"E13CHK"
enable_UPCE_check_char = b"UPECHK"


# UPC has a country digit first, then a system digit, and these can be optionally turned off/on
class UPCPreambleChar(enum.Enum):
    none = b"0"
    system = b"1"
    system_and_country = b"2"


set_UPCE_preamble = b"UPEPRE"
set_UPCA_preamble = b"UPAPRE"


class StandardCheckChar(enum.Enum):
    disable = b"0"  # don't check the last character and just transmit it
    dont_transmit = ord(
        "1"
    )  # verify the checksum before sending data but don't include the check char
    transmit = b"2"  # verify and send the check char


I25_check_char_verifcation = b"I25CHK"
M25_check_char_verifcation = b"M25CHK"
code_39_check_char_verifcation = b"C39CHK"
codebar_check_char_verifcation = b"CBACHK"
code_39_check_char_verifcation = b"C93CHK"
industrial_25_check_char_verifcation = b"L25CHK"
standard_25_check_char_verifcation = b"S25CHK"
plessey_check_char_verifcation = b"PLYCHK"


# once again breaking the standard rules where this is both the enable and setting argument
class ITF6Enable(enum.Enum):
    disable = b"0"  # disable this symbology
    dont_transmit_check = b"1"  # check the integrety but don't send the check char
    transmit_check = b"2"  # check and send the check char


enable_ITF6 = b"IT6ENA"


# rarely used codebar checksum settings
class CodebarStartStopPair(enum.Enum):
    ABCD_ABCD = b"0"
    ABCD_TNxE = b"1"
    abcd_abcd = b"2"
    abcd_tnxe = b"3"


set_codebar_start_stop_pair = b"CBASCF"


class Code11CheckCharVerifcation(enum.Enum):
    disable = b"0"
    one_check_char_mod_11 = b"1"
    two_check_char_mod_11_mod_11 = b"2"
    two_check_char_mod_11_mod_9 = b"3"
    one_or_two_mod_11 = b"4"
    one_or_two_mod_11_mod_9 = b"5"


code_11_check_char_verification = b"C11CHK"


class MSICheckCharVerifcation(enum.Enum):
    disable = b"0"
    one_check_char_mod_10 = b"1"
    two_check_char_mod_10_mod_10 = b"2"
    two_check_char_mod_10_mod_11 = b"3"


msi_plessey_check_char_verifcation = b"MSICHK"


class TwinCodeSettings(enum.Enum):
    single_only = b"0"
    twin_only = b"1"
    singe_and_twin = b"2"


twin_PDF417_barcodes = b"PDFDOU"
twin_QR_barcodes = b"QRCDOU"
twin_datamatrix_barcodes = b"DMCDOU"
