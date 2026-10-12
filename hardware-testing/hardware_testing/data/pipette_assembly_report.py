"""Assembly QC export compatible with production revision 4225b5a50a."""

import csv
from io import StringIO
from typing import Any, Dict, Iterator, List, Optional, Sequence, Set

from hardware_testing.data.csv_report import (
    CSVLine,
    CSVLineRepeating,
    CSVReport,
    CSVResult,
    CSVSection,
)


ENCODER_DEBUG_HEADER = [
    "cycle",
    "revolution",
    "direction",
    "encoder position",
    "motor position",
    "encoder_pulses",
    "encoder ticks",
    "diff mm",
    "diff pulses",
    "diff ticks",
]

PRODUCTION_CONFIG_FIELDS = [
    "operator_name",
    "skip_liquid",
    "skip_fixture",
    "skip_diagnostics",
    "skip_plunger",
    "skip_tip_presence",
    "skip_liquid_probe",
    "skip_encoder_clean",
    "fixture_port",
    "fixture_side",
    "fixture_aspirate_sample_count",
    "slot_tip_rack_1000",
    "slot_tip_rack_200",
    "slot_tip_rack_50",
    "slot_reservoir",
    "slot_plate",
    "slot_fixture",
    "slot_trash",
    "num_trials",
    "droplet_wait_seconds",
    "simulate",
]


class ProductionAssemblyReport(CSVReport):
    """Keep typed results in memory while exporting the established production CSV."""

    def __init__(
        self,
        test_name: str,
        sections: List[CSVSection],
        config: Dict[str, Any],
        enabled_sections: Set[str],
        pipette_channels: int,
        pipette_volume: int,
        dont_write_to_disk: bool = False,
    ) -> None:
        """Snapshot this run's layout independently of later configuration changes."""
        self.production_config = dict(config)
        self.enabled_sections = set(enabled_sections)
        self.pipette_channels = pipette_channels
        self.pipette_volume = pipette_volume
        self.pcba_revision: Optional[str] = None
        super().__init__(test_name, sections, dont_write_to_disk=dont_write_to_disk)

    @property
    def tag(self) -> str:
        """Use the production filename's serial number without a class prefix."""
        return self._tag or ""

    def _line(self, section: str, tag: str, index: int = 0) -> CSVLine:
        line = self[section][tag]
        return line[index] if isinstance(line, CSVLineRepeating) else line

    def _section_result(self, section: str) -> Optional[CSVResult]:
        return CSVResult.from_bool(self[section].result_passed)

    @staticmethod
    def _row(values: Sequence[Any], stamp: Optional[float] = 0.0) -> List[Any]:
        return [round(stamp, 2) if stamp is not None else None, *values]

    def _line_row(
        self, section: str, tag: str, name: Optional[str] = None, index: int = 0
    ) -> List[Any]:
        source = self._line(section, tag, index)
        return self._row([name or tag, *source.data], source.timestamp)

    def _result_row(self, section: str, name: str) -> List[Any]:
        stamps = [
            item.timestamp for item in self[section].lines if item.timestamp is not None
        ]
        return self._row(
            [name, self._section_result(section)], max(stamps) if stamps else None
        )

    def _summary_rows(self) -> Iterator[List[Any]]:
        yield self._row(["-------"] + ["---"] * 8)
        yield self._row(["RESULTS"])
        for section, name in (
            ("DIAGNOSTICS", "diagnostics"),
            ("PLUNGER", "plunger"),
            ("LIQUID-PROBE", "liquid-probe"),
            ("LIQUID", ""),
            ("FIXTURE", "pressure"),
            ("TIP-SENSOR", "tip-presence"),
        ):
            if section not in self.enabled_sections:
                continue
            if section == "LIQUID":
                for item in self[section].lines:
                    yield self._row([item.tag, item.result])
            else:
                yield self._row([name, self._section_result(section)])

    def _metadata_rows(self) -> Iterator[List[Any]]:
        def meta(tag: str) -> Any:
            return self._line("META_DATA", tag).data[0]

        yield self._row(["--------"])
        yield self._row(["METADATA"])
        for name, value in (
            ("test-name", meta("test_name")),
            ("operator-name", meta("test_operator")),
            ("date", self._run_id),
            ("pipette", meta("test_device_id")),
        ):
            yield self._row([name, value])
        yield self._row(
            ["simulating" if self.production_config["simulate"] else "live"]
        )
        yield self._row(["version", meta("test_version")])
        yield self._row(["firmware", meta("firmware")])
        yield self._row(["pcba-revision", self.pcba_revision])

    def _configuration_rows(self) -> Iterator[List[Any]]:
        yield self._row(["-------------------"])
        yield self._row(["TEST-CONFIGURATIONS"])
        for name in PRODUCTION_CONFIG_FIELDS:
            value = (
                self._line("META_DATA", "test_operator").data[0]
                if name == "operator_name"
                else self.production_config[name]
            )
            yield self._row([name, value])
        yield self._row(["-------------------"])
        yield self._row(["TEST-THRESHOLDS"])
        for item in self["TEST-THRESHOLDS"].lines:
            values = item.data
            if item.tag in (
                "pressure-open-air",
                "pressure-sealed",
                "pressure-compressed",
            ):
                values = [
                    int(value)
                    if value is not None and float(value).is_integer()
                    else value
                    for value in values
                ]
            yield self._row([item.tag, *values], item.timestamp)
        yield self._row(["-----------------------"])
        yield self._row(["PRESSURE-CONFIGURATIONS"])
        for item in self["PRESSURE-CONFIGURATIONS"].lines:
            name, value = item.data
            if (
                name in ("sample_count", "stability_delay")
                and value is not None
                and float(value).is_integer()
            ):
                value = int(value)
            yield self._row([item.tag, name, value], item.timestamp)

    def _diagnostic_rows(self) -> Iterator[List[Any]]:
        section = "DIAGNOSTICS"
        yield self._line_row(section, "celsius-S0", "celsius")
        yield self._line_row(section, "humidity-S0", "humidity")
        yield self._line_row(
            section, "diagnostic-environment", "diagnostics-environment"
        )
        yield self._line_row(section, "encoder-home")
        yield self._line_row(section, "encoder-move")
        yield self._line_row(section, "diagnostic-encoder", "diagnostics-encoder")
        sensors = ["S0", "S1"] if self.pipette_channels == 8 else ["S0"]
        for sensor in sensors:
            yield self._line_row(section, f"capacitive-open-air-{sensor}")
        for sensor in sensors:
            yield self._line_row(section, f"capacitive-probe-{sensor}")
            for trial in range(2):
                yield self._line_row(section, f"probe-slot-{sensor}-{trial}")
            yield self._line_row(
                section,
                f"capacitive-probe-slot-{sensor}-result",
                f"capacitive-probe-{sensor}-slot-result",
            )
            yield self._line_row(section, f"capacitive-square-{sensor}")
        yield self._line_row(
            section, "diagnostic-capacitance", "diagnostics-capacitance"
        )
        for phase in ("open-air", "sealed", "compressed"):
            for sensor in sensors:
                yield self._line_row(section, f"pressure-{phase}-{sensor}")
        yield self._line_row(section, "diagnostic-pressure", "diagnostics-pressure")
        yield self._result_row(section, "diagnostics")

    def _liquid_probe_rows(self) -> Iterator[List[Any]]:
        volumes = [50] if self.pipette_volume == 50 else [50, 200, 1000]
        probes = ["primary", "secondary"] if self.pipette_channels == 8 else ["primary"]
        for volume in volumes:
            for probe in probes:
                prefix = f"liquid-probe-{volume}-tip-{probe}-probe"
                for trial in range(3):
                    yield self._line_row("LIQUID-PROBE", f"{prefix}-trial-{trial}")
                for suffix in ("-precision", "-accuracy", ""):
                    yield self._line_row("LIQUID-PROBE", prefix + suffix)
        yield self._result_row("LIQUID-PROBE", "liquid-probe")

    def _fixture_rows(self) -> Iterator[List[Any]]:
        for phase in ("pre", "insert", "holding", "dispensed", "post"):
            for channel in range(1, self.pipette_channels + 1):
                for index in range(3):
                    yield self._line_row(
                        "FIXTURE", f"pressure-{phase}-channel-{channel}", index=index
                    )
            for index in range(3 if phase == "holding" else 2):
                yield self._line_row("FIXTURE", f"pressure-{phase}", index=index)
        yield self._result_row("FIXTURE", "pressure")

    def _test_rows(self) -> Iterator[List[Any]]:
        yield self._row(["----"])
        yield self._row(["TEST"])
        yield self._line_row("META_DATA", "test_device_id", "pipette-barcode")
        if "DIAGNOSTICS" in self.enabled_sections:
            yield from self._diagnostic_rows()
        if "PLUNGER" in self.enabled_sections:
            yield self._line_row("PLUNGER", "plunger-blow-out")
            yield self._line_row("PLUNGER", "plunger-drop-tip")
            yield self._result_row("PLUNGER", "plunger")
        if "ENCODER-CLEAN" in self.enabled_sections:
            source = self._line("ENCODER-CLEAN", "diagnostics-encoder-clean")
            yield self._row(
                [source.tag, *source.data[1:], source.data[0]], source.timestamp
            )
        if "LIQUID-PROBE" in self.enabled_sections:
            yield from self._liquid_probe_rows()
        if "LIQUID" in self.enabled_sections:
            for item in self["LIQUID"].lines:
                yield self._line_row("LIQUID", item.tag)
        if "FIXTURE" in self.enabled_sections:
            yield from self._fixture_rows()
        if "TIP-SENSOR" in self.enabled_sections:
            for item in self["TIP-SENSOR"].lines:
                yield self._line_row("TIP-SENSOR", item.tag)
            yield self._result_row("TIP-SENSOR", "tip-presence")

    def _pressure_rows(self) -> Iterator[List[Any]]:
        yield self._row(["-------------"])
        yield self._row(["PRESSURE-DATA"])
        yield ["", "PHASE", *[f"CH{i}" for i in range(1, 9)]]
        if "FIXTURE" in self.enabled_sections:
            for item in self["PRESSURE-DATA"].lines:
                if item.tag != "PHASE":
                    yield self._row([item.tag, *item.data], item.timestamp)

    def __str__(self) -> str:
        """Serialize production row names, ordering, widths, and result positions."""
        output = StringIO()
        writer = csv.writer(output, lineterminator="\n")
        for rows in (
            self._summary_rows(),
            self._metadata_rows(),
            self._configuration_rows(),
            self._test_rows(),
            self._pressure_rows(),
        ):
            writer.writerows([str(value) for value in item] for item in rows)
        return output.getvalue().rstrip("\n")

    def start_encoder_debug(self) -> None:
        """Create the original debug header before the first encoder movement."""
        if not self._dont_write_to_disk:
            with (self.parent / "encoder_debug.csv").open("w", newline="") as stream:
                csv.writer(stream).writerow(ENCODER_DEBUG_HEADER)

    def record_encoder_debug(self, values: Sequence[Any]) -> None:
        """Checkpoint each completed movement, including the last stalled move."""
        if not self._dont_write_to_disk:
            with (self.parent / "encoder_debug.csv").open("a", newline="") as stream:
                csv.writer(stream).writerow(values)
