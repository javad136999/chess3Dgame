import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { Chess } from 'chess.js';
import { newGame, statusText } from './game/chess';
import { ensureGuestSession, createRoom, joinRoom, getRoom, subscribeRoom, savePosition } from './game/online';
import './styles.css';

function Piece({p,attack,selected}:{p:any,attack:boolean,selected:boolean}){
 const dark=p.color==='b';
 const ref=useRef<any>(null);
 useFrame(({clock})=>{
   if(!ref.current)return;
   const t=clock.getElapsedTime();
   const bob=Math.sin(t*(p.type==='p'?4.2:2.2))*(p.type==='p'?.035:.015);
   const strike=attack?Math.sin(t*15)*.08:0;
   ref.current.position.y=bob;
   ref.current.rotation.z=attack?Math.sin(t*16)*.1:0;
   const base=selected?1.08:1;
   ref.current.scale.setScalar(base+(attack?.045+Math.max(0,strike):0));
 });
 const armor=dark?'#24252e':'#eee5d0';
 const metal=dark?'#12131a':'#d8c9a8';
 const gold='#c99a2e';
 const skin=dark?'#353640':'#9b7a55';
 const weapon=<mesh position={[0,.95,.3]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.025,.025,.85,10]}/><meshStandardMaterial color={gold} metalness={.8}/></mesh>;
 return <group ref={ref}>
  <mesh position={[0,.1,0]}><cylinderGeometry args={[.38,.48,.2,24]}/><meshStandardMaterial color={metal} metalness={.65} roughness={.25}/></mesh>
  {p.type==='b'?<>
    <mesh position={[0,.58,0]} scale={[1.15,.95,1.35]}><sphereGeometry args={[.34,20,14]}/><meshStandardMaterial color={skin} roughness={.8}/></mesh>
    <mesh position={[0,.82,.02]} scale={[.9,1.1,.9]}><sphereGeometry args={[.25,20,14]}/><meshStandardMaterial color={skin} roughness={.8}/></mesh>
    <mesh position={[0,.95,.02]}><sphereGeometry args={[.12,16,10]}/><meshStandardMaterial color={armor}/></mesh>
    <mesh position={[0,.48,-.28]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.07,.11,.45,16]}/><meshStandardMaterial color={skin}/></mesh>
    <mesh position={[0,.52,.28]} rotation={[-Math.PI/2,0,0]}><coneGeometry args={[.11,.3,16]}/><meshStandardMaterial color={skin}/></mesh>
    <mesh position={[0,.72,0]}><torusGeometry args={[.25,.035,10,24]}/><meshStandardMaterial color={gold} metalness={.8}/></mesh>
    <group position={[0,.98,0]} scale={.55}>
      <mesh position={[0,.42,0]}><capsuleGeometry args={[.16,.32,6,10]}/><meshStandardMaterial color={armor} metalness={.35}/></mesh>
      <mesh position={[0,.68,0]}><sphereGeometry args={[.14,16,12]}/><meshStandardMaterial color={armor}/></mesh>
      <mesh position={[.12,.55,.12]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.018,.018,.8,8]}/><meshStandardMaterial color={gold}/></mesh>
    </group>
  </>:p.type==='n'?<>
    <mesh position={[0,.42,0]} scale={[1.25,.72,1.55]}><sphereGeometry args={[.32,20,14]}/><meshStandardMaterial color={armor} metalness={.35}/></mesh>
    <mesh position={[0,.58,-.15]} rotation={[0,.15,-.08]}><capsuleGeometry args={[.18,.5,8,14]}/><meshStandardMaterial color={armor} metalness={.35}/></mesh>
    <mesh position={[0,.84,.02]}><sphereGeometry args={[.2,18,12]}/><meshStandardMaterial color={armor}/></mesh>
    <mesh position={[0,.9,.19]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.04,.42,10]}/><meshStandardMaterial color={gold} metalness={.8}/></mesh>
    <mesh position={[0,.24,.25]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.07,.07,.5,12]}/><meshStandardMaterial color={metal}/></mesh>
    {weapon}
  </>:p.type==='p'?<>
    <mesh position={[0,.45,0]}><capsuleGeometry args={[.18,.38,8,12]}/><meshStandardMaterial color={armor} metalness={.3}/></mesh>
    <mesh position={[0,.78,0]}><sphereGeometry args={[.17,18,12]}/><meshStandardMaterial color={armor}/></mesh>
    <mesh position={[0,.9,.06]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.05,.2,8]}/><meshStandardMaterial color={gold}/></mesh>
    {weapon}
  </>:<>
    <mesh position={[0,.53,0]}><sphereGeometry args={[p.type==='k'?.3:p.type==='q'?.27:.22,20,14]}/><meshStandardMaterial color={armor} metalness={.3}/></mesh>
    {p.type==='k'&&<><mesh position={[0,.98,0]}><torusGeometry args={[.22,.05,12,24]}/><meshStandardMaterial color={gold} metalness={.9}/></mesh><mesh position={[0,1.2,0]}><boxGeometry args={[.07,.4,.07]}/><meshStandardMaterial color={gold} metalness={.8}/></mesh></>}
    {p.type==='q'&&<mesh position={[0,.98,0]}><coneGeometry args={[.16,.35,8]}/><meshStandardMaterial color={gold} metalness={.8}/></mesh>}
    {p.type==='r'&&<mesh position={[0,.92,0]}><cylinderGeometry args={[.17,.2,.36,8]}/><meshStandardMaterial color={armor} metalness={.5}/></mesh>}
  </>}
  {attack&&<Html center position={[0,1.3,0]}><span className="hit">⚔</span></Html>}
 </group>
}
function Board({game,onMove,locked=false}:{game:Chess,onMove:(g:Chess)=>void,locked?:boolean}){
 const [sel,setSel]=useState<string|null>(null);
 const [moving,setMoving]=useState<string|null>(null);
 const legal=useMemo(()=>sel?game.moves({square:sel as any,verbose:true}).map((m:any)=>m.to):[],[game,sel]);
 const squares=useMemo(()=>{const a:any[]=[];for(let r=7;r>=0;r--)for(let c=0;c<8;c++){const sq=String.fromCharCode(97+c)+(r+1);a.push({sq,p:game.get(sq as any)});}return a},[game]);
 const click=(sq:string)=>{if(locked||moving)return;const p=game.get(sq as any);
   if(!sel){if(p?.color===game.turn())setSel(sq);return}
   if(sel===sq){setSel(null);return}
   try{
    const g=new Chess(game.fen());const piece=g.get(sel as any);
    const promotion=piece?.type==='p'&&(sq[1]==='8'||sq[1]==='1')?'q':undefined;
    g.move({from:sel,to:sq,...(promotion?{promotion}:{})});
    setMoving(sel+'-'+sq);setSel(null);
    window.setTimeout(()=>{setMoving(null);onMove(g)},220);
   }catch{if(p?.color===game.turn())setSel(sq);else setSel(null)}
 };
 return <group>{squares.map(({sq,p},i)=>{const x=(i%8)-3.5,z=Math.floor(i/8)-3.5;const light=(i+Math.floor(i/8))%2===0;const isFrom=moving?.startsWith(sq+'-');return <group key={sq} position={[x*1.1,0,z*1.1]} onClick={()=>click(sq)}>
   <mesh position={[0,-.08,0]}><boxGeometry args={[1.05,.16,1.05]}/><meshStandardMaterial color={sel===sq?'#d4a72c':legal.includes(sq)?'#708f58':light?'#d8c29b':'#3b2d25'}/></mesh>
   {p&&<Piece p={p} attack={legal.includes(sq)} selected={sel===sq}/>}
   {legal.includes(sq)&&!p&&<mesh position={[0,.02,0]}><cylinderGeometry args={[.11,.11,.035,16]}/><meshStandardMaterial color="#d4a72c" emissive="#8b6b32" emissiveIntensity={.8}/></mesh>}
   {isFrom&&<mesh position={[0,.13,0]}><ringGeometry args={[.28,.34,24]}/><meshStandardMaterial color="#e2b63d" emissive="#9b6b18" emissiveIntensity={1.2}/></mesh>}
 </group>})}</group>
}
export default function App(){
 const[game,setGame]=useState(newGame);const[mode,setMode]=useState<'offline'|'online'>('offline');const[room,setRoom]=useState('');const[roomId,setRoomId]=useState<string|null>(null);const[playerId,setPlayerId]=useState<string|null>(null);const[playerColor,setPlayerColor]=useState<'w'|'b'|null>(null);const[msg,setMsg]=useState('');const[timer,setTimer]=useState({w:600,b:600});const last=useRef(Date.now());
 useEffect(()=>{const code=new URLSearchParams(window.location.search).get('room');if(code){setMode('online');setRoom(code)}},[]);
 useEffect(()=>{if(!roomId)return;let active=true;getRoom(roomId).then((r:any)=>{if(!active)return;if(r?.fen&&r.fen!=='startpos')try{setGame(new Chess(r.fen))}catch{};if(playerId)setPlayerColor(r.white_id===playerId?'w':r.black_id===playerId?'b':null)}).catch(()=>setMsg('اتاق پیدا نشد'));const stop=subscribeRoom(roomId,(r:any)=>{if(r?.fen&&r.fen!=='startpos')try{setGame(new Chess(r.fen))}catch{};if(playerId)setPlayerColor(r.white_id===playerId?'w':r.black_id===playerId?'b':null)});return()=>{active=false;stop()};},[roomId,playerId]);
 useEffect(()=>{last.current=Date.now();const t=setInterval(()=>{setTimer(v=>{if(game.isGameOver())return v;const now=Date.now(),d=(now-last.current)/1000;last.current=now;const side=game.turn();return {...v,[side]:Math.max(0,v[side]-d)}})},250);return()=>clearInterval(t)},[game]);
 const move=async(g:Chess)=>{setGame(g);last.current=Date.now();if(mode==='online'&&roomId){try{await savePosition(roomId,g.fen(),g.turn())}catch{setMsg('ذخیره حرکت ناموفق بود')}}};
 const newOnline=async()=>{try{const u=await ensureGuestSession();setPlayerId(u.id);const r=await createRoom(u.id);setPlayerColor('w');setRoomId(r.id);setRoom(r.id);setGame(newGame());setTimer({w:600,b:600});setMsg('اتاق ساخته شد؛ لینک دعوت را کپی کنید')}catch(e:any){setMsg(e?.message||'Supabase یا Anonymous Auth را تنظیم کنید')}};
 const join=async()=>{try{const code=room.trim();if(!code)throw new Error('کد اتاق را وارد کنید');const u=await ensureGuestSession();setPlayerId(u.id);const r=await joinRoom(code,u.id);setPlayerColor('b');setRoomId(r.id);setRoom(r.id);setMsg('با مهره‌های سیاه وارد شدید')}catch(e:any){setMsg(e?.message||'اتاق پیدا نشد یا پر است')}};
 const fmt=(n:number)=>{n=Math.max(0,Math.floor(n));return Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toString().padStart(2,'0')};
 const onlineLocked=mode==='online'&&(!playerColor||playerColor!==game.turn());
 return <main><header><div><h1>FANTASY CHESS 3D</h1><span>شطرنج فانتزی • نبرد آنلاین و آفلاین</span></div><div className="actions"><button className="modeBtn" onClick={()=>setMode(mode==='offline'?'online':'offline')}>{mode==='offline'?'🌐 آنلاین':'🎮 آفلاین'}</button><button onClick={()=>{setGame(newGame());setTimer({w:600,b:600});setMsg('بازی جدید شروع شد')}}>⚔ بازی جدید</button></div></header>
 <div className="onlinebar">{mode==='online'&&<><button onClick={newOnline}>🏰 ساخت اتاق</button><input value={room} onChange={e=>setRoom(e.target.value)} placeholder="شناسه اتاق"/><button onClick={join}>ورود</button>{roomId&&<button onClick={()=>navigator.clipboard?.writeText(window.location.origin+window.location.pathname+'?room='+roomId)}>🔗 کپی لینک</button>}</>}{msg&&<span>{msg}</span>}</div>
 <section className="hud"><div className={game.turn()==='w'?'turn active':'turn'}>♔ سفید <b>{fmt(timer.w)}</b></div><div className="status">{statusText(game)}</div><div className={game.turn()==='b'?'turn active':'turn'}>♚ سیاه <b>{fmt(timer.b)}</b></div></section>
 <div className="scene"><Canvas camera={{position:[-5.4,6.2,5.4],fov:42}}><ambientLight intensity={1.15}/><directionalLight position={[4,8,5]} intensity={3}/><pointLight position={[-5,4,-4]} intensity={1.5}/><Environment preset="sunset"/><Board game={game} onMove={move} locked={onlineLocked}/><ContactShadows position={[0,-.15,0]} opacity={.5} scale={12} blur={2}/><OrbitControls enablePan={false} enableRotate={false} minDistance={6} maxDistance={13} minPolarAngle={0.88} maxPolarAngle={0.88} minAzimuthAngle={-0.78} maxAzimuthAngle={-0.78} target={[0,0,0]}/></Canvas></div>
 <footer><span>♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜</span><small>{mode==='online'?(roomId?'🌐 اتاق آنلاین فعال':'🌐 حالت آنلاین آماده'): '🎮 بازی آفلاین دو نفره'} {onlineLocked&&' • منتظر نوبت شما'}</small></footer></main>}
