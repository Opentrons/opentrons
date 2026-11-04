"""Test the labware containment math utils."""

import pytest

from opentrons_shared_data.labware.labware_definition import (
    AxisAlignedBoundingBox3D,
    ContainedSpace,
    ContainmentShape,
    Extents,
    LabwareDefinition2,
    LabwareDefinition3,
    Vector3D,
)
from opentrons_shared_data.labware.labware_definition import (
    Dimensions as LabwareDimensions,
)
from opentrons_shared_data.labware.labware_definition import (
    Parameters2 as LabwareDefinition2Parameters,
)

from opentrons.protocol_engine.state.containment_utils import is_fully_contained

_MOCK_LABWARE_DEFINITION3 = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
    schemaVersion=3,
    extents=Extents(
        total=AxisAlignedBoundingBox3D(
            backLeftBottom=Vector3D(x=0, y=0, z=0),
            frontRightTop=Vector3D(x=200, y=-50, z=30),
        ),
    ),
)

_MOCK_LABWARE_DEFINITION2 = LabwareDefinition2.model_construct(  # type: ignore[call-arg]
    namespace="test",
    version=1,
    schemaVersion=2,
    dimensions=LabwareDimensions(xDimension=1000, yDimension=1200, zDimension=750),
    parameters=LabwareDefinition2Parameters.model_construct(loadName="labware-name"),  # type: ignore[call-arg]
)


@pytest.mark.parametrize(
    ("origin", "boundary_dims", "resident_dims", "expected"),
    [
        # Happy path
        (Vector3D(x=0, y=0, z=0), (100, 60, 15), (100, 60, 15), True),
        (Vector3D(x=5, y=10, z=2), (100, 60, 15), (95, 50, 8), True),
        (Vector3D(x=10, y=15, z=3), (120, 80, 20), (100, 60, 15), True),
        # Failure cases
        (Vector3D(x=0, y=0, z=0), (80, 50, 12), (85, 50, 12), False),
        (Vector3D(x=0, y=0, z=0), (80, 50, 12), (80, 55, 12), False),
        (Vector3D(x=0, y=0, z=0), (80, 50, 12), (80, 50, 15), False),
        (Vector3D(x=5, y=10, z=2), (100, 60, 15), (110, 50, 8), False),
    ],
)
def test_is_fully_contained_parametrized(
    origin: Vector3D,
    boundary_dims: tuple[float, float, float],
    resident_dims: tuple[float, float, float],
    expected: bool,
) -> None:
    """Test that a resident labware fits inside a containedSpace boundary."""
    boundary = ContainedSpace(
        shape=ContainmentShape.rectangular,
        origin=origin,
        dimensions=LabwareDimensions(
            xDimension=boundary_dims[0],
            yDimension=boundary_dims[1],
            zDimension=boundary_dims[2],
        ),
    )

    resident_def = _MOCK_LABWARE_DEFINITION2.model_copy(
        update={
            "dimensions": LabwareDimensions(
                xDimension=resident_dims[0],
                yDimension=resident_dims[1],
                zDimension=resident_dims[2],
            )
        }
    )

    assert is_fully_contained(resident_def, boundary) is expected


def test_is_fully_contained_fits_exactly() -> None:
    """Resident exactly matches the contained space → should return True."""
    boundary = ContainedSpace(
        shape=ContainmentShape.rectangular,
        origin=Vector3D(x=0.0, y=0.0, z=0.0),
        dimensions=LabwareDimensions(
            xDimension=100.0, yDimension=60.0, zDimension=15.0
        ),
    )

    resident_def = _MOCK_LABWARE_DEFINITION2.model_copy(
        update={
            "dimensions": LabwareDimensions(
                xDimension=100.0, yDimension=60.0, zDimension=15.0
            )
        }
    )

    assert is_fully_contained(resident_def, boundary)


def test_is_fully_contained_fits_with_margin() -> None:
    """Resident smaller than the contained space (with non-zero origin) should pass."""
    boundary = ContainedSpace(
        shape=ContainmentShape.rectangular,
        origin=Vector3D(x=5.0, y=10.0, z=2.0),
        dimensions=LabwareDimensions(
            xDimension=100.0, yDimension=60.0, zDimension=15.0
        ),
    )

    resident_def = _MOCK_LABWARE_DEFINITION2.model_copy(
        update={
            "dimensions": LabwareDimensions(
                xDimension=95.0, yDimension=50.0, zDimension=8.0
            )
        }
    )

    assert is_fully_contained(resident_def, boundary)


@pytest.mark.parametrize(
    "exceed_dim",
    [
        pytest.param("x", id="exceeds_x"),
        pytest.param("y", id="exceeds_y"),
        pytest.param("z", id="exceeds_z"),
    ],
)
def test_is_fully_contained_fails_when_exceeding_boundary(exceed_dim: str) -> None:
    """Any dimension exceeding the boundary should return False."""
    boundary = ContainedSpace(
        shape=ContainmentShape.rectangular,
        origin=Vector3D(x=0, y=0, z=0),
        dimensions=LabwareDimensions(xDimension=80, yDimension=50, zDimension=12),
    )

    resident = _MOCK_LABWARE_DEFINITION2.model_copy()

    if exceed_dim == "x":
        resident.dimensions.xDimension = 85.0
    elif exceed_dim == "y":
        resident.dimensions.yDimension = 55.0
    else:  # z
        resident.dimensions.zDimension = 15.0

    assert not is_fully_contained(resident, boundary)


def test_is_fully_contained_schema_v3_passthrough() -> None:
    """LabwareDefinition3 should currently bypass detailed check."""
    boundary = ContainedSpace(
        shape=ContainmentShape.rectangular,
        origin=Vector3D(x=0, y=0, z=0),
        dimensions=LabwareDimensions(xDimension=50, yDimension=50, zDimension=10),
    )

    # Any V3 definition should return True for now
    assert is_fully_contained(_MOCK_LABWARE_DEFINITION3, boundary)


def test_is_fully_contained_edge_case_zero_dimensions() -> None:
    """Zero-sized contained space or resident should be handled gracefully (usually False)."""
    boundary = ContainedSpace(
        shape=ContainmentShape.rectangular,
        origin=Vector3D(x=0, y=0, z=0),
        dimensions=LabwareDimensions(xDimension=0, yDimension=0, zDimension=0),
    )

    resident = _MOCK_LABWARE_DEFINITION2.model_copy()
    assert not is_fully_contained(resident, boundary)
