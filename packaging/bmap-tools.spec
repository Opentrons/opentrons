# We follow the Fedora guide for versioning. Fedora recommends to use something
# like '1.0-0.rc7' for release candidate rc7 and '1.0-1' for the '1.0' release.
%define rc_str %{?rc_num:0.rc%{rc_num}}%{!?rc_num:1}

Name: bmap-tools
Summary: Tools to generate block map (AKA bmap) and flash images using bmap
Version: 3.6
%if 0%{?opensuse_bs}
Release: %{rc_str}.<CI_CNT>.<B_CNT>
%else
Release: %{rc_str}.0.0
%endif

Group: Development/Tools/Other
License: GPL-2.0
BuildArch: noarch
URL: https://github.com/intel/bmap-tools
Source0: %{name}-%{version}.tar.gz

Requires: bzip2
Requires: pbzip2
Requires: gzip
Requires: xz
Requires: tar
Requires: unzip
Requires: lzop
%if ! 0%{?tizen_version:1}
# pigz is not present in Tizen
Requires: pigz
%endif

%if 0%{?suse_version}
BuildRequires: python-distribute
%endif
%if 0%{?fedora_version}
BuildRequires: python-setuptools
%endif
BuildRequires: python2-rpm-macros

%if 0%{?suse_version}
# In OpenSuse the xml.etree module is provided by the python-xml package
Requires: python-xml
# The gpgme python module is in python-gpgme
Requires: python-gpgme
%endif

%if 0%{?fedora_version}
# In Fedora the xml.etree module is provided by the python-libs package
Requires: python-libs
# Tha gpgme python module is in pygpgme package
Requires: pygpgme
%endif

# Centos6 uses python 2.6, which does not have the argparse module. However,
# argparse is available as a separate package there.
%if 0%{?centos_version} == 600
Requires: python-argparse
%endif

%description
Tools to generate block map (AKA bmap) and flash images using bmap. Bmaptool is
a generic tool for creating the block map (bmap) for a file, and copying files
using the block map. The idea is that large file containing unused blocks, like
raw system image files, can be copied or flashed a lot faster with bmaptool
than with traditional tools like "dd" or "cp". See
source.tizen.org/documentation/reference/bmaptool for more information.

%prep
%setup -q -n %{name}-%{version}

%build

%install
rm -rf %{buildroot}
%{__python2} setup.py install --prefix=%{_prefix} --root=%{buildroot}

mkdir -p %{buildroot}/%{_mandir}/man1
install -m644 docs/man1/bmaptool.1 %{buildroot}/%{_mandir}/man1

%files
%defattr(-,root,root,-)
%license COPYING
%dir /usr/lib/python*/site-packages/bmaptools
/usr/lib/python*/site-packages/bmap_tools*
/usr/lib/python*/site-packages/bmaptools/*
%{_bindir}/*

%doc docs/RELEASE_NOTES
%{_mandir}/man1/*
