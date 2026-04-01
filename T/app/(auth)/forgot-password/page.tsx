"use client";
import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/context/ThemeContext";
import { SceneBackground, GlassCard } from "@/components/ui/glass3d";

export default function ForgotPasswordPage(){
  const { dark } = useTheme();
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function submit(e:React.FormEvent){
    e.preventDefault();setError("");setLoading(true);
    try{
      const r=await fetch("/api/auth/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim()})});
      const d=await r.json();
      if(r.ok)setSent(true);
      else setError((d.message??"FAILED. TRY AGAIN.").toUpperCase());
    }catch{setError("NETWORK ERROR. CHECK YOUR CONNECTION.");}
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background: dark ? "linear-gradient(135deg, #07070f 0%, #0a0820 40%, #060d1a 100%)" : "linear-gradient(135deg, #f0f0ff 0%, #e8e4ff 40%, #eef6ff 100%)",
      padding:24,position:"relative",overflow:"hidden",transition:"background 0.5s ease"}}>
        <SceneBackground cubeCount={4} showGrid />
        <GlassCard depth={12} className="w-full rounded-3xl" style={{maxWidth:400,zIndex:10}}>
          <div style={{padding:40}}>

            {sent?(
              <div style={{textAlign:"center"}}>
                <div style={{width:64,height:64,borderRadius:20,background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.28)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 22px",animation:"checkPop .5s cubic-bezier(0.34,1.56,0.64,1)"}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h1 style={{fontSize:20,color:"#E2E8F0",letterSpacing:3,fontFamily:"'Black Ops One',cursive",marginBottom:10}}>CHECK YOUR EMAIL</h1>
                <p style={{fontSize:11,color:"#4F6A8A",lineHeight:1.7,marginBottom:24,letterSpacing:.5}}>
                  WE'VE SENT A PASSWORD RESET LINK TO<br/>
                  <strong style={{color:"#CBD5E1",fontFamily:"'JetBrains Mono',monospace"}}>{email}</strong><br/>
                  THE LINK EXPIRES IN 60 MINUTES.
                </p>
                <div style={{padding:"10px 14px",borderRadius:9,background:"rgba(79,158,255,0.06)",border:"1px solid rgba(79,158,255,0.14)",fontSize:10,color:"#334155",marginBottom:20,letterSpacing:1,fontFamily:"'Bebas Neue',sans-serif"}}>
                  DIDN'T RECEIVE IT? CHECK YOUR SPAM FOLDER OR TRY AGAIN AFTER A FEW MINUTES.
                </div>
                <Link href="/login">
                  <button style={{width:"100%",padding:13,borderRadius:12,background:"linear-gradient(135deg,#1760ff,#5e2fff)",color:"#fff",border:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,fontSize:13,cursor:"pointer",transition:"all 0.45s cubic-bezier(0.34,1.56,0.64,1)"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(56,100,253,.5)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    BACK TO LOGIN
                  </button>
                </Link>
              </div>
            ):(
              <>
                <div style={{textAlign:"center",marginBottom:30}}>
                  <div style={{width:54,height:54,borderRadius:16,background:"linear-gradient(135deg,#1864ff,#5e2fff)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",boxShadow:"0 6px 22px rgba(24,100,255,0.35)"}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="22,3 12,13 2,3"/></svg>
                  </div>
                  <h1 style={{fontSize:22,color:"#E2E8F0",letterSpacing:3,fontFamily:"'Black Ops One',cursive",marginBottom:8}}>FORGOT PASSWORD</h1>
                  <p style={{fontSize:10,color:"#334155",letterSpacing:2,fontFamily:"'Bebas Neue',sans-serif"}}>ENTER YOUR EMAIL TO RECEIVE A RESET LINK</p>
                </div>

                {error&&<div style={{marginBottom:16,padding:"10px 14px",borderRadius:9,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#FCA5A5",fontSize:9,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2}}>{error}</div>}

                <form onSubmit={submit}>
                  <div style={{marginBottom:22}}>
                    <label style={{display:"block",fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"2.5px",textTransform:"uppercase",marginBottom:7,fontFamily:"'Bebas Neue',sans-serif"}}>REGISTERED EMAIL</label>
                    <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"
                      style={{width:"100%",padding:"13px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#e8eeff",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none",transition:"all 0.45s cubic-bezier(0.4,0,0.2,1)"}}
                      onFocus={e=>{e.target.style.borderColor="rgba(79,158,255,0.5)";e.target.style.boxShadow="0 0 0 3px rgba(79,158,255,0.1)";e.target.style.background="rgba(30,60,160,0.07)";}}
                      onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,0.08)";e.target.style.boxShadow="none";e.target.style.background="rgba(255,255,255,0.04)";}}/>
                  </div>
                  <button type="submit" disabled={loading||!email} style={{width:"100%",padding:14,borderRadius:13,background:"linear-gradient(135deg,#1a6cff,#6e3eff)",color:"#fff",border:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,fontSize:13,cursor:loading||!email?"not-allowed":"pointer",opacity:loading||!email?.5:1,transition:"all 0.45s cubic-bezier(0.34,1.56,0.64,1)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
                    onMouseEnter={e=>{if(!loading&&email){e.currentTarget.style.transform="translateY(-2px) scale(1.02)";e.currentTarget.style.boxShadow="0 10px 36px rgba(56,100,253,.5)";} }}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    {loading?<><span style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin .8s linear infinite"}}/>SENDING…</>:"SEND RESET LINK →"}
                  </button>
                </form>

                <div style={{marginTop:20,textAlign:"center"}}>
                  <Link href="/login" style={{fontSize:10,color:"#334155",textDecoration:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,transition:"color 0.35s ease"}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#4F9EFF"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="#334155"}>
                    ← BACK TO LOGIN
                  </Link>
                </div>
              </>
            )}
          </div>
        </GlassCard>
    </div>
  );
}
