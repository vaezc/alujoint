import re, json, time, urllib.request

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
seen_cat = set()
lists = {}
cats = []

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "ignore")

def parse_category(html):
    subcats, listurls = [], []
    for b in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, flags=re.S):
        try:
            d = json.loads(b)
        except Exception:
            continue
        for n in d.get("@graph", []):
            if n.get("@type") == "ItemList":
                for e in n.get("itemListElement", []):
                    it = e.get("item", {})
                    cid = it.get("@id", "")
                    m = re.search(r'/category/(\d+)\.html', cid)
                    if m and it.get("name"):
                        subcats.append((m.group(1), it.get("name")))
    for m in re.finditer(r'/list/(\d+)\.html', html):
        listurls.append(m.group(1))
    # list titles from <a ... href="/list/ID.html" ...>TITLE</a>
    titles = {}
    for m in re.finditer(r'href="[^"]*/list/(\d+)\.html"[^>]*>(.*?)</a>', html, flags=re.S):
        lid = m.group(1)
        txt = re.sub(r'<[^>]+>', '', m.group(2)).strip()
        if txt and lid not in titles:
            titles[lid] = txt
    return subcats, list(set(listurls)), titles

def crawl(cid, name, depth=0):
    if cid in seen_cat or depth > 4:
        return
    seen_cat.add(cid)
    url = f"https://www.jlcfa.com/category/{cid}.html"
    try:
        html = fetch(url)
    except Exception as e:
        print("ERR", cid, name, e)
        return
    sub, ls, titles = parse_category(html)
    cats.append({"id": cid, "name": name, "depth": depth, "lists": len(ls), "subcats": len(sub)})
    for lid in ls:
        if lid not in lists:
            lists[lid] = {"id": lid, "title": titles.get(lid, ""), "category": name, "cid": cid}
    print(f"{'  '*depth}[{name}] lists={len(ls)} subcats={len(sub)}")
    time.sleep(0.8)
    for sc, sname in sub:
        crawl(sc, sname, depth + 1)

roots = [
    ("1129317199653497", "铝型材"),
    ("1490133068138541", "倍速链系列型材"),
    ("1552114400406461", "机械防护栏"),
    ("1474869169428084", "铝型材框架"),
    ("1587619598044923", "型材连接配件"),
    ("1633661145505098", "型材专用紧固件"),
    ("1492435214563736", "型材装饰配件"),
    ("1267652110334083", "支脚·地脚板·底座·角件"),
    ("1649778145493320", "板材"),
    ("1540614486751130", "封板配件"),
    ("1323734302593642", "精益管及配件"),
    ("1178852114138346", "悬臂/悬臂组件/控制箱"),
]
for cid, name in roots:
    crawl(cid, name)

json.dump({"categories": cats, "lists": list(lists.values())}, open("cat_tree.json", "w"), ensure_ascii=False, indent=1)
print(f"\n分类页 {len(cats)} 个, list 页 {len(lists)} 个 → cat_tree.json")
