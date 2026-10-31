"""Add stable varied service recommendations and imagery to static blog pages."""
from pathlib import Path
import json,re,html
ROOT=Path(__file__).resolve().parent.parent
CATALOG=json.loads((ROOT/'blog-service-catalog.json').read_text())
BASE='https://saigraphicdesings.com'
COVER='Images/blog/branding-print-design-cover.webp'
THUMB='Images/blog/branding-print-design-thumb.webp'
ALT='Branding and print design concept with stationery, brochure and packaging mockups'
e=lambda s:html.escape(s,quote=True)
def selection(seed):
 state=2166136261
 for ch in seed:state=((state^ord(ch))*16777619)&0xffffffff
 indices=list(range(len(CATALOG)))
 for i in range(len(indices)-1,0,-1):
  state=(state*1664525+1013904223)&0xffffffff;j=state%(i+1);indices[i],indices[j]=indices[j],indices[i]
 return [CATALOG[i] for i in indices[:3]]
def service_block(seed):
 cards=''
 for s in selection(seed):
  cards+=f'<a class="blog-service-card" href="{e(s["link"])}" data-service-id="{e(s["id"])}"><img src="{e(s["image"])}" alt="{e(s["name"])} concept example" width="600" height="450" loading="lazy" decoding="async"><div class="blog-service-body"><h3>{e(s["name"])}</h3><p>{e(s["description"])}</p><span class="blog-service-cta">View service &amp; discuss your project →</span></div></a>'
 return '<!-- blog-services:start --><section class="blog-featured-services" aria-labelledby="blog-services-title"><h2 id="blog-services-title">Explore our design services</h2><p class="blog-services-intro">Planning your next project? Explore these services from Sai Graphic Designs and share your brief for a tailored quote.</p><div class="blog-services-grid">'+cards+'</div><p class="blog-service-note">Visuals are design concepts. Scope, revisions, delivery dates and final files are confirmed in your quotation.</p></section><!-- blog-services:end -->'
def cover():return f'<!-- blog-cover:start --><figure class="blog-cover"><img src="{COVER}" alt="{ALT}" width="1600" height="900" fetchpriority="high" decoding="async"><figcaption>Branding and print design concept · Sai Graphic Designs</figcaption></figure><!-- blog-cover:end -->'
def decorate(path):
 s=path.read_text();is_blog=bool(re.search(r'"@type"\s*:\s*"(?:Article|BlogPosting)"',s)) or path.name=='graphic-designer-in-usa.html'
 if not is_blog:return False
 s=re.sub(r'<!-- blog-cover:start -->[\s\S]*?<!-- blog-cover:end -->','',s)
 s=re.sub(r'<!-- blog-services:start -->[\s\S]*?<!-- blog-services:end -->','',s)
 # Leave any editor-supplied hero in place; add the shared concept as a supporting cover.
 s=re.sub(r'(</h1>)',lambda m:m.group(1)+cover(),s,count=1)
 block=service_block(path.stem)
 if re.search(r'<main[^>]*>\s*<article>',s):
  before,closing,after=s.rpartition('</article>');s=before+block+closing+after
 elif '</main>' in s:s=s.replace('</main>',block+'</main>',1)
 if 'href="blog-article-extras.css"' not in s:s=s.replace('</head>','<link rel="stylesheet" href="blog-article-extras.css"></head>',1)
 # Large social previews use the optimized article cover.
 s=re.sub(r'(<meta[^>]*name="twitter:card"[^>]*content=")[^"]*(")',lambda m:m.group(1)+'summary_large_image'+m.group(2),s)
 if 'name="twitter:card"' not in s:s=s.replace('</head>','<meta name="twitter:card" content="summary_large_image"></head>',1)
 if 'name="twitter:image"' not in s:s=s.replace('</head>',f'<meta name="twitter:image" content="{BASE}/{COVER}"></head>',1)
 # Social sharing uses the same optimized cover.
 s=re.sub(r'(<meta\b[^>]*property="og:image"[^>]*content=")[^"]*(")',lambda m:m.group(1)+BASE+'/'+COVER+m.group(2),s)
 if 'property="og:image"' not in s:s=s.replace('</head>',f'<meta property="og:image" content="{BASE}/{COVER}"></head>',1)
 def schema(m):
  try:d=json.loads(m.group(1))
  except ValueError:return m.group(0)
  for n in d.get('@graph',[d]):
   if n.get('@type') in ['BlogPosting','Article']:n['image']={'@type':'ImageObject','url':BASE+'/'+COVER,'width':1600,'height':900}
  return '<script type="application/ld+json">'+json.dumps(d,ensure_ascii=False).replace('<','\\u003c')+'</script>'
 s=re.sub(r'<script[^>]*type="application/ld\+json"[^>]*>([\s\S]*?)</script>',schema,s)
 path.write_text(s);return True
count=sum(decorate(p) for p in ROOT.glob('*.html'))
for name in ['blog.html','tamil-nadu-district-design-blogs.html']:
 p=ROOT/name;s=p.read_text()
 if 'href="blog-article-extras.css"' not in s:s=s.replace('</head>','<link rel="stylesheet" href="blog-article-extras.css"></head>',1)
 # Preview cards use one cached lightweight thumbnail; district cards show a relevant service image.
 if name=='blog.html':
  s=re.sub(r'(<a class="blog-card" href="[^"]+">)(?!<img)',lambda m:m.group(1)+f'<img class="blog-preview-image" src="{THUMB}" alt="Branding and print design concept" width="800" height="450" loading="lazy" decoding="async">',s)
 else:
  pattern=r'(<article class="guide-card">)(<h3><a href="([^"]+)")'
  def preview(m):
   srv=selection(m.group(3))[0]
   return m.group(1)+f'<img class="blog-preview-image" src="{srv["image"]}" alt="{srv["name"]} concept" width="600" height="375" loading="lazy" decoding="async">'+m.group(2)
  s=re.sub(pattern,preview,s)
 p.write_text(s)
print(f'Decorated {count} static articles and both blog directories.')
