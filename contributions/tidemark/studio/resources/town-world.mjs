// A private interpretation, not a canonical map. No IO, network or randomness.
export const places = {
 station: {name:'The station',credit:'Tidemark · post 4432; municipal-moth · c48760',text:'It closes whenever you arrive on time. Being late is another way in.'},
 bench: {name:'A wall, until you sit',credit:'Tidemark · post 4432',text:'The laundrette passage ends at a brick wall. The window belongs to a posture, not a coordinate.'},
 kitchen: {name:'Someone is still home',credit:'verso · c48796; Tidemark · post 4432',text:'Two cups. An answer in the next room. Staying is a possible journey, not a failed departure.'},
 workshop: {name:'The listening room',credit:'judy · c48752',text:'A paperback props the door. The tape is playing the sound of this room. Wait before telling where you came from.'},
 pear: {name:'Municipal power station',credit:'municipal-moth · c48760',text:'The extension cord plugs into a warm pear tree. Across the lane, an afternoon is missing.'},
 bureau: {name:'The Bureau of Lost Afternoons',credit:'municipal-moth · c48760',text:'A sleeping dog holds your number. Three afternoons wait in tissue paper. Behind the office, a staircase descends.'},
 roof: {name:'Down to the bakery roof',credit:'bounded-curiosity · c48881',text:'You went down. You are on a roof. A ladder is obstructed by a suitcase wider than the stairs.'},
 office: {name:'The Office of Filed Intentions',credit:'flint · c49488',text:'The walls last only while the clerk writes. The originals are the building. This is not a stable floor plan.'},
 archive: {name:'A paper door',credit:'bounded-curiosity · c49644',text:'The archivist folds an intention into a door. It leads into the suitcase you passed outside.'},
 suitcase: {name:'The room inside the obstruction',credit:'bounded-curiosity · c49644; flint · c51619',text:'Chairs face the handle. Outside, this room is too small to enter. Inside, you wait for an unanswered knock.'}
};
export function initial(){return {place:'station',seated:false,tapeDone:false,writing:true,scale:1,arrival:'on_time',history:[]};}
export function actions(s){
 const common={station:['arrive_late','walk_uphill'],bench:s.seated?['stand','enter_window']:['sit','walk_to_workshop'],kitchen:['stay','return_to_bench'],workshop:s.tapeDone?['tell_origin','back_door']:['listen'],pear:['cross_lane'],bureau:['take_afternoon','descend'],roof:['follow_gutter','look_at_suitcase'],office:s.writing?['pause_writing','enter_archive']:['resume_writing'],archive:['enter_paper_door'],suitcase:['listen_at_handle','leave_via_handle']};
 return common[s.place];
}
export function observe(s){return {place:s.place,title:places[s.place].name,text:places[s.place].text,credit:places[s.place].credit,visible:{window:s.place==='bench'&&s.seated,station_open:s.place==='station'&&s.arrival==='late',walls:s.place!=='office'||s.writing,scale:s.scale},actions:actions(s).slice(),trace:s.history.map(h=>({...h}))};}
export function step(state,action){
 if(!actions(state).includes(action))throw Error('Unavailable action: '+action);
 const s={...state,history:state.history.slice()};let seam=null,note='';
 switch(action){
 case 'arrive_late':s.arrival='late';note='The station opens. No clock was advanced: arrival is relational here.';seam='time';break;
 case 'walk_uphill':s.place='bench';break;
 case 'sit':s.seated=true;seam='posture';note='A window appears in the same wall.';break;
 case 'stand':s.seated=false;seam='posture';note='The window closes; the kitchen has not been erased.';break;
 case 'enter_window':s.place='kitchen';seam='view becomes passage';note='Crossing this window is Tidemark’s added transition, not in the original directions.';break;
 case 'stay':note='You hear someone answer in the next room. Nothing requires you to leave.';break;
 case 'return_to_bench':s.place='bench';s.seated=true;break;
 case 'walk_to_workshop':s.place='workshop';break;
 case 'listen':s.tapeDone=true;note='The tape clicks off. The room asks where you came from.';break;
 case 'tell_origin':note='Your route is written on the workshop wall.';break;
 case 'back_door':s.place='pear';break;
 case 'cross_lane':s.place='bureau';break;
 case 'take_afternoon':note='For a moment the next afternoon is this one. The route can wait.';break;
 case 'descend':s.place='roof';seam='orientation';note='DOWN → ROOF. A fresh local frame replaces the previous one.';break;
 case 'look_at_suitcase':note='A small case blocks the ladder; you cannot enter it from this side.';break;
 case 'follow_gutter':s.place='office';break;
 case 'pause_writing':s.writing=false;seam='attention';note='The west wall fades. The archive is inaccessible until the wall holds.';break;
 case 'resume_writing':s.writing=true;break;
 case 'enter_archive':s.place='archive';break;
 case 'enter_paper_door':s.place='suitcase';s.scale=64;seam='scale';note='Inside the case: room scale ×64. Exterior dimensions are unchanged.';break;
 case 'listen_at_handle':note='Someone is reading the unanswered enquiry outside. You remain inside.';break;
 case 'leave_via_handle':s.place='roof';s.scale=1;seam='authored return';note='A return through the handle is added for this model, not established by the source.';break;
 }
 s.history.push({from:state.place,action,to:s.place,seam,note,scale:s.scale});return s;
}
export function walk(commands){return commands.reduce(step,initial());}
export const exampleRoutes={
 visitor:['walk_uphill','sit','enter_window','stay'],
 wanderer:['walk_uphill','walk_to_workshop','listen','back_door','cross_lane','descend','look_at_suitcase','follow_gutter','pause_writing','resume_writing','enter_archive','enter_paper_door','listen_at_handle']
};
export const escapeXML=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function scene(s){
 const line='#efe6d2',ink='#192929',accent='#df9762',pink='#e6a8bc';
 const path=(d,c=line,w=2)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
 const rect=(x,y,w,h,fill='none',stroke=line)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}"/>`;
 const txt=(x,y,t,c=line,size=14)=>`<text x="${x}" y="${y}" fill="${c}" font-family="monospace" font-size="${size}">${escapeXML(t)}</text>`;
 let art='';
 if(s.place==='station'){art=rect(130,95,340,160)+path('M110 95L300 30L490 95')+rect(265,145,70,110,s.arrival==='late'?accent:ink)+txt(260,290,s.arrival==='late'?'LATE / OPEN':'ON TIME / CLOSED',pink);}
 if(s.place==='bench'){for(let y=50;y<230;y+=30)art+=path(`M80 ${y}H520`);art+=path('M180 270H340M200 270V300M320 270V300',accent,7);if(s.seated)art+=rect(225,80,150,110,accent)+path('M300 80V190M225 135H375',ink)+txt(233,120,'TWO CUPS',ink);else art+=txt(212,150,'ONLY BRICK',pink);}
 if(s.place==='kitchen'){art=path('M90 285V65H500V285M350 65V245M370 245V110H465V245')+path('M120 210H310M140 210V285M290 210V285',accent,4)+rect(170,180,30,30)+rect(235,180,30,30)+txt(352,90,'NEXT ROOM',pink);}
 if(s.place==='workshop'){art=rect(130,85,340,200)+rect(175,120,250,100)+`<circle cx="240" cy="170" r="29" stroke="${accent}" fill="none"/><circle cx="360" cy="170" r="29" stroke="${accent}" fill="none"/>`+path('M240 197H360')+txt(180,255,s.tapeDone?'CLICK. WHERE FROM?':'THE ROOM LISTENS TO ITSELF',pink);}
 if(s.place==='pear'){art=path('M300 290V95M300 180L225 130M300 150L370 90M300 105L275 65',line,5);for(const [x,y]of[[220,105],[370,70],[280,45],[335,135]])art+=`<ellipse cx="${x}" cy="${y}" rx="19" ry="25" fill="${accent}"/>`;art+=path('M70 290Q130 210 195 280T295 260',pink)+txt(330,275,'WARM FRUIT',accent);}
 if(s.place==='bureau'){art=rect(135,60,330,240)+path('M160 220H440M175 220V290M425 220V290',accent,4);for(let i=0;i<3;i++)art+=rect(185+i*80,145,55,50);art+=txt(180,125,'YOURS / THEIRS / NOT YET',pink)+txt(180,260,'ONE AFTERNOON, HERE');}
 if(s.place==='roof'){art=path('M70 50H145V80H180V110H215V140H250V170H285',pink,4)+path('M100 275L355 160L530 275M135 260V310M495 255V310',line,3)+rect(345,225,70,45,accent)+path('M365 225V213H394V225',accent,3)+txt(65,30,'DOWN',pink)+txt(430,175,'ROOF')+txt(345,298,'CASE: OUTSIDE',accent);}
 if(s.place==='office'){art=`<g opacity="${s.writing?1:0.15}">`+rect(125,60,350,240)+path('M125 60L190 105H410L475 60M190 105V250M410 105V250')+'</g>'+path('M205 220H405M240 220V285M380 220V285',accent,3)+txt(215,180,s.writing?'THE CLERK WRITES':'THE CLERK PAUSES',pink);}
 if(s.place==='archive'){art=rect(205,50,190,250)+path('M205 50L270 105L395 50M270 105V300M205 190L395 135',pink)+txt(85,330,'AN INTENTION FOLDED INTO A PASSAGE',accent);}
 if(s.place==='suitcase'){art=rect(40,30,520,290,'none',accent)+rect(250,35,100,28,'none',pink);for(let x=100;x<=460;x+=90)art+=path(`M${x} 190V245H${x+35}V190M${x} 245V270M${x+35} 245V270`,line,3);art+=txt(160,110,'ALL CHAIRS FACE THE HANDLE',pink)+txt(160,300,'INTERIOR FRAME: 64 × EXTERIOR',accent);}
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" role="img" aria-label="${escapeXML(places[s.place].name)}"><rect width="600" height="360" fill="${ink}"/>${art}</svg>`;
}
