# Cocokkan frasa naskah ke potongan suara (berdasarkan jeda), tanpa ASR.
import re, subprocess, sys
mp3, ftxt = sys.argv[1], sys.argv[2]
dur = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',mp3]))
log = subprocess.run(['ffmpeg','-hide_banner','-i',mp3,'-af','silencedetect=noise=-35dB:d=0.2','-f','null','-'],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',log)]; en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',log)]
# potongan bicara
segs=[]; cur=0.0
pairs=list(zip(st,en)) if (st and st[0] < en[0]) else [(0.0,en[0])]+list(zip(st,en[1:]))
for s,e in pairs:
    if s-cur>0.05: segs.append((cur,s))
    cur=e
if dur-cur>0.05: segs.append((cur,dur))
frasa=[l.strip() for l in open(ftxt) if l.strip()]
def suku(t): return max(1,len(re.findall(r'[aiueo]+',t.lower().replace('whatsapp','wotsep'))))
S=[suku(f) for f in frasa]
L=[e-s for s,e in segs]
tot_s=sum(S); tot_l=sum(L); rate=tot_s/tot_l
n,m=len(frasa),len(segs)
import functools
INF=1e18
@functools.lru_cache(None)
def dp(i,j):
    # tetapkan frasa i.. ke potongan j..; tiap frasa memakai >=1 potongan berurutan
    if i==n: return (0,()) if j==m else (INF,())
    best=(INF,())
    for k in range(j+1,m-(n-i-1)+1):
        d=sum(L[j:k]); c=(S[i]/rate-d)**2
        r=dp(i+1,k)
        if c+r[0]<best[0]: best=(c+r[0],((j,k),)+r[1])
    return best
cost,asg=dp(0,0)
for f,(j,k) in zip(frasa,asg):
    print(f"{segs[j][0]:6.2f} {segs[k-1][1]:6.2f}  {f}")
