import copy
import json
from fractions import Fraction
from pathlib import Path
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
import fairness_lab as m


class FairnessLabTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture=m.read_scenario(ROOT/'scenario.json')
        cls.lab=m.compile_lab(cls.fixture)

    def policy(self,budget,name):
        return next(x['metrics'] for x in self.lab['entries']
                    if x['budget']==budget and x['policy']==name)

    def test_source_is_frozen_and_nonauthoritative(self):
        self.assertTrue(m.validate(self.fixture))
        self.assertEqual(self.lab['environment'],'SYNTHETIC_ONLY')
        self.assertEqual(self.lab['source006']['source_dogram_pin'],m.PIN)
        self.assertFalse(self.lab['review']['canCommitResources'])
        self.assertEqual(self.lab['review']['physicalUnitsMoved'],0)
        self.assertFalse(self.lab['review']['publicPartnerClaims'])

    def test_all_16_policy_budget_pairs(self):
        self.assertEqual(len(self.lab['entries']),16)
        self.assertEqual(len({(r['budget'],r['policy']) for r in self.lab['entries']}),16)
        self.assertEqual(self.lab['originalDogramWitness']['status'],'NOT_RUN')
        self.assertEqual(set(self.lab['policies']),set(m.POLICIES))

    def test_finite_exhaustive_choices_do_not_over_allocate(self):
        for budget in m.BUDGETS:
            candidates=m.outcomes(budget)
            self.assertGreater(len(candidates),0)
            for x in candidates:
                self.assertTrue(all(0<=n<=c for n,c in zip(x,m.CAPS)))
                self.assertEqual(sum(x),min(budget,sum(m.CAPS)))
            for policy in m.POLICIES:
                row=self.policy(budget,policy)
                self.assertEqual(row['allocated_total'],min(budget,sum(m.CAPS)))
                self.assertEqual(row['unused'],max(0,budget-sum(m.CAPS)))

    def test_four_policies_have_four_distinct_budget7_results(self):
        expected={
            'coverage_first':{'nourish':4,'winter':2,'table':1},
            'max_min_first':{'nourish':3,'winter':2,'table':2},
            'provisional_commitments_first':{'nourish':4,'winter':3,'table':0},
            'proportional_fit_first':{'nourish':3,'winter':3,'table':1}
        }
        self.assertEqual({name:self.policy(7,name)['allocation']
                          for name in m.POLICIES},expected)

    def test_coverage_prefers_all_three_buckets_but_can_break_a_provisional_commitment(self):
        row=self.policy(7,'coverage_first')
        self.assertEqual(row['coverage_count'],3)
        self.assertEqual(row['total_commitment_shortfall'],1)
        self.assertEqual(row['provisional_commitment_shortfalls']['winter'],1)

    def test_max_min_exposes_minimum_service_tradeoff(self):
        row=self.policy(7,'max_min_first')
        self.assertEqual(row['minimum_access'],2)
        self.assertEqual(row['total_commitment_shortfall'],2)
        self.assertEqual(row['coverage_count'],3)
        self.assertEqual(self.policy(7,'provisional_commitments_first')['minimum_access'],0)

    def test_provisional_commitment_floor_is_not_a_verified_obligation(self):
        row=self.policy(7,'provisional_commitments_first')
        self.assertEqual(row['total_commitment_shortfall'],0)
        self.assertEqual(row['zero_groups'],['table'])
        self.assertEqual(row['provisional_commitments_satisfied'],3)
        self.assertTrue(self.fixture['assumptions']['commitments_simulated_not_real'])

    def test_proportional_fit_is_exact_rational_not_fake_float(self):
        row=self.policy(7,'proportional_fit_first')
        self.assertEqual(row['exact_ideals'],{'nourish':'7/2','winter':'14/5','table':'7/10'})
        self.assertEqual(row['exact_residuals'],{'nourish':'-1/2','winter':'1/5','table':'3/10'})
        self.assertEqual(row['exact_absolute_deviation'],'1')
        self.assertEqual(row['signed_residual_sum'],'0')

    def test_budget10_exposes_physical_capacity_shortfall(self):
        for name in m.POLICIES:
            row=self.policy(10,name)
            self.assertEqual(row['allocation'],{'nourish':4,'winter':3,'table':2})
            self.assertEqual(row['allocated_total'],9)
            self.assertEqual(row['unused'],1)
            self.assertEqual(row['signed_residual_sum'],'-1')
        self.assertEqual(sum(m.CAPS),9)

    def test_parent_006_unconstrained_rounding_cannot_be_admitted_as_feasible(self):
        parent=self.lab['parent006Benchmark']
        assert len(parent)==8
        rejected=[x for x in parent if not x['feasible_under_007_caps']]
        self.assertEqual({(x['budget'],x['method']) for x in rejected},{
            (8,'declared_order_remainder'),
            (9,'largest_fractional_remainder'),(9,'declared_order_remainder'),
            (10,'largest_fractional_remainder'),(10,'declared_order_remainder')
        })
        self.assertEqual(next(x for x in rejected if x['budget']==8)['over_capacity_groups'],['nourish'])

    def test_two_collapses_have_different_information_loss(self):
        loss=self.lab['informationLoss']
        self.assertEqual(loss['states'],16)
        self.assertEqual(loss['distribution_pairs_masked_by_budget_total'],9)
        self.assertEqual(loss['details_total_only_pairs_masked'],25)
        self.assertGreater(loss['details_total_only_pairs_masked'],loss['distribution_pairs_masked_by_budget_total'])
        self.assertEqual(loss['measures'],'REPRESENTATIONAL_INFORMATION_LOSS_NOT_MORAL_IMPORTANCE')

    def test_cannot_invent_a_real_world_scenario(self):
        for path,value in [
            (['environment'],'LIVE'),
            (['resource','actual_inventory'],True),
            (['assumptions','participants_enrolled'],1),
            (['assumptions','authority'],'DISPATCH'),
            (['assumptions','commitments_simulated_not_real'],False),
            (['source','source_dogram_pin'],'main'),
            (['budgets'],[7,8,9]),
            (['policies'],['coverage_first']),
            (['groups',0,'weight'],True),
            (['groups',0,'max_capacity'],500),
            (['groups',0,'provisional_commitment'],9),
        ]:
            mutated=copy.deepcopy(self.fixture)
            cur=mutated
            for k in path[:-1]: cur=cur[k]
            cur[path[-1]]=value
            with self.subTest(path=path),self.assertRaises(ValueError):m.compile_lab(mutated)

    def test_fails_unknown_budget_or_policy_or_impossible_allocation(self):
        with self.assertRaises(ValueError):m.outcomes(True)
        with self.assertRaises(ValueError):m.outcomes(100)
        with self.assertRaises(ValueError):m.pick(7,'secret_automated_dispatch')
        with self.assertRaises(ValueError):m.measurements((5,2,0),7)
        with self.assertRaises(ValueError):m.measurements((4,3,2),7)
        with self.assertRaises(ValueError):m.measurements((True,3,0),7)

    def test_determinism_and_source_sha(self):
        before=json.dumps(self.fixture,sort_keys=True)
        other=m.compile_lab(self.fixture)
        self.assertEqual(other,self.lab)
        self.assertEqual(json.dumps(self.fixture,sort_keys=True),before)
        self.assertTrue(self.lab['sourceFingerprint'].startswith('sha256:'))
        self.assertEqual(len(self.lab['sourceFingerprint']),71)

    def test_original_dogram_not_falsely_claimed_without_checkout(self):
        status=m.dogram_native_optional(None)
        self.assertEqual(status['status'],'NOT_RUN')
        self.assertEqual(self.lab['originalDogramWitness']['status'],'NOT_RUN')


if __name__=='__main__':unittest.main()
