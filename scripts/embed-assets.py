from pathlib import Path
import base64,json,mimetypes
root=Path(__file__).resolve().parent.parent
assets={}
for p in (root/'public').rglob('*'):
 if p.is_file():
  content_type={'.js':'application/javascript','.mjs':'application/javascript','.svg':'image/svg+xml'}.get(p.suffix,mimetypes.guess_type(p.name)[0] or 'application/octet-stream')
  assets['/'+p.relative_to(root/'public').as_posix()]={'type':content_type,'data':base64.b64encode(p.read_bytes()).decode()}
(root/'generated').mkdir(exist_ok=True)
(root/'generated/assets.json').write_text(json.dumps(assets,separators=(',',':')))
print('Embedded',len(assets),'public files')
