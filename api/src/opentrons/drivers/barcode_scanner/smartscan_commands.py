"""A big long list of all of the specific byte strings this device recognizes."""

ack = b"\x04\xd0\x00\x00\xff\x2c"

scan_trigger = b"\xe4\x04\x00"

menu_prefix = b"\xc6\x04\x08\x00"

suffix_cmd = b"\xf2\x05"
suffix_crlf = menu_prefix + suffix_cmd + b"\x01"
suffix_cr = menu_prefix + suffix_cmd + b"\x02"
suffix_tab = menu_prefix + suffix_cmd + b"\x03"
suffix_crcr = menu_prefix + suffix_cmd + b"\x04"
suffix_crlfcrlf = menu_prefix + suffix_cmd + b"\x05"

set_timeout_cmd = menu_prefix + b"\x88"
