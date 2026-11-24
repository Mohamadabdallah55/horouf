import React from 'react';
import { RoomGameState, TeamId } from '../types/game';
export function ChoiceStatus({state}:{state:RoomGameState}) {
  const choosing=state.choosingTeam==='team2'?state.team2:state.team1;
  const mode=state.settings.answerMode||'manual';
  return <div className="rounded-xl bg-[#251638] border border-white/20 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold"><span>اختيار الحرف: <strong className="text-white" style={{borderBottom:'3px solid '+choosing.color}}>{choosing.name}</strong></span><span className="text-amber-300">{mode==='turns'?'تناوب الأدوار':mode==='electronic'?'جرس إلكتروني':'بدون جرس'}</span></div>;
}
export function ManualAnswerControls({state,isDisplayOnly=false,onChoose,onCorrect,onWrong,onNewQuestion}:{state:RoomGameState;isDisplayOnly?:boolean;onChoose:(team:TeamId)=>void;onCorrect:()=>void;onWrong:()=>void;onNewQuestion:()=>void}) {
  if (state.selectedCellId===null||!state.currentQuestion) return null;
  const b=state.buzzer, mode=state.settings.answerMode||'manual';
  const answering=b.winner==='team1'?state.team1:b.winner==='team2'?state.team2:null;
  const disabled=state.phase!=='playing';
  return <div className="rounded-xl bg-[#21132e] border border-white/15 p-3 space-y-2 text-center">
    {b.status==='exhausted'?<><p className="font-black text-amber-300">أخطأ الفريقان — الحرف ما زال متاحًا</p>{!isDisplayOnly&&<button type="button" disabled={disabled} onClick={onNewQuestion} className="rounded-lg bg-amber-400 px-3 py-2 text-slate-950 text-sm font-black">سؤال جديد لنفس الحرف</button>}</>:answering?<><p className="font-black text-white" style={{borderBottom:'3px solid '+answering.color}}>فرصة الإجابة: {answering.name}</p>{b.answerTimerRunning&&<p className="font-mono text-amber-300 font-bold">{b.answerTimerRemaining} ث</p>}{!isDisplayOnly&&<div className="grid grid-cols-2 gap-2"><button type="button" disabled={disabled} onClick={onCorrect} className="rounded-lg bg-emerald-400 text-slate-950 py-2 font-black">صح ✓</button><button type="button" disabled={disabled} onClick={onWrong} className="rounded-lg bg-rose-600 text-white py-2 font-black">خطأ ✕</button></div>}</>:<><p className="font-bold text-amber-300">{mode==='manual'?'مين سبق بالإجابة؟':'بانتظار فرصة الإجابة'}</p>{!isDisplayOnly&&mode==='manual'&&<div className="grid grid-cols-2 gap-2">{[state.team1,state.team2].map(team=><button key={team.id} type="button" disabled={disabled||b.lockedOutTeams.includes(team.id)} onClick={()=>onChoose(team.id)} style={{borderColor:team.color}} className="rounded-lg border-2 bg-white/10 text-white py-2 text-sm font-black disabled:opacity-40">{team.name}</button>)}</div>}</>}
  </div>;
}
