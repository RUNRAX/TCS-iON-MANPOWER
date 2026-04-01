"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useTheme } from "@/lib/context/ThemeContext";
import { SceneBackground, GlassCard } from "@/components/ui/glass3d";

export default function ResetPasswordPage(){
  const { dark } = useTheme();
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState("");
  const [validSession,setValidSession]=useState<boolean|null>(null);
  const [showPw,setShowPw]=useState(false);

  useEffect(()=>{
    // Supabase puts the token in the URL hash — it auto-handles session on load
    const sb=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    sb.auth.getSession().then(({data:{session}})=>setValidSession(!!session));
  },[]);

  async function submit(e:React.FormEvent){
    e.preventDefault();setError("");
    if(password!==confirm){setError("PASSWORDS DO NOT MATCH");return;}
    if(password.length<6){setError("MINIMUM 6 CHARACTERS");return;}
    setLoading(true);
    const sb=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const {error:err}=await sb.auth.updateUser({password});
    if(err)setError(err.message.toUpperCase());
    else setDone(true);
    setLoading(false);
  }

  const strength=[password.length>=6,/[A-Z]/.test(password),/[0-9]/.test(password),/[^A-Za-z0-9]/.test(password)];
  const strengthColors=["#EF4444","#F59E0B","#3B82F6","#10B981"];
  const strengthLevel=strength.filter(Boolean).length;
  const inp={width:"100%",padding:"13px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#e8eeff",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none",transition:"all 0.45s cubic-bezier(0.4,0,0.2,1)",boxSizing:"border-box"} as React.CSSProperties;

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background: dark ? "linear-gradient(135deg, #07070f 0%, #0a0820 40%, #060d1a 100%)" : "linear-gradient(135deg, #f0f0ff 0%, #e8e4ff 40%, #eef6ff 100%)",
      padding:24,position:"relative",overflow:"hidden",transition:"background 0.5s ease"}}>
        <SceneBackground cubeCount={4} showGrid />
        <GlassCard depth={12} className="w-full rounded-3xl" style={{maxWidth:400,zIndex:10}}>
          <div style={{padding:40}}>

            {validSession===null&&(
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{width:24,height:24,border:"2px solid rgba(79,158,255,0.2)",borderTopColor:"#4F9EFF",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 12px"}}/>
                <div style={{fontSize:9,color:"#334155",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3}}>VERIFYING RESET LINK…</div>
              </div>
            )}

            {validSession===false&&(
              <div style={{textAlign:"center"}}>
                <div style={{width:54,height:54,borderRadius:16,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </div>
                <h1 style={{fontSize:18,color:"#E2E8F0",letterSpacing:2,fontFamily:"'Black Ops One',cursive",marginBottom:10}}>LINK EXPIRED</h1>
                <p style={{fontSize:10,color:"#4F6A8A",marginBottom:22,letterSpacing:.5,lineHeight:1.7}}>THIS RESET LINK HAS EXPIRED OR IS INVALID.<br/>PLEASE REQUEST A NEW ONE.</p>
                <Link href="/forgot-password"><button style={{width:"100%",padding:13,borderRadius:12,background:"linear-gradient(135deg,#1a6cff,#6e3eff)",color:"#fff",border:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,fontSize:12,cursor:"pointer"}}>REQUEST NEW LINK</button></Link>
              </div>
            )}

            {validSession===true&&!done&&(
              <>
                <div style={{textAlign:"center",marginBottom:28}}>
                  <div style={{width:54,height:54,borderRadius:16,background:"linear-gradient(135deg,#1864ff,#5e2fff)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",boxShadow:"0 6px 22px rgba(24,100,255,0.35)"}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <h1 style={{fontSize:20,color:"#E2E8F0",letterSpacing:3,fontFamily:"'Black Ops One',cursive",marginBottom:7}}>SET NEW PASSWORD</h1>
                  <p style={{fontSize:9,color:"#334155",letterSpacing:2,fontFamily:"'Bebas Neue',sans-serif"}}>CHOOSE A STRONG PASSWORD</p>
                </div>

                {error&&<div style={{marginBottom:16,padding:"10px 14px",borderRadius:9,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#FCA5A5",fontSize:9,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2}}>{error}</div>}

                <form onSubmit={submit}>
                  <div style={{marginBottom:16}}>
                    <label style={{display:"block",fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"2.5px",textTransform:"uppercase" as const,marginBottom:7,fontFamily:"'Bebas Neue',sans-serif"}}>NEW PASSWORD</label>
                    <div style={{position:"relative"}}>
                      <input type={showPw?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" style={inp}
                        onFocus={e=>{e.target.style.borderColor="rgba(79,158,255,0.5)";e.target.style.boxShadow="0 0 0 3px rgba(79,158,255,0.1)";}}
                        onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,0.08)";e.target.style.boxShadow="none";}}/>
                      <button type="button" onClick={()=>setShowPw(v=>!v)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#334155",fontSize:14,padding:2,transition:"color 0.35s ease"}} onMouseEnter={e=>(e.currentTarget.style.color="#4F9EFF")} onMouseLeave={e=>(e.currentTarget.style.color="#334155")}>{showPw?"🙈":"👁"}</button>
                    </div>
                    {password&&<div style={{display:"flex",gap:4,marginTop:6}}>
                      {Array.from({length:4}).map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:3,background:i<strengthLevel?strengthColors[strengthLevel-1]:"rgba(255,255,255,0.06)",transition:"background 0.5s cubic-bezier(0.4,0,0.2,1)"}}/>)}
                    </div>}
                  </div>
                  <div style={{marginBottom:24}}>
                    <label style={{display:"block",fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"2.5px",textTransform:"uppercase" as const,marginBottom:7,fontFamily:"'Bebas Neue',sans-serif"}}>CONFIRM PASSWORD</label>
                    <input type="password" required value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat new password"
                      style={{...inp,borderColor:confirm&&confirm!==password?"rgba(239,68,68,0.4)":"rgba(255,255,255,0.08)"}}
                      onFocus={e=>{e.target.style.borderColor="rgba(79,158,255,0.5)";e.target.style.boxShadow="0 0 0 3px rgba(79,158,255,0.1)";}}
                      onBlur={e=>{e.target.style.borderColor=confirm&&confirm!==password?"rgba(239,68,68,0.4)":"rgba(255,255,255,0.08)";e.target.style.boxShadow="none";}}/>
                    {confirm&&confirm!==password&&<div style={{fontSize:9,color:"#EF4444",marginTop:5,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1.5}}>PASSWORDS DO NOT MATCH</div>}
                  </div>
                  <button type="submit" disabled={loading||!password||password!==confirm} style={{width:"100%",padding:14,borderRadius:13,background:"linear-gradient(135deg,#1a6cff,#6e3eff)",color:"#fff",border:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,fontSize:13,cursor:"pointer",opacity:loading||!password||password!==confirm?.5:1,transition:"all 0.45s cubic-bezier(0.34,1.56,0.64,1)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
                    onMouseEnter={e=>{if(!loading&&password&&password===confirm){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 36px rgba(56,100,253,.5)";}}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    {loading?<><span style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin .8s linear infinite"}}/>UPDATING…</>:"UPDATE PASSWORD →"}
                  </button>
                </form>
              </>
            )}

            {done&&(
              <div style={{textAlign:"center"}}>
                <div style={{width:64,height:64,borderRadius:20,background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.28)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 22px",animation:"checkPop .5s cubic-bezier(0.34,1.56,0.64,1)"}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h1 style={{fontSize:20,color:"#E2E8F0",letterSpacing:3,fontFamily:"'Black Ops One',cursive",marginBottom:10}}>PASSWORD UPDATED</h1>
                <p style={{fontSize:10,color:"#4F6A8A",marginBottom:24,letterSpacing:.5,lineHeight:1.7}}>YOUR PASSWORD HAS BEEN CHANGED SUCCESSFULLY.<br/>YOU CAN NOW LOG IN WITH YOUR NEW PASSWORD.</p>
                <Link href="/login"><button style={{width:"100%",padding:13,borderRadius:12,background:"linear-gradient(135deg,#1a6cff,#6e3eff)",color:"#fff",border:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,fontSize:12,cursor:"pointer",transition:"all 0.45s cubic-bezier(0.34,1.56,0.64,1)"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(56,100,253,.5)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                  GO TO LOGIN →
                </button></Link>
              </div>
            )}
          </div>
        </GlassCard>
    </div>
  );
}
