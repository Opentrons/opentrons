import pytest
import numpy as np

from opentrons.trackers.pose_tracker import PoseTracker, Pose


def empty_pose_tracker():
    return PoseTracker()


def single_root_pose_tracker():
    '''
    'root'
        'child1'
            'child3'
                'child6'
            'child4'
        'child2'
            'child5'
        'child7'
        'child8'
        'child9'
    '''
    pt = PoseTracker()
    root = 'root'
    pt.create_root_object(root, 0, 0, 0) # global_position: 0, 0, 0
    pt.track_object(root, 'child1', 1, 5, 2) # global_position: 1, 5, 2
    pt.track_object(root, 'child2', 0, 2, -4) # global_position: 0, 2, -4
    pt.track_object('child1', 'child3', 3, 1, 6) # global_position: 4, 6, 8
    pt.track_object('child1', 'child4', 10, 9, 2) # global_position: 11, 14, 4
    pt.track_object('child2', 'child5', 13, -2, 0) # global_position: 13, 0, -4
    pt.track_object('child3', 'child6', 12, 20, 41) # global_position: 16, 26, 49
    pt.track_object(root, 'child7', -10, 12, 14) # global_position: -10, 12, 14
    pt.track_object(root, 'child8', 1, -2, -4) # global_position: 1, -2, -4
    pt.track_object(root, 'child9', 0, 0, 0) # global_position: 0, 0, 0

    correct_positions = {
        'child2': [ 0.,  2., -4.],
        'child3': [ 4.,  6.,  8.],
        'child7': [-10.,  12.,  14.],
        'child9': [ 0.,  0.,  0.],
        'child6': [ 16.,  26.,  49.],
        'child1': [ 1.,  5.,  2.],
        'child5': [ 13.,   0.,  -4.],
        'root': [ 0.,  0.,  0.],
        'child4': [ 11.,  14.,   4.],
        'child8': [ 1., -2., -4.]
        }

    return (pt, correct_positions)


def dual_root_pose_tracker():
    '''
    'root1'
        'child1'
            'child3'
        'child8'


    'root2'
        'child2'
            'child4'
            'child5'
                'child6'
        'child7'
            'child9'
    '''
    pose_tracker = PoseTracker()

    pose_tracker.create_root_object('root1', 0, 0, 0) # global_position: 0, 0, 0
    pose_tracker.create_root_object('root2', 1, 1, 1) # global_position: 1, 1, 1

    pose_tracker.track_object('root1', 'child1', 1, 5, 2) # global_position: 1, 5, 2
    pose_tracker.track_object('root2', 'child2', 0, 2, -4) # global_position: 1, 3, -3
    pose_tracker.track_object('child1', 'child3', 3, 1, 6) # global_position: 4, 6, 8
    pose_tracker.track_object('child2', 'child4', 10, 9, 2) # global_position: 11, 12, -1
    pose_tracker.track_object('child2', 'child5', 13, -2, 0) # global_position: 14, 1, -3
    pose_tracker.track_object('child5', 'child6', -10, 20, 29) # global_position: 4, 21, 26
    pose_tracker.track_object('root2', 'child7', -10, 12, 14) # global_position: -9, 13, 15
    pose_tracker.track_object('root1', 'child8', 1, -2, -4) # global_position: 1, -2, -4
    pose_tracker.track_object('child7', 'child9', 0, 0, 0) # global_position: 0, 0, 0

    correct_positions = {
        'root1': [0., 0., 0.],
        'child3': [4., 6., 8.],
        'child7': [-9., 13., 15.],
        'child2': [1., 3., -3.],
        'child1': [1., 5., 2.],
        'child6': [4., 21., 26.],
        'root2': [1., 1., 1.],
        'child9': [-9., 13., 15.],
        'child4': [11., 12., -1.],
        'child5': [14., 1., -3.],
        'child8': [1., -2., -4.]
    }

    return (pose_tracker, correct_positions)


def test_init():
    pose_tracker = PoseTracker()

    assert pose_tracker._root_nodes == []
    assert pose_tracker._pose_dict == {}
    assert pose_tracker._node_dict == {}


@pytest.mark.parametrize("key, rel_x, rel_y, rel_z", [
    ('example_key', 1, 2, 3),
    (1, 4, 8, 10),
    ('another_key', -6, 12, 30),
    (True, 10, 200, -3),
    ('True', 0, 0, 0)
])
def test_add_root_object(key, rel_x, rel_y, rel_z):
    pose_tracker = PoseTracker()
    pose_tracker.create_root_object(obj=key, x=rel_x, y=rel_y, z=rel_z)
    node = pose_tracker._node_dict[key]

    assert node in pose_tracker._root_nodes
    assert key in pose_tracker._node_dict
    assert key in pose_tracker._pose_dict

    assert pose_tracker.relative(key) == Pose(rel_x, rel_y, rel_z)
    assert pose_tracker.absolute(key) == Pose(rel_x, rel_y, rel_z)
    assert pose_tracker.absolute(key) == pose_tracker.relative(key)

    assert pose_tracker[key] == Pose(rel_x, rel_y, rel_z)


@pytest.mark.parametrize("pose_tracker, subtree_root, expected_max", [
    (single_root_pose_tracker()[0], 'root', 49),
    (single_root_pose_tracker()[0], 'child2', -4),
    (dual_root_pose_tracker()[0], 'root2', 26),
    (dual_root_pose_tracker()[0], 'root1', 8),
    (dual_root_pose_tracker()[0], 'child7', 15)

])
def test_max_z_in_subtree(pose_tracker, subtree_root, expected_max):
    assert pose_tracker.max_z_in_subtree(subtree_root) == expected_max


@pytest.mark.parametrize("pose_tracker, correct_position_dict", [
    single_root_pose_tracker(),
    dual_root_pose_tracker()
])
def test_absolute_position(pose_tracker, correct_position_dict):
    for key in correct_position_dict:
        assert key in pose_tracker._node_dict
        assert (pose_tracker[key].position == correct_position_dict[key]).all()
        assert (pose_tracker.absolute(key).position == correct_position_dict[key]).all()


@pytest.mark.parametrize("pose_tracker, key, descendants", [
    (single_root_pose_tracker()[0], 'child4', []),
    (single_root_pose_tracker()[0], 'child1', ['child3', 'child6', 'child4']),
    (dual_root_pose_tracker()[0], 'root1', ['child1', 'child3', 'child8']),
    (dual_root_pose_tracker()[0], 'child2', ['child4', 'child5', 'child6']),
    (dual_root_pose_tracker()[0], 'child9', []),
])
def test_get_objects_in_subtree(pose_tracker, key, descendants):
    subtree = pose_tracker.get_objects_in_subtree(key)
    expected_subtree = descendants + [key]
    assert len(set(subtree)) == len(descendants + [key])
    assert set(subtree) == set(expected_subtree)


@pytest.mark.parametrize("pose_tracker, correct_position_dict, object_to_translate, translation", [
    (single_root_pose_tracker()[0], single_root_pose_tracker()[1], 'root', {'x':1, 'y':2, 'z':3}),
    (single_root_pose_tracker()[0], single_root_pose_tracker()[1], 'child1', {'x':-1, 'y':-3, 'z':0}),
    (single_root_pose_tracker()[0], single_root_pose_tracker()[1], 'child5', {'x':1, 'y':2, 'z':3}),
    (dual_root_pose_tracker()[0], dual_root_pose_tracker()[1], 'root1', {'x':0, 'y':0, 'z':0}),
    (dual_root_pose_tracker()[0], dual_root_pose_tracker()[1], 'child7', {'x':-10, 'y':0, 'z':0}),
    (dual_root_pose_tracker()[0], dual_root_pose_tracker()[1], 'root2', {'x':11, 'y':29, 'z':3})
])
def test_translate_object(pose_tracker, correct_position_dict, object_to_translate, translation):
    subtree = pose_tracker.get_objects_in_subtree(object_to_translate)
    pose_tracker.translate_object(object_to_translate, **translation)

    for tracked_object in subtree:
        old_pose = Pose(*correct_position_dict[tracked_object])
        expected_new_pose = old_pose * Pose(**translation)
        expected_new_position = expected_new_pose.position
        assert pose_tracker.absolute(tracked_object) == expected_new_pose
        assert (pose_tracker.absolute(tracked_object).position == expected_new_position).all()


@pytest.mark.parametrize("pose_tracker", [
    (single_root_pose_tracker()[0]),
    (dual_root_pose_tracker()[0])
])
def test_clear_all(pose_tracker):
    assert not pose_tracker._root_nodes == []
    assert not pose_tracker._pose_dict == {}
    assert not pose_tracker._node_dict == {}

    pose_tracker.clear_all()

    assert pose_tracker._root_nodes == []
    assert pose_tracker._pose_dict == {}
    assert pose_tracker._node_dict == {}


