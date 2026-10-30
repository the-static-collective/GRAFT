import json
from pathlib import Path
import sys
import unittest
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root))
from fairness_lab import compile_lab,read_scenario
from make_review_packet import build

class ReviewPacketTest(unittest.TestCase):
    def test_read_only_review_candidate_not_a_live_task(self):
        report=compile_lab(read_scenario(root/'scenario.json'))
        proposal=build(report)
        self.assertEqual(proposal['state'],'HOLD_FOR_HUMAN_STEWARDS')
        self.assertEqual(len(proposal['evidence']['policyDistributionDifferences']),4)
        self.assertEqual(proposal['evidence']['informationLoss']['sameBudgetTotalPairs'],9)
        self.assertFalse(proposal['evidence']['originalDogramActuallyRun'])
        for forbidden in ('canWriteToJarvis','canDeploy','canContactParticipants','canDistribute'):
            self.assertFalse(proposal[forbidden])
        self.assertEqual(proposal['actualAllocations'],0)
        self.assertEqual(proposal['actualParticipants'],0)

    def test_rejects_any_report_claiming_real_dispatch(self):
        report=compile_lab(read_scenario(root/'scenario.json'))
        report['review']['canCommitResources']=True
        with self.assertRaises(ValueError):build(report)
        report['review']['canCommitResources']=False
        report['review']['physicalUnitsMoved']=1
        with self.assertRaises(ValueError):build(report)

if __name__=='__main__':unittest.main()
