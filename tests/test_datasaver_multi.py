import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../skill-datasaver-multi')))
from main import DataSaverMulti

def test_persistencia_basica():
    ds = DataSaverMulti()
    try:
        ds.put_object('testbucket', 'testkey', b'hello world')
        assert ds.get_object('testbucket', 'testkey') == b'hello world'
        assert 'testkey' in ds.list_objects('testbucket')
        ds.delete_object('testbucket', 'testkey')
        assert 'testkey' not in ds.list_objects('testbucket')
    finally:
        ds.close()

def test_overwrite():
    ds = DataSaverMulti()
    try:
        ds.put_object('bucket', 'key', b'v1')
        ds.put_object('bucket', 'key', b'v2')
        assert ds.get_object('bucket', 'key') == b'v2'
        ds.delete_object('bucket', 'key')
    finally:
        ds.close()

def test_multiple_buckets():
    ds = DataSaverMulti()
    try:
        ds.put_object('b1', 'k1', b'd1')
        ds.put_object('b2', 'k2', b'd2')
        assert ds.get_object('b1', 'k1') == b'd1'
        assert ds.get_object('b2', 'k2') == b'd2'
        ds.delete_object('b1', 'k1')
        ds.delete_object('b2', 'k2')
    finally:
        ds.close()

def test_not_found():
    ds = DataSaverMulti()
    try:
        with pytest.raises(FileNotFoundError):
            ds.get_object('no_bucket', 'no_key')
    finally:
        ds.close()
