"""Build fully offline browser from a precomputed, inert 007 report."""
import json
from pathlib import Path
from fairness_lab import require
root=Path(__file__).parent
r=json.loads((root/'report.json').read_text())
require(r['schema']=='unfutures.fairness-lab-007/v0' and r['environment']=='SYNTHETIC_ONLY' and
        r['review']['canCommitResources'] is False and r['review']['physicalUnitsMoved']==0,
        'non-synthetic presentation refused')
serialized=json.dumps(r,ensure_ascii=True,sort_keys=True,separators=(',',':')).replace('<','\\u003c')
content=(root/'dashboard.template.html').read_text()
require(content.count('__EMBEDDED_REPORT_JSON__')==1,'missing/ambiguous payload slot')
(root/'index.html').write_text(content.replace('__EMBEDDED_REPORT_JSON__',serialized),encoding='utf-8')
print('Offline index.html created with '+str(len(r['entries']))+' synthetic calculations. Dogram: '+r['originalDogramWitness']['status'])
