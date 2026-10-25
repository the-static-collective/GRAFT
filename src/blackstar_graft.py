"""GRAFT synthetic Ghost Cut candidate; not a transfer of private Black Star records."""
from datetime import datetime

VALID_AUTHORITY = {'projection_only', 'residue_only', 'proposed', 'held', 'admitted', 'refused'}


def _when(value, label, errors):
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        if dt.tzinfo is None or dt.utcoffset() is None:
            raise ValueError('timezone required')
        return dt
    except (AttributeError, TypeError, ValueError):
        errors.append(f'{label}: valid timezone-aware timestamp required')
        return None


def validate_cut(cut):
    """Validate an observer's knowledge horizon; no truth or credibility score."""
    errors = []
    if not isinstance(cut, dict):
        return {'ok': False, 'errors': ['cut must be an object']}
    for field in ('cut_id', 'observer', 'focus'):
        if not isinstance(cut.get(field), str) or not cut[field].strip():
            errors.append(f'{field}: non-empty string required')
    horizon = _when(cut.get('knowledge_horizon'), 'knowledge_horizon', errors)
    if cut.get('authority') not in VALID_AUTHORITY:
        errors.append('authority: unsupported status')
    carriers = cut.get('carriers')
    if not isinstance(carriers, list):
        errors.append('carriers: explicit list required')
        carriers = []
    seen = set()
    for i, c in enumerate(carriers):
        if not isinstance(c, dict):
            errors.append(f'carriers[{i}]: object required')
            continue
        cid = c.get('carrier_id')
        if not isinstance(cid, str) or not cid:
            errors.append(f'carriers[{i}].carrier_id: required')
        elif cid in seen:
            errors.append(f'carriers[{i}]: duplicate carrier_id')
        else:
            seen.add(cid)
        stamp = _when(c.get('discovered_at'), f'carriers[{i}].discovered_at', errors)
        if horizon and stamp and stamp > horizon:
            errors.append(f'carriers[{i}]: discovered after horizon; use a descendant cut')
        if c.get('contact') is True and not c.get('source_ref'):
            errors.append(f'carriers[{i}]: contact requires source_ref')
    for f in ('withheld', 'fog', 'counterpressure'):
        if not isinstance(cut.get(f), list):
            errors.append(f'{f}: explicit list required')
    if cut.get('projection') and not cut.get('counterpressure'):
        errors.append('projection requires counterpressure')
    if cut.get('authority') == 'admitted' and not cut.get('gate_receipt'):
        errors.append('admitted authority requires gate_receipt')
    return {'ok': not errors, 'errors': errors, 'carrier_count': len(carriers),
            'authority': 'validation_only'}


def observer_delta(before, after):
    """Compare valid cuts without claiming new knowledge existed in the older cut."""
    for label, cut in (('before', before), ('after', after)):
        checked = validate_cut(cut)
        if not checked['ok']:
            raise ValueError(f'{label} cut invalid: {checked["errors"]}')
    if before['observer'] != after['observer']:
        raise ValueError('observer identity differs')
    if datetime.fromisoformat(after['knowledge_horizon'].replace('Z', '+00:00')) < datetime.fromisoformat(before['knowledge_horizon'].replace('Z', '+00:00')):
        raise ValueError('later cut precedes earlier horizon')
    first = {c['carrier_id'] for c in before['carriers']}
    second = {c['carrier_id'] for c in after['carriers']}
    return {'schema': 'graft.blackstar.delta/v0', 'from_cut': before['cut_id'],
            'to_cut': after['cut_id'], 'new_in_cut': sorted(second - first),
            'absent_in_new_cut': sorted(first - second),
            'retrospective_authority': 'none', 'finding': 'change_only'}


def validate_activation(a):
    """Guard the birthday of a new relation; later reading cannot rewrite contact."""
    errors = []
    if not isinstance(a, dict):
        return {'ok': False, 'errors': ['activation must be an object']}
    for f in ('activation_id', 'old_trace', 'new_trigger'):
        if not isinstance(a.get(f), str) or not a[f].strip():
            errors.append(f'{f}: required')
    original = _when(a.get('original_contact_at'), 'original_contact_at', errors)
    trigger = _when(a.get('new_trigger_at'), 'new_trigger_at', errors)
    birthday = _when(a.get('relation_birthday'), 'relation_birthday', errors)
    if birthday and trigger and birthday < trigger:
        errors.append('relation_birthday precedes new trigger')
    if birthday and original and birthday < original:
        errors.append('relation_birthday precedes original contact')
    if a.get('gate_route') not in ('hold', 'pending', 'admit', 'refuse'):
        errors.append('gate_route: unsupported')
    if not isinstance(a.get('counterpressure'), list) or not a['counterpressure']:
        errors.append('counterpressure must be non-empty')
    if not isinstance(a.get('source_refs'), list) or not a['source_refs']:
        errors.append('source_refs must be non-empty')
    if len(str(a.get('no_retcon_note', '')).strip()) < 20:
        errors.append('no_retcon_note must explain the historical boundary')
    return {'ok': not errors, 'errors': errors, 'authority': 'validation_only'}
