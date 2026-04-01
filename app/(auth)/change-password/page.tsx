"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/context/ThemeContext";
import { SceneBackground, GlassCard } from "@/components/ui/glass3d";

export default function ChangePasswordPage(){
  const { dark } = useTheme();
  const router=useRouter();
  const [form,setForm]=useState({currentPassword:"",newPassword:"",confirmPassword:""});
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState<{type:"ok"|"err";text:string}|null>(null);
  const [showCurrent,setShowCurrent]=useState(false);
  const [showNew,setShowNew]=useState(false);
  const f=(k:string)=>(e:any)=>setForm(p=>({...p,[k]:e.target.value}));

  async function submit(ev:React.FormEvent){
    ev.preventDefault();
    if(form.newPassword!==form.confirmPassword){setMsg({type:"err",text:"PASSWORDS DO NOT MATCH"});return;}
    if(form.newPassword.length<6){setMsg({type:"err",text:"MINIMUM 6 CHARACTERS REQUIRED"});return;}
    setSaving(true);setMsg(null);
    const r=await fetch("/api/auth/change-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:form.currentPassword,newPassword:form.newPassword})});
    const d=await r.json();
    if(r.ok){setMsg({type:"ok",text:"PASSWORD CHANGED SUCCESSFULLY — REDIRECTING…"});setTimeout(()=>router.back(),1800);}
    else setMsg({type:"err",text:(d.error??"FAILED TO CHANGE PASSWORD").toUpperCase()});
    setSaving(false);
  }

  const strength=[form.newPassword.length>=6,/[A-Z]/.test(form.newPassword),/[0-9]/.test(form.newPassword),/[^A-Za-z0-9]/.test(form.newPassword)];
  const strengthColors=["#EF4444","#F59E0B","#3B82F6","#10B981"];
  const strengthLevel=strength.filter(Boolean).length;
  const inputStyle={width:"100%",padding:"11px 14px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#CBD5E1",fontFamily:"'Outfit',sans-serif",fontSize:13,outline:"none",transition:"all 0.45s cubic-bezier(0.4,0,0.2,1)",boxSizing:"border-box" as const};
  const LBL=(t:string)=><label style={{display:"block",fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"2.5px",textTransform:"uppercase" as const,marginBottom:6,fontFamily:"'Bebas Neue',sans-serif"}}>{t}</label>;

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background: dark ? "linear-gradient(135deg, #07070f 0%, #0a0820 40%, #060d1a 100%)" : "linear-gradient(135deg, #f0f0ff 0%, #e8e4ff 40%, #eef6ff 100%)",
      padding:24,position:"relative",overflow:"hidden",transition:"background 0.5s ease"}}>
        <SceneBackground cubeCount={4} showGrid />
        <GlassCard depth={12} className="w-full rounded-3xl" style={{maxWidth:420,zIndex:10}}>
          <div style={{padding:36}}>
            <div style={{marginBottom:28,textAlign:"center"}}>
              <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#1864ff,#5e2fff)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 4px 20px rgba(24,100,255,0.35)"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
              </div>
              <h1 style={{fontSize:22,color:"#E2E8F0",letterSpacing:3,fontFamily:"'Black Ops One',cursive",marginBottom:6}}>CHANGE PASSWORD</h1>
              <p style={{fontSize:9,color:"#334155",letterSpacing:2,fontFamily:"'Bebas Neue',sans-serif"}}>UPDATE YOUR ACCOUNT SECURITY</p>
            </div>

            {msg&&<div style={{marginBottom:18,padding:"10px 14px",borderRadius:9,background:msg.type==="ok"?"rgba(16,185,129,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${msg.type==="ok"?"rgba(16,185,129,0.25)":"rgba(239,68,68,0.2)"}`,fontSize:9,color:msg.type==="ok"?"#10B981":"#FCA5A5",textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2}}>
              {msg.text}
            </div>}

            <form onSubmit={submit}>
              <div style={{marginBottom:16}}>
                {LBL("CURRENT PASSWORD")}
                <div style={{position:"relative"}}>
                  <input type={showCurrent?"text":"password"} required value={form.currentPassword} onChange={f("currentPassword")} className="tc-input" placeholder="Your current password"
                    onFocus={e=>{e.target.style.borderColor="rgba(79,158,255,0.5)";e.target.style.boxShadow="0 0 0 3px rgba(79,158,255,0.1)";}}
                    onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,0.08)";e.target.style.boxShadow="none";}}/>
                  <button type="button" onClick={()=>setShowCurrent(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#334155",fontSize:14,padding:2,transition:"color 0.35s ease"}} onMouseEnter={e=>(e.currentTarget.style.color="#4F9EFF")} onMouseLeave={e=>(e.currentTarget.style.color="#334155")}>{showCurrent?"🙈":"👁"}</button>
                </div>
              </div>

              <div style={{marginBottom:16}}>
                {LBL("NEW PASSWORD")}
                <div style={{position:"relative"}}>
                  <input type={showNew?"text":"password"} required value={form.newPassword} onChange={f("newPassword")} className="tc-input" placeholder="Min 6 characters"
                    onFocus={e=>{e.target.style.borderColor="rgba(79,158,255,0.5)";e.target.style.boxShadow="0 0 0 3px rgba(79,158,255,0.1)";}}
                    onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,0.08)";e.target.style.boxShadow="none";}}/>
                  <button type="button" onClick={()=>setShowNew(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#334155",fontSize:14,padding:2,transition:"color 0.35s ease"}} onMouseEnter={e=>(e.currentTarget.style.color="#4F9EFF")} onMouseLeave={e=>(e.currentTarget.style.color="#334155")}>{showNew?"🙈":"👁"}</button>
                </div>
                {form.newPassword&&<div style={{display:"flex",gap:4,marginTop:6}}>
                  {Array.from({length:4}).map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:3,background:i<strengthLevel?strengthColors[strengthLevel-1]:"rgba(255,255,255,0.07)",transition:"background 0.5s cubic-bezier(0.4,0,0.2,1)"}}/>)}
                </div>}
              </div>

              <div style={{marginBottom:24}}>
                {LBL("CONFIRM NEW PASSWORD")}
                <input type="password" required value={form.confirmPassword} onChange={f("confirmPassword")} style={{...inputStyle,borderColor:form.confirmPassword&&form.confirmPassword!==form.newPassword?"rgba(239,68,68,0.45)":"rgba(255,255,255,0.08)"}} placeholder="Repeat new password"
                  onFocus={e=>{e.target.style.borderColor="rgba(79,158,255,0.5)";e.target.style.boxShadow="0 0 0 3px rgba(79,158,255,0.1)";}}
                  onBlur={e=>{e.target.style.borderColor=form.confirmPassword&&form.confirmPassword!==form.newPassword?"rgba(239,68,68,0.45)":"rgba(255,255,255,0.08)";e.target.style.boxShadow="none";}}/>
                {form.confirmPassword&&form.confirmPassword!==form.newPassword&&<div style={{fontSize:9,color:"#EF4444",marginTop:5,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1.5}}>PASSWORDS DO NOT MATCH</div>}
              </div>

              <button type="submit" disabled={saving||!form.currentPassword||!form.newPassword||form.newPassword!==form.confirmPassword}
                style={{width:"100%",padding:13,borderRadius:12,background:"linear-gradient(135deg,#1760ff,#5e2fff)",color:"#fff",border:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,fontSize:13,textTransform:"uppercase" as const,cursor:"pointer",transition:"all 0.45s cubic-bezier(0.34,1.56,0.64,1)",opacity:saving?.7:1}}
                onMouseEnter={e=>{if(!saving)e.currentTarget.style.transform="translateY(-2px) scale(1.02)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
                {saving?"CHANGING…":"CHANGE PASSWORD →"}
              </button>
              <button type="button" onClick={()=>router.back()} style={{width:"100%",padding:11,borderRadius:12,background:"none",color:"#334155",border:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,fontSize:11,cursor:"pointer",marginTop:8,transition:"color 0.35s ease",textTransform:"uppercase" as const}} onMouseEnter={e=>(e.currentTarget.style.color="#4F9EFF")} onMouseLeave={e=>(e.currentTarget.style.color="#334155")}>
                ← BACK
              </button>
            </form>
          </div>
        </GlassCard>
    </div>
  );
}
