"""Read-only experimental JAR;VIS-style review packet, NOT a native connector."""
from pathlib import Path
import json
import sys
from fairness_lab import canonical, require


def build(report):
    require(report.get('schema')=='unfutures.fairness-lab-007/v0' and
            report.get('environment')=='SYNTHETIC_ONLY' and
            report.get('review',{}).get('canCommitResources') is False and
            report.get('review',{}).get('physicalUnitsMoved')==0,
            'refuse any authoritative resource report')
    cases=[r for r in report['entries'] if r['budget']==7]
    return {
        'schema':'jarvis.attention-candidate.unfutures-007/v0',
        'state':'HOLD_FOR_HUMAN_STEWARDS',
        'origin':'GRAFT_OFFLINE_SYNTHETIC_SPECIMEN',
        'sourceFingerprint':report['sourceFingerprint'],
        'question':'Which explicit policy criteria would affected stewards actually authorize, after actual resources and obligations are verified?',
        'evidence':{
            'policyDistributionDifferences':[
                {'policy':r['policy'],
                 'proposedAllocation':r['metrics']['allocation'],
                 'provisionalShortfall':r['metrics']['total_commitment_shortfall'],
                 'zeroBins':r['metrics']['zero_groups']}
                for r in cases
            ],
            'informationLoss':{
                'sameBudgetTotalPairs':report['informationLoss']['distribution_pairs_masked_by_budget_total'],
                'totalOnlyPairs':report['informationLoss']['details_total_only_pairs_masked']
            },
            'originalDogramActuallyRun':report['originalDogramWitness']['status']=='PIN_VERIFIED_NATIVE_RESEARCH'
        },
        'missingActualEvidence':list(report['review']['criteria']),
        'nextHumanGate':'SOURCE_OWNER_AND_AFFECTED_PROGRAM_REVIEW',
        'canWriteToJarvis':False,
        'canDeploy':False,
        'canContactParticipants':False,
        'canDistribute':False,
        'actualParticipants':0,
        'actualAllocations':0,
        'interpretationAuthority':'NONE'
    }


def main():
    src=Path(sys.argv[1] if len(sys.argv)>1 else 'report.json')
    target=Path(sys.argv[2] if len(sys.argv)>2 else 'held-jarvis-review.json')
    require(src.is_file() and src.stat().st_size<200000,'invalid report path or oversized input')
    target.write_bytes(canonical(build(json.loads(src.read_text(encoding='utf-8'))))+b'\n')
    print('Created held, non-dispatchable synthetic review packet')


if __name__=='__main__':main()
