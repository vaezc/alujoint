import json, os
s2cat={}
for l in open('serials.jsonl'):
    try:
        r=json.loads(l)
        for s in r.get('serials',[]):
            s2cat[s]={'group':r['title'],'category':r['category']}
    except: pass
ok={}
for l in open('all_ok.jsonl'):
    try:
        r=json.loads(l); ok[r['serial']]=r
    except: pass

def kind_of(cat, code):
    if code in ('T01',): return 'profile'
    if cat and ('型材' in cat and '配件' not in cat and '紧固' not in cat): return 'profile'
    if cat and ('紧固' in cat or '连接' in cat or '支脚' in cat or '装饰' in cat or '封板' in cat): return 'connector'
    return 'accessory'

items=[]
for l in open('glb_meta.jsonl'):
    r=json.loads(l)
    if r.get('err'): continue
    s=r['serial']; c=s2cat.get(s,{}); o=ok.get(s,{}) or {}
    catname=c.get('category','未分类')
    items.append({
        'id': s,
        'code': r['serialCode'],
        'model': r['productModel'],
        'group': c.get('group',''),
        'category': catname,
        'kind': kind_of(catname, o.get('category')),
        'glb': '/models/' + os.path.basename(r['glb']),
        'bboxMm': r.get('bboxMm'),
        'meshes': r.get('meshes'),
        'bytes': r.get('glbBytes'),
    })
items.sort(key=lambda x:(x['category'],x['code'],x['model']))
out={'generatedAt':'2026-11-17','count':len(items),'items':items}
os.makedirs('/home/vae/person/alujoint/public/data',exist_ok=True)
json.dump(out, open('/home/vae/person/alujoint/public/data/catalog.generated.json','w'), ensure_ascii=False, separators=(',',':'))
from collections import Counter
print('items',len(items))
print('by kind',dict(Counter(i['kind'] for i in items)))
print('by category',dict(Counter(i['category'] for i in items)))
print('json bytes', os.path.getsize('/home/vae/person/alujoint/public/data/catalog.generated.json'))
