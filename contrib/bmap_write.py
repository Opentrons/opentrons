#!/usr/bin/python

# A super-simple standalone script (works with both Python2 / Python3 and has
# no external dependencies) to show how easily .bmap files can be parsed.
# (Also demonstrates how little code it takes - which might be a useful starting
# point for other languages)
#
# This is effectively a minimal version of 'bmaptool copy'. It only supports
# uncompressed images, it does no verification, and if the image is named
# mydata.img it assumes the corresponding bmap is named mydata.bmap

#    Copyright (C) 2018  Andrew Scheller
#
#    This program is free software; you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation; either version 2 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License along
#    with this program; if not, write to the Free Software Foundation, Inc.,
#    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

import sys
import xml.etree.ElementTree as ET
import re
import os

if len(sys.argv) != 3:
    print("Usage: %s <raw-file> <output-file>" % os.path.basename(sys.argv[0]))
    sys.exit(1)
raw_file = sys.argv[1]
output_file = sys.argv[2]
if not os.path.isfile(raw_file):
    print("raw-file '%s' doesn't exist" % raw_file)
    sys.exit(1)
file_root, file_ext = os.path.splitext(raw_file)
bmap_file = file_root + '.bmap'
if not os.path.isfile(bmap_file):
    print("bmap-file '%s' doesn't exist" % bmap_file)
    sys.exit(1)

bmap_root = ET.parse(bmap_file).getroot()
blocksize = int(bmap_root.find('BlockSize').text)
with open(raw_file, 'rb') as filedata:
    with open(output_file, 'wb') as outdata:
        try:
            outdata.truncate(int(bmap_root.find('ImageSize').text)) # optional
        except:
            pass
        for bmap_range in bmap_root.find('BlockMap').findall('Range'):
            blockrange = bmap_range.text
            m = re.match('^\s*(\d+)\s*-\s*(\d+)\s*$', blockrange)
            if m:
                start = int(m.group(1))
                end = int(m.group(2))
            else:
                start = int(blockrange)
                end = start
            start_offset = start * blocksize
            filedata.seek(start_offset, 0)
            outdata.seek(start_offset, 0)
            for i in range(end - start + 1):
                outdata.write(filedata.read(blocksize))
        outdata.flush()
        os.fsync(outdata.fileno())
