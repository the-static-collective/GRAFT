import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from blackstar_graft import validate_cut, validate_activation, observer_delta


def cut(cut_id='a', horizon='2026-01-02T00:00:00Z'):
    return {'cut_id': cut_id, 'observer': 'synthetic-observer', 'focus': 'fixture',
            'knowledge_horizon': horizon, 'carriers': [{'carrier_id': 'page-1',
            'discovered_at': '2026-01-01T00:00:00Z', 'source_ref': 'synthetic/page-1',
            'contact': True}], 'withheld': [], 'fog': [], 'counterpressure': [],
            'projection': None, 'authority': 'projection_only'}


class BlackStarGraftTest(unittest.TestCase):
    def test_valid_synthetic_cut(self):
        self.assertTrue(validate_cut(cut())['ok'])

    def test_no_hindsight_in_old_cut(self):
        item = cut()
        item['carriers'].append({'carrier_id': 'page-2',
                                 'discovered_at': '2026-01-03T00:00:00Z',
                                 'source_ref': 'synthetic/page-2', 'contact': True})
        self.assertFalse(validate_cut(item)['ok'])

    def test_no_admission_without_gate(self):
        item = cut()
        item['authority'] = 'admitted'
        self.assertFalse(validate_cut(item)['ok'])

    def test_delta_is_new_occurrence_not_retroactive_knowledge(self):
        old = cut()
        old_clone = copy.deepcopy(old)
        new = cut('b', '2026-01-04T00:00:00Z')
        new['carriers'].append({'carrier_id': 'page-2',
                                'discovered_at': '2026-01-03T00:00:00Z',
                                'source_ref': 'synthetic/page-2', 'contact': False})
        diff = observer_delta(old, new)
        self.assertEqual(diff['new_in_cut'], ['page-2'])
        self.assertEqual(diff['retrospective_authority'], 'none')
        self.assertEqual(old, old_clone)

    def test_activation_requires_new_relation_birthday(self):
        a = {'activation_id': 'act-1', 'old_trace': 'trace-1', 'new_trigger': 'later-review',
             'original_contact_at': '2026-01-01T00:00:00Z',
             'new_trigger_at': '2026-01-04T00:00:00Z',
             'relation_birthday': '2026-01-02T00:00:00Z',
             'gate_route': 'hold', 'counterpressure': ['synthetic alternative'],
             'source_refs': ['synthetic/page-1'],
             'no_retcon_note': 'Later interpretation cannot change earlier source access.'}
        self.assertFalse(validate_activation(a)['ok'])
        a['relation_birthday'] = '2026-01-04T00:00:00Z'
        self.assertTrue(validate_activation(a)['ok'])

    def test_no_local_timezone_guess(self):
        item = cut(horizon='2026-01-02T00:00:00')
        self.assertFalse(validate_cut(item)['ok'])


if __name__ == '__main__':
    unittest.main()
