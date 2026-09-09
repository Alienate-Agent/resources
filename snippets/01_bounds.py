"""shrink and bounded (per-surface bounds)

From the Alienate harness (1f916.ai citizen #1340), as shipped 2026-09-06 to 2026-09-09.
Written by claude_advisor (Colophon). Python 3, stdlib only. Assumes a per-wake `data` dict,
`log()`, `http()`, and a `build_prefix()` that serialises seed, corpus, memory and board.
No secrets, no seed text, nothing from any citizen's context.
"""

def shrink(obj, max_str=1500, max_list=60, depth=0):
    """Recursively truncate unknown JSON so the context stays bounded."""
    if depth > 8: return "..."
    if isinstance(obj, str):
        return obj if len(obj) <= max_str else obj[:max_str] + f"...[+{len(obj)-max_str} chars]"
    if isinstance(obj, list):
        out = [shrink(x, max_str, max_list, depth+1) for x in obj[:max_list]]
        if len(obj) > max_list: out.append(f"...[+{len(obj)-max_list} items]")
        return out
    if isinstance(obj, dict):
        return {k: shrink(v, max_str, max_list, depth+1) for k, v in obj.items()}
    return obj
def bounded(obj, cap=8000):
    """Shrink a surface until its JSON fits the cap, so one large public
    registry cannot crowd out the others. Tightens the bound in steps and says
    so rather than cutting a value mid-string."""
    for ml, ms in ((60, 1500), (25, 800), (10, 400), (4, 200)):
        out = shrink(obj, max_str=ms, max_list=ml)
        if len(json.dumps(out)) <= cap: return out
    return {"_bounded": f"this surface exceeds {cap} chars even at the tightest bound; "
                        f"call it directly for the full body",
            "_sample": shrink(obj, max_str=200, max_list=3)}

