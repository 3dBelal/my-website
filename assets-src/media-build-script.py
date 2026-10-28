import os,re,json,subprocess,glob
U="/mnt/user-data/uploads"; CP=f"{U}/creative part"; IV=f"{U}/internview"; OUT="/home/claude/web/media"
def slug(s): s=os.path.splitext(s)[0].lower(); s=re.sub(r'[^a-z0-9]+','-',s).strip('-'); return s or "main"
def run(a): subprocess.run(a,stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def probe(p,e,s=None):
    a=['ffprobe','-v','error']+(['-select_streams',s] if s else [])+['-show_entries',e,'-of','csv=p=0',p]
    return subprocess.run(a,capture_output=True,text=True,stdin=subprocess.DEVNULL).stdout.strip().split('\n')[0]
def dims(p):
    o=subprocess.run(['identify','-format','%w %h',p+'[0]'],capture_output=True,text=True).stdout.split(); return [int(x) for x in o] if o else [0,0]
def img(src,dst):
    if not os.path.exists(dst): run(['convert',src+'[0]','-auto-orient','-background','white','-flatten','-resize','2400x2400>','-strip','-sampling-factor','4:2:0','-quality','85',dst+'.tmp.jpg']); os.rename(dst+'.tmp.jpg',dst)
    return dims(dst)
SC="scale='if(gt(iw,ih),min({m},iw),-2)':'if(gt(iw,ih),-2,min({m},ih))'"
def vid(src,dst,maxd=1920,crf=27,audio=True,dur=None):
    if os.path.exists(dst): return
    hasa=audio and probe(src,'stream=codec_name','a')!=''
    a=['ffmpeg','-nostdin','-y','-i',src]+(['-t',str(dur)] if dur else [])+['-vf',SC.format(m=maxd),'-c:v','libx264','-preset','veryfast','-crf',str(crf),'-pix_fmt','yuv420p','-movflags','+faststart']
    a+=(['-c:a','aac','-b:a','96k'] if hasa else ['-an'])+['-f','mp4',dst+'.tmp']; run(a); os.rename(dst+'.tmp',dst)
def poster(src,dst):
    if not os.path.exists(dst): run(['ffmpeg','-nostdin','-y','-ss','1','-i',src,'-frames:v','1','-vf',SC.format(m=1600),'-q:v','3','-f','image2',dst+'.tmp']); os.rename(dst+'.tmp',dst)
man=[]
def addvideo(src,od,rel,s,side,**k):
    vid(src,f"{od}/{s}.mp4"); vid(src,f"{od}/{s}-loop.mp4",maxd=1280,crf=29,audio=False,dur=6); poster(src,f"{od}/{s}-poster.jpg")
    w,h=dims(f"{od}/{s}-poster.jpg")
    man.append(dict(side=side,type='video',file=f"{rel}/{s}.mp4",loop=f"{rel}/{s}-loop.mp4",poster=f"{rel}/{s}-poster.jpg",width=w,height=h,duration=round(float(probe(src,'format=duration') or 0)),audio=probe(src,'stream=codec_name','a')!='',original=os.path.basename(src),**k))
for cat in ['product','characters','art','motion']:
    for proj in sorted(os.listdir(f"{CP}/{cat}")):
        d=f"{CP}/{cat}/{proj}"; rel=f"3d/{cat}/{proj}"; od=f"{OUT}/{rel}"; os.makedirs(od,exist_ok=True)
        for f in sorted(os.listdir(d)):
            p=f"{d}/{f}"; s=slug(f); ext=f.lower().rsplit('.',1)[-1]
            if ext in('jpg','jpeg','png'):
                w,h=img(p,f"{od}/{s}.jpg"); man.append(dict(side='3d',category=cat,project=proj,type='image',file=f"{rel}/{s}.jpg",width=w,height=h,original=f))
            elif ext in('mp4','mov'): addvideo(p,od,rel,s,'3d',category=cat,project=proj)
# QR ad (pre-compressed earlier)
rel="3d/product/qr-food-ad"; od=f"{OUT}/{rel}"; os.makedirs(od,exist_ok=True)
for a,b in [('qr_full.mp4','qr-code.mp4'),('qr_loop.mp4','qr-code-loop.mp4'),('qr_still.jpg','qr-code-poster.jpg')]:
    run(['cp',f"{IV}/_draft_tmp/{a}",f"{od}/{b}"])
w,h=dims(f"{od}/qr-code-poster.jpg")
man.append(dict(side='3d',category='product',project='qr-food-ad',type='video',file=f"{rel}/qr-code.mp4",loop=f"{rel}/qr-code-loop.mp4",poster=f"{rel}/qr-code-poster.jpg",width=w,height=h,duration=64,audio=True,original='qr code .mp4'))
# engineering
for p in sorted(glob.glob(f"{IV}/_selected/*")):
    f=os.path.basename(p); proj='masswell' if f.startswith('masswell') else 'mtm'; rel=f"engineering/{proj}"; od=f"{OUT}/{rel}"; os.makedirs(od,exist_ok=True)
    s=slug(f); w,h=img(p,f"{od}/{s}.jpg"); man.append(dict(side='engineering',project=proj,type='image',file=f"{rel}/{s}.jpg",width=w,height=h,original=f))
rel="engineering/robot"; od=f"{OUT}/{rel}"; os.makedirs(od,exist_ok=True)
for p in [f"{IV}/capstone/Logging/{x}" for x in ["20sec_telemetry_report.png","70sec_telemetry_report.png","full_telemetry_report.png"]]+[f"{IV}/_draft_tmp/{x}" for x in ["robot_desk.jpg","robot_push.jpg","robot_walk.jpg","dash_still.jpg"]]:
    s=slug(os.path.basename(p)); w,h=img(p,f"{od}/{s}.jpg"); man.append(dict(side='engineering',project='robot',type='image',file=f"{rel}/{s}.jpg",width=w,height=h,original=os.path.basename(p)))
for n in ['push','walk','dash','showreel','turntable']:
    run(['cp',f"{IV}/_draft_tmp/{n}_loop.mp4",f"{od}/{n}-loop.mp4"])
    st=f"{IV}/_draft_tmp/{n}_still.jpg"
    if os.path.exists(st): img(st,f"{od}/{n}-poster.jpg")
    else: poster(f"{od}/{n}-loop.mp4",f"{od}/{n}-poster.jpg")
    w,h=dims(f"{od}/{n}-poster.jpg")
    man.append(dict(side='engineering',project='robot',type='video',file=f"{rel}/{n}-loop.mp4",loop=f"{rel}/{n}-loop.mp4",poster=f"{rel}/{n}-poster.jpg",width=w,height=h,audio=False,original=f"{n}_loop.mp4"))
json.dump(man,open(f"{OUT}/manifest.json","w"),indent=1)
print("DONE",len(man))
