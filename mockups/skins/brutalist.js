// brutalist.js — K&N Lifts Brutalist / Dune-Inspired Reskin
// Severe, ceremonial, disciplined. Flat matte blocks, hairline rules,
// exposed grid, numerical marginalia. No shadows. No rounded corners.

(function() {
  var c = DC.css, z = DC.zpad;

  // ─── Palette ───
  var P = {
    spice: '#C2410C',
    sienna: '#8B3A1A',
    ochre: '#A87732',
    dune: '#D6B88A',
    sand: '#E8D5B0',
    void: '#0A0908',
    bone: '#F2EBDD',
    ash: '#2A2523',
    rule: 'rgba(10,9,8,0.18)',
    chest: '#C2410C', back: '#5B4A3F', legs: '#6B7F3A',
    shoulders: '#A87732', arms: '#8B3A1A', core: '#7A8B7A',
  };
  var FD = '"Oswald","Barlow Condensed","Arial Narrow",sans-serif';
  var FM = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';

  // ─── Shared components ───
  function grain(op) {
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>";
    return '<div style="' + c({
      position:'absolute',inset:0,pointerEvents:'none',zIndex:100,
      backgroundImage:'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg).replace(/%23n/g,'%23n') + '")',
      backgroundSize:'220px 220px',mixBlendMode:'multiply',opacity:op||0.08,
    }) + '"></div>';
  }

  function rule(color) {
    return '<div style="' + c({ height:1, background:color||P.rule, width:'100%' }) + '"></div>';
  }

  function baseGrid() {
    return '<div style="' + c({
      position:'absolute',inset:0,pointerEvents:'none',zIndex:0,
      backgroundImage:'repeating-linear-gradient(to bottom,transparent 0,transparent 7px,rgba(10,9,8,0.04) 7px,rgba(10,9,8,0.04) 8px)',
    }) + '"></div>';
  }

  function colGrid(cols) {
    var out = '<div style="' + c({ position:'absolute',inset:0,pointerEvents:'none',zIndex:0 }) + '">';
    for (var i = 1; i < cols; i++) {
      out += '<div style="' + c({
        position:'absolute',top:0,bottom:0,
        left:((i/cols)*100)+'%', width:1, background:'rgba(10,9,8,0.05)',
      }) + '"></div>';
    }
    return out + '</div>';
  }

  function statusBar(fg, time) {
    fg = fg || P.void; time = time || '05:42';
    return '<div style="' + c({
      position:'absolute',top:0,left:0,right:0,zIndex:20,
      display:'flex',justifyContent:'space-between',alignItems:'center',
      padding:'18px 22px 0',fontFamily:FM,fontSize:11,letterSpacing:'0.1em',
      color:fg,textTransform:'uppercase',
    }) + '"><span>' + time + '</span><span style="opacity:0.7">\u25CA \u25CA \u25CA \u25CA \u25CA</span><span>98%</span></div>';
  }

  function coord(left, right, fg) {
    fg = fg || P.void;
    return '<div style="' + c({
      display:'flex',justifyContent:'space-between',
      fontFamily:FM,fontSize:9.5,letterSpacing:'0.15em',
      color:fg,opacity:0.55,textTransform:'uppercase',padding:'0 18px',
    }) + '"><span>' + left + '</span><span>' + right + '</span></div>';
  }

  function tabBar(active, fg, bg) {
    fg = fg || P.void; bg = bg || P.bone;
    var tabs = ['LIFT','LOG','MARKS','CONFIG'];
    var inner = tabs.map(function(t) {
      var dot = t === active ? '<div style="' + c({
        position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',
        width:6,height:6,background:P.spice,
      }) + '"></div>' : '';
      return '<div style="' + c({
        fontFamily:FD,fontSize:12,fontWeight:500,letterSpacing:'0.22em',
        color:fg,opacity:t===active?1:0.35,position:'relative',padding:'6px 0',
      }) + '">' + dot + t + '</div>';
    }).join('');
    return '<div style="' + c({
      position:'absolute',bottom:0,left:0,right:0,zIndex:15,
      background:bg,borderTop:'1px solid '+P.rule,padding:'10px 0 26px',
    }) + '"><div style="display:flex;justify-content:space-around">' + inner + '</div></div>';
  }

  function actionBar(label, sublabel, right) {
    return '<div style="' + c({
      position:'absolute',bottom:0,left:0,right:0,
      background:P.spice,color:P.bone,
      padding:'20px 18px 34px',
      display:'flex',justifyContent:'space-between',alignItems:'center',
    }) + '">' +
    '<div>' +
      (sublabel ? '<div style="' + c({ fontFamily:FM,fontSize:9,letterSpacing:'0.22em',opacity:0.75 }) + '">' + sublabel + '</div>' : '') +
      '<div style="' + c({ fontFamily:FD,fontSize:28,fontWeight:600,letterSpacing:'0.06em',lineHeight:1 }) + '">' + label + '</div>' +
    '</div>' +
    '<div style="' + c({ fontFamily:FM,fontSize:10,letterSpacing:'0.18em',opacity:0.75,textAlign:'right',lineHeight:1.5 }) + '">' + right + '</div>' +
    '</div>';
  }

  // ─── SCREEN 1: HOME / TODAY ───
  function homeScreen() {
    var days = 'MTWTFSS'.repeat(4).split('');
    var completed = [0,2,4,5,7,9,11,12,14,16,18,19];
    var todayIdx = 20;
    var mColors = [P.chest,P.legs,P.back,P.shoulders,P.chest,P.arms,
                   P.legs,P.back,P.chest,P.shoulders,P.legs,P.arms];

    var timeline = days.map(function(d, i) {
      var done = completed.indexOf(i) !== -1;
      var today = i === todayIdx;
      var cIdx = completed.indexOf(i);
      var bg = today ? P.spice : done ? P.void : 'transparent';
      var bdr = !done && !today ? '1px solid '+P.rule : 'none';
      var clr = today || done ? P.bone : P.void;
      var op = i > todayIdx ? 0.3 : 1;
      var bar = done ? '<div style="' + c({
        position:'absolute',bottom:0,left:0,right:0,height:3,
        background:mColors[cIdx]||P.dune,
      }) + '"></div>' : '';
      return '<div style="' + c({
        flex:1,height:28,position:'relative',background:bg,border:bdr,
        display:'flex',alignItems:'center',justifyContent:'center',
      }) + '"><span style="' + c({
        fontFamily:FM,fontSize:7,letterSpacing:'0.05em',color:clr,opacity:op,
      }) + '">' + d + '</span>' + bar + '</div>';
    }).join('');

    return '<div style="' + c({
      width:402,height:874,position:'relative',
      background:P.bone,color:P.void,fontFamily:FD,overflow:'hidden',
    }) + '">' +
    baseGrid() + colGrid(4) + statusBar() +

    '<div style="' + c({ paddingTop:58 }) + '">' +
      coord('K&N LIFTS', 'WK 06 / 16') +
      '<div style="height:14px"></div>' + rule() +
    '</div>' +

    // massive date
    '<div style="' + c({ padding:'20px 18px 14px',position:'relative' }) + '">' +
      '<div style="' + c({ fontFamily:FM,fontSize:10,letterSpacing:'0.22em',opacity:0.6,marginBottom:14 }) + '">SUNDAY \u00B7 CYCLE 06 / 16</div>' +
      '<div style="' + c({ fontFamily:FD,fontWeight:600,fontSize:148,lineHeight:0.82,letterSpacing:'-0.04em',textTransform:'uppercase' }) + '">APR<br>20</div>' +
      '<div style="' + c({ position:'absolute',top:28,right:18,fontFamily:FM,fontSize:9.5,letterSpacing:'0.2em',textAlign:'right',opacity:0.6,lineHeight:1.6 }) + '">DAY<br>110<br>OF<br>365</div>' +
    '</div>' +

    rule() +

    // timeline strip
    '<div style="' + c({ padding:'14px 18px 0' }) + '">' +
      '<div style="' + c({ display:'flex',justifyContent:'space-between',fontFamily:FM,fontSize:9,letterSpacing:'0.22em',opacity:0.55,marginBottom:8 }) + '"><span>TIMELINE \u2014 28D</span><span>STREAK 11</span></div>' +
      '<div style="' + c({ display:'flex',gap:2 }) + '">' + timeline + '</div>' +
      // phase bar
      '<div style="' + c({ display:'flex',marginTop:6,height:4 }) + '">' +
        '<div style="flex:4;background:' + P.ochre + '"></div>' +
        '<div style="flex:4;background:' + P.spice + ';border:1px solid ' + P.void + '"></div>' +
        '<div style="flex:4;background:' + P.sienna + '"></div>' +
        '<div style="flex:2;background:' + P.dune + '"></div>' +
      '</div>' +
      '<div style="' + c({ display:'flex',justifyContent:'space-between',fontFamily:FM,fontSize:7,letterSpacing:'0.12em',opacity:0.45,marginTop:3 }) + '"><span>ACCUM</span><span>INTENS</span><span>PEAK</span><span>DL</span></div>' +
    '</div>' +

    // streak
    '<div style="' + c({ padding:'12px 18px 0',display:'flex',alignItems:'baseline',gap:10 }) + '">' +
      '<span style="' + c({ fontFamily:FD,fontSize:32,fontWeight:500,color:P.spice }) + '">11</span>' +
      '<span style="' + c({ fontFamily:FM,fontSize:9.5,letterSpacing:'0.22em',opacity:0.55 }) + '">CONSECUTIVE DAYS</span>' +
    '</div>' +
    '<div style="height:10px"></div>' + rule() +

    // workout card
    '<div style="' + c({ padding:'0 18px' }) + '">' +
      '<div style="' + c({ background:P.void,color:P.bone,margin:'14px 0',padding:'20px 18px 22px',position:'relative' }) + '">' +
        '<div style="' + c({ display:'flex',justifyContent:'space-between',fontFamily:FM,fontSize:9.5,letterSpacing:'0.2em',opacity:0.55,marginBottom:16 }) + '"><span>DAY 03 \u2014 PROTOCOL</span><span>EST. 48 MIN</span></div>' +
        '<div style="' + c({ fontFamily:FD,fontWeight:500,fontSize:50,lineHeight:0.88,letterSpacing:'-0.02em',textTransform:'uppercase' }) + '">UPPER<br>PUSH<br><span style="color:' + P.spice + '">STRENGTH</span></div>' +
        '<div style="' + c({ display:'flex',gap:24,marginTop:18,fontFamily:FM,fontSize:10,letterSpacing:'0.18em',opacity:0.75 }) + '"><span>8 MVMTS</span><span>\u00B7</span><span>3 BLOCKS</span><span>\u00B7</span><span>9,240 LBS</span></div>' +
        '<div style="' + c({ marginTop:18,paddingTop:16,borderTop:'1px solid rgba(242,235,221,0.18)',display:'flex',justifyContent:'space-between',alignItems:'center' }) + '">' +
          '<div style="' + c({ fontFamily:FD,fontSize:16,fontWeight:500,letterSpacing:'0.24em' }) + '">BEGIN RITE \u2192</div>' +
          '<div style="' + c({ fontFamily:FM,fontSize:9.5,letterSpacing:'0.15em',opacity:0.5 }) + '">001 / 008</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    tabBar('LIFT') + grain(0.09) +
    '</div>';
  }

  // ─── SCREEN 2: CHAPTERS ───
  function chaptersScreen() {
    var blocks = [
      { letter:'A', name:'COMPOUND', color:P.chest, exercises:[
        { n:1, name:'BENCH PRESS',      sets:'4\u00D75', status:'done',    muscle:'CHEST' },
        { n:2, name:'INCLINE DB PRESS', sets:'3\u00D78', status:'done',    muscle:'UPPER CHEST' },
      ]},
      { letter:'B', name:'PRESS & DELTS', color:P.shoulders, exercises:[
        { n:3, name:'STRICT PRESS',     sets:'4\u00D76', status:'done',    muscle:'SHOULDERS' },
        { n:4, name:'LATERAL RAISE',    sets:'3\u00D712',status:'partial', muscle:'SIDE DELT' },
        { n:5, name:'FACE PULL',        sets:'3\u00D715',status:'pending', muscle:'REAR DELT' },
      ]},
      { letter:'C', name:'ACCESSORIES', color:P.arms, exercises:[
        { n:6, name:'DIP',              sets:'3\u00D710',status:'pending', muscle:'TRICEPS' },
        { n:7, name:'CABLE PUSHDOWN',   sets:'3\u00D712',status:'pending', muscle:'TRICEPS' },
        { n:8, name:'SKULL CRUSHER',    sets:'3\u00D710',status:'pending', muscle:'TRICEPS' },
      ]},
    ];

    function statusIcon(s) { return s==='done'?'\u25A0':s==='partial'?'\u25E7':'\u25A1'; }

    var blocksHTML = blocks.map(function(blk) {
      var doneCount = blk.exercises.filter(function(e){return e.status==='done';}).length;
      var exRows = blk.exercises.map(function(ex) {
        return '<div style="' + c({
          display:'grid',gridTemplateColumns:'28px 1fr 52px 24px',gap:8,
          alignItems:'center',padding:'10px 0',
          borderBottom:'1px solid '+P.rule,
          opacity:ex.status==='pending'?0.4:1,
        }) + '">' +
          '<div style="' + c({ fontFamily:FM,fontSize:9,opacity:0.5 }) + '">' + z(ex.n) + '</div>' +
          '<div>' +
            '<div style="' + c({ fontFamily:FD,fontSize:16,fontWeight:500,letterSpacing:'0.02em' }) + '">' + ex.name + '</div>' +
            '<div style="' + c({ fontFamily:FM,fontSize:8,letterSpacing:'0.14em',opacity:0.55,marginTop:1 }) + '">' + ex.muscle + '</div>' +
          '</div>' +
          '<div style="' + c({ fontFamily:FM,fontSize:10,letterSpacing:'0.08em',textAlign:'right' }) + '">' + ex.sets + '</div>' +
          '<div style="' + c({ textAlign:'right',fontSize:14,color:ex.status==='done'?P.spice:P.void }) + '">' + statusIcon(ex.status) + '</div>' +
        '</div>';
      }).join('');

      return '<div style="margin-bottom:12px">' +
        '<div style="' + c({ display:'flex',alignItems:'center',gap:10,marginBottom:4 }) + '">' +
          '<div style="' + c({ width:26,height:26,background:blk.color,color:P.bone,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:FD,fontSize:14,fontWeight:600 }) + '">' + blk.letter + '</div>' +
          '<span style="' + c({ fontFamily:FM,fontSize:9.5,letterSpacing:'0.18em',opacity:0.7 }) + '">' + blk.name + '</span>' +
          '<span style="' + c({ fontFamily:FM,fontSize:9.5,letterSpacing:'0.18em',opacity:0.5,marginLeft:'auto' }) + '">' + doneCount + '/' + blk.exercises.length + '</span>' +
        '</div>' +
        rule(P.void) + exRows +
      '</div>';
    }).join('');

    // stats grid
    var stats = [['BLOCKS','003'],['MVMTS','008'],['VOL\u00B7LBS','9,240'],['EST\u00B7MIN','048']];
    var statsHTML = stats.map(function(s,i) {
      return '<div style="' + c({
        padding:'10px 8px',
        borderRight:i<stats.length-1?'1px solid '+P.rule:'none',
      }) + '">' +
        '<div style="' + c({ fontFamily:FM,fontSize:8.5,letterSpacing:'0.2em',opacity:0.55 }) + '">' + s[0] + '</div>' +
        '<div style="' + c({ fontFamily:FD,fontSize:20,fontWeight:500,letterSpacing:'0.02em',marginTop:2 }) + '">' + s[1] + '</div>' +
      '</div>';
    }).join('');

    return '<div style="' + c({
      width:402,height:874,position:'relative',
      background:P.bone,color:P.void,fontFamily:FD,overflow:'hidden',
    }) + '">' +
    statusBar() +

    '<div style="' + c({ paddingTop:58 }) + '">' +
      '<div style="' + c({ padding:'0 18px',display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:FM,fontSize:10,letterSpacing:'0.22em' }) + '">' +
        '<span>\u00D7 END</span><span style="opacity:0.6">DAY 03 \u2014 UPPER PUSH</span><span>48:12</span>' +
      '</div>' +
      '<div style="height:14px"></div>' + rule() +
    '</div>' +

    '<div style="' + c({ padding:'16px 18px 10px' }) + '">' +
      '<div style="' + c({ fontFamily:FM,fontSize:9.5,letterSpacing:'0.25em',opacity:0.55,marginBottom:10 }) + '">\u00A7 THE MANIFEST</div>' +
      '<div style="' + c({ fontFamily:FD,fontWeight:500,fontSize:48,lineHeight:0.86,letterSpacing:'-0.025em',textTransform:'uppercase' }) + '">UPPER PUSH<br><span style="color:' + P.spice + '">/ STRENGTH</span></div>' +
      '<div style="' + c({ marginTop:18,display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderTop:'1px solid '+P.void,borderBottom:'1px solid '+P.void }) + '">' + statsHTML + '</div>' +
    '</div>' +

    '<div style="' + c({ padding:'0 18px' }) + '">' + blocksHTML + '</div>' +

    actionBar('BLOCK B', 'RESUME \u2192', '004/008<br>48:12') +
    grain(0.09) +
    '</div>';
  }

  // ─── SCREEN 3: FOCUS (Active Session) ───
  function focusScreen() {
    var sets = [
      { n:1, w:'135', r:'6', rpe:'6.0', s:'done' },
      { n:2, w:'155', r:'6', rpe:'7.0', s:'done' },
      { n:3, w:'165', r:'6', rpe:'8.0', s:'done' },
      { n:4, w:'165', r:'\u2014', rpe:'\u2014', s:'active' },
      { n:5, w:'165', r:'\u2014', rpe:'\u2014', s:'pending' },
      { n:6, w:'155', r:'\u2014', rpe:'\u2014', s:'pending' },
    ];

    var dots = [1,2,3,4,5].map(function(n) {
      var cur = n === 3;
      var done = n < 3;
      return '<div style="' + c({
        width:28,height:28,
        background:done?P.bone:'transparent',
        border:cur?'2px solid '+P.spice:done?'none':'1px solid rgba(242,235,221,0.2)',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontFamily:FM,fontSize:10,
        color:done?P.void:cur?P.spice:P.bone,
        opacity:n>3?0.3:1,
      }) + '">' + n + '</div>';
    }).join('');

    var setRows = sets.map(function(s) {
      var icon = s.s==='done'?'\u25A0':s.s==='active'?'\u25B8':'\u25A1';
      return '<div style="' + c({
        display:'grid',gridTemplateColumns:'36px 1fr 1fr 52px 28px',gap:4,
        alignItems:'center',padding:'12px 0',
        borderBottom:'1px solid rgba(242,235,221,0.08)',
        borderLeft:s.s==='active'?'3px solid '+P.spice:'3px solid transparent',
        paddingLeft:s.s==='active'?8:0,
        opacity:s.s==='pending'?0.35:1,
      }) + '">' +
        '<span style="' + c({ fontFamily:FM,fontSize:10,opacity:0.6 }) + '">' + z(s.n,2) + '</span>' +
        '<span style="' + c({ fontFamily:FD,fontSize:22,fontWeight:500,letterSpacing:'0.02em' }) + '">' + s.w + '<span style="' + c({ fontFamily:FM,fontSize:9,marginLeft:3,opacity:0.55,letterSpacing:'0.12em' }) + '">LBS</span></span>' +
        '<span style="' + c({ fontFamily:FD,fontSize:22,fontWeight:500 }) + '">' + s.r + (s.r!=='\u2014'?'<span style="'+c({fontFamily:FM,fontSize:9,marginLeft:3,opacity:0.55,letterSpacing:'0.12em'})+'">REP</span>':'') + '</span>' +
        '<span style="' + c({ textAlign:'right',fontFamily:FM,fontSize:11,letterSpacing:'0.08em' }) + '">' + s.rpe + '</span>' +
        '<span style="' + c({ textAlign:'right',fontSize:14,color:s.s==='done'?P.spice:P.bone }) + '">' + icon + '</span>' +
      '</div>';
    }).join('');

    return '<div style="' + c({
      width:402,height:874,position:'relative',
      background:P.void,color:P.bone,fontFamily:FD,overflow:'hidden',
    }) + '">' +
    statusBar(P.bone) +

    '<div style="' + c({ paddingTop:58 }) + '">' +
      '<div style="' + c({ padding:'0 18px',display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:FM,fontSize:10,letterSpacing:'0.22em',color:P.bone,opacity:0.65 }) + '">' +
        '<span>\u2190 OVERVIEW</span><span>SET ' + z(4) + ' / ' + z(6) + '</span><span>\u23F8 PAUSE</span>' +
      '</div>' +
      '<div style="height:14px"></div>' +
      '<div style="height:1px;background:rgba(242,235,221,0.12)"></div>' +
    '</div>' +

    // exercise nav dots
    '<div style="' + c({ padding:'14px 18px 0',display:'flex',gap:6,alignItems:'center' }) + '">' +
      dots +
      '<span style="' + c({ fontFamily:FM,fontSize:8.5,letterSpacing:'0.18em',opacity:0.4,marginLeft:'auto' }) + '">BLOCK B</span>' +
    '</div>' +

    // exercise identity
    '<div style="' + c({ padding:'18px 18px 0' }) + '">' +
      '<div style="' + c({ fontFamily:FM,fontSize:9.5,letterSpacing:'0.25em',opacity:0.55,marginBottom:8 }) + '">\u2116 003 \u2014 MOVEMENT</div>' +
      '<div style="' + c({ fontFamily:FD,fontWeight:500,fontSize:42,lineHeight:0.9,letterSpacing:'-0.02em',textTransform:'uppercase' }) + '">STRICT<br>PRESS</div>' +
      '<div style="' + c({ marginTop:12,display:'flex',gap:18,fontFamily:FM,fontSize:10,letterSpacing:'0.16em',opacity:0.7 }) + '"><span>SHOULDERS</span><span>\u00B7</span><span>TRICEPS</span></div>' +
      '<div style="' + c({ marginTop:8,fontFamily:FM,fontSize:9,letterSpacing:'0.14em',opacity:0.35 }) + '">PREV: 155\u00D76 @ RPE 7.5</div>' +
    '</div>' +

    // set table
    '<div style="' + c({ padding:'20px 18px 0' }) + '">' +
      '<div style="' + c({ display:'grid',gridTemplateColumns:'36px 1fr 1fr 52px 28px',gap:4,fontFamily:FM,fontSize:8.5,letterSpacing:'0.2em',opacity:0.5,paddingBottom:6 }) + '">' +
        '<span>SET</span><span>WEIGHT</span><span>REPS</span><span style="text-align:right">RPE</span><span></span>' +
      '</div>' +
      '<div style="height:1px;background:' + P.bone + '"></div>' +
      setRows +
    '</div>' +

    // session stats
    '<div style="' + c({ position:'absolute',bottom:76,left:18,right:18,display:'flex',justifyContent:'space-between',fontFamily:FM,fontSize:9,letterSpacing:'0.18em',opacity:0.45,borderTop:'1px solid rgba(242,235,221,0.1)',paddingTop:10 }) + '">' +
      '<span>VOL 4,860 LBS</span><span>SETS 14/24</span><span>PRs 1</span><span>+52:38</span>' +
    '</div>' +

    actionBar('LOG SET \u2192', '', '+52:38') +
    grain(0.11) +
    '</div>';
  }

  // ─── SCREEN 4: REST TIMER ───
  function restTimerScreen() {
    var segments = '';
    for (var i = 0; i < 30; i++) {
      segments += '<div style="' + c({
        flex:1, height:10,
        background: i < 22 ? P.spice : 'rgba(242,235,221,0.12)',
      }) + '"></div>';
    }

    var durBtns = [60,90,120,150,180].map(function(s) {
      var active = s === 150;
      return '<div style="' + c({
        flex:1,padding:'10px 0',
        border:active?'2px solid '+P.spice:'1px solid rgba(242,235,221,0.15)',
        background:active?P.spice:'transparent',
        color:P.bone,textAlign:'center',fontFamily:FM,fontSize:11,letterSpacing:'0.08em',
      }) + '">' + s + 's</div>';
    }).join('');

    return '<div style="' + c({
      width:402,height:874,position:'relative',
      background:P.void,color:P.bone,fontFamily:FD,overflow:'hidden',
    }) + '">' +
    statusBar(P.bone) +

    '<div style="' + c({ paddingTop:58 }) + '">' +
      '<div style="' + c({ padding:'0 18px',display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:FM,fontSize:10,letterSpacing:'0.22em',color:P.bone,opacity:0.65 }) + '">' +
        '<span>\u00D7 SKIP</span><span>REST PERIOD</span><span>\u2190 BACK</span>' +
      '</div>' +
      '<div style="height:14px"></div>' +
      '<div style="height:1px;background:rgba(242,235,221,0.12)"></div>' +
    '</div>' +

    '<div style="' + c({ padding:'18px 18px 0' }) + '">' +
      '<div style="' + c({ fontFamily:FM,fontSize:10,letterSpacing:'0.2em',opacity:0.45 }) + '">BETWEEN SETS \u2014 STRICT PRESS</div>' +
      '<div style="' + c({ fontFamily:FM,fontSize:10,letterSpacing:'0.16em',opacity:0.35,marginTop:4 }) + '">SET 003 OF 006 COMPLETE</div>' +
    '</div>' +

    // giant timer
    '<div style="' + c({ position:'absolute',top:250,left:0,right:0,textAlign:'center',padding:'0 12px' }) + '">' +
      '<div style="' + c({ fontFamily:FM,fontSize:10,letterSpacing:'0.3em',color:P.spice,marginBottom:16 }) + '">\u2014 REST \u2014</div>' +
      '<div style="' + c({ fontFamily:FD,fontWeight:600,fontSize:186,lineHeight:0.82,letterSpacing:'-0.05em',color:P.bone,fontVariantNumeric:'tabular-nums' }) + '">01:48</div>' +
      '<div style="' + c({ display:'flex',gap:3,margin:'26px 28px 0' }) + '">' + segments + '</div>' +
      '<div style="' + c({ marginTop:10,display:'flex',justifyContent:'space-between',padding:'0 28px',fontFamily:FM,fontSize:9,letterSpacing:'0.2em',opacity:0.55 }) + '"><span>00:00</span><span>150"</span></div>' +
    '</div>' +

    // duration selector
    '<div style="' + c({ position:'absolute',top:540,left:28,right:28 }) + '">' +
      '<div style="' + c({ fontFamily:FM,fontSize:9,letterSpacing:'0.22em',opacity:0.45,marginBottom:8 }) + '">REST DURATION</div>' +
      '<div style="' + c({ display:'flex',gap:4 }) + '">' + durBtns + '</div>' +
    '</div>' +

    // next set preview
    '<div style="' + c({ position:'absolute',bottom:100,left:18,right:18 }) + '">' +
      '<div style="' + c({ fontFamily:FM,fontSize:9,letterSpacing:'0.22em',opacity:0.45,marginBottom:8 }) + '">NEXT UP</div>' +
      '<div style="height:1px;background:rgba(242,235,221,0.15)"></div>' +
      '<div style="' + c({ padding:'12px 0',display:'flex',justifyContent:'space-between',fontFamily:FM,fontSize:11,letterSpacing:'0.12em' }) + '">' +
        '<span>SET 004</span><span>165 LBS</span><span>6 REPS</span><span style="opacity:0.5">RPE 8.5</span>' +
      '</div>' +
    '</div>' +

    actionBar('SKIP REST \u2192', '', '01:48') +
    grain(0.11) +
    '</div>';
  }

  // ─── SCREEN 5: HISTORY + PRs ───
  function historyScreen() {
    var weeks = [6800,8400,7200,9600,8800,10200,9400,11200,10800,12400,11600,9240];
    var maxW = Math.max.apply(null, weeks);

    var bars = weeks.map(function(v, i) {
      var last = i === weeks.length - 1;
      var label = last ? '<div style="' + c({ position:'absolute',top:-16,left:'50%',transform:'translateX(-50%)',fontFamily:FM,fontSize:8,letterSpacing:'0.1em',color:P.spice,whiteSpace:'nowrap' }) + '">9.2K</div>' : '';
      return '<div style="' + c({
        flex:1,height:(v/maxW*100)+'%',
        background:last?P.spice:P.void,position:'relative',
      }) + '">' + label + '</div>';
    }).join('');

    var prs = [
      ['BENCH PRESS','185\u00D75','214','2026\u00B704\u00B716'],
      ['BACK SQUAT','275\u00D73','301','2026\u00B704\u00B710'],
      ['DEADLIFT','315\u00D72','334','2026\u00B703\u00B728'],
      ['STRICT PRESS','135\u00D75','156','2026\u00B704\u00B718'],
    ];
    var prRows = prs.map(function(r, i) {
      return '<div style="' + c({
        display:'grid',gridTemplateColumns:'1fr 68px 50px 82px',
        alignItems:'baseline',padding:'8px 0',borderBottom:'1px solid '+P.rule,
      }) + '">' +
        '<div style="' + c({ fontFamily:FD,fontSize:15,fontWeight:500,letterSpacing:'0.04em' }) + '">' + r[0] + '</div>' +
        '<div style="' + c({ fontFamily:FM,fontSize:10,letterSpacing:'0.06em' }) + '">' + r[1] + '</div>' +
        '<div style="' + c({ fontFamily:FD,fontSize:18,fontWeight:500,color:i===0?P.spice:P.void,textAlign:'right' }) + '">' + r[2] + '</div>' +
        '<div style="' + c({ textAlign:'right',fontFamily:FM,fontSize:8.5,letterSpacing:'0.1em',opacity:0.5 }) + '">' + r[3] + '</div>' +
      '</div>';
    }).join('');

    var sessions = [
      { d:'APR 20',p:'03.A',name:'UPPER / PUSH',vol:'9,240',note:'PR \u2014 STRICT PRESS 135\u00D75' },
      { d:'APR 18',p:'04.B',name:'LOWER / PULL',vol:'11,600',note:'HAMSTRING TIGHT L' },
      { d:'APR 17',p:'01.A',name:'UPPER / PULL',vol:'8,820',note:'\u2014' },
      { d:'APR 16',p:'02.A',name:'LOWER / PUSH',vol:'12,400',note:'PR \u2014 SQUAT 275\u00D73' },
      { d:'APR 14',p:'03.A',name:'UPPER / PUSH',vol:'8,960',note:'BENCH 185\u00D74 RPE 9.5' },
    ];
    var sessionRows = sessions.map(function(e) {
      var noteColor = e.note.indexOf('PR')===0 ? P.spice : P.void;
      return '<div style="' + c({
        padding:'9px 0',borderBottom:'1px solid '+P.rule,
        display:'grid',gridTemplateColumns:'52px 1fr 58px',gap:8,alignItems:'baseline',
      }) + '">' +
        '<div>' +
          '<div style="' + c({ fontFamily:FD,fontSize:15,fontWeight:500,letterSpacing:'0.02em',lineHeight:1 }) + '">' + e.d + '</div>' +
          '<div style="' + c({ fontFamily:FM,fontSize:8,letterSpacing:'0.16em',opacity:0.45,marginTop:2 }) + '">' + e.p + '</div>' +
        '</div>' +
        '<div>' +
          '<div style="' + c({ fontFamily:FD,fontSize:14,fontWeight:500,letterSpacing:'0.04em' }) + '">' + e.name + '</div>' +
          '<div style="' + c({ fontFamily:FM,fontSize:9,letterSpacing:'0.08em',opacity:0.55,marginTop:1,color:noteColor }) + '">' + e.note + '</div>' +
        '</div>' +
        '<div style="' + c({ textAlign:'right',fontFamily:FM,fontSize:10,letterSpacing:'0.08em' }) + '">' + e.vol + '</div>' +
      '</div>';
    }).join('');

    // stats row
    var statData = [['SESSIONS','047','/ 96'],['STREAK','11','DAYS'],['PRs','04','NEW']];
    var statsHTML = statData.map(function(s, i) {
      return '<div style="' + c({
        padding:'10px 10px',borderRight:i<statData.length-1?'1px solid '+P.void:'none',
      }) + '">' +
        '<div style="' + c({ fontFamily:FM,fontSize:8.5,letterSpacing:'0.2em',opacity:0.55 }) + '">' + s[0] + '</div>' +
        '<div style="' + c({ fontFamily:FD,fontSize:28,fontWeight:500,letterSpacing:'0.02em',lineHeight:1,marginTop:3 }) + '">' + s[1] + '</div>' +
        '<div style="' + c({ fontFamily:FM,fontSize:8.5,letterSpacing:'0.16em',opacity:0.5,marginTop:2 }) + '">' + s[2] + '</div>' +
      '</div>';
    }).join('');

    return '<div style="' + c({
      width:402,height:874,position:'relative',
      background:P.bone,color:P.void,fontFamily:FD,overflow:'hidden',
    }) + '">' +
    statusBar() +

    '<div style="' + c({ paddingTop:58 }) + '">' +
      coord('\u00A7 ARCHIVE \u2014 00.047', 'WK 06 / 16') +
      '<div style="height:14px"></div>' + rule() +
    '</div>' +

    '<div style="' + c({ padding:'16px 18px 6px' }) + '">' +
      '<div style="' + c({ fontFamily:FD,fontWeight:500,fontSize:56,lineHeight:0.86,letterSpacing:'-0.025em',textTransform:'uppercase' }) + '">THE<br>LOG</div>' +
    '</div>' +

    // volume chart
    '<div style="' + c({ padding:'10px 18px 0' }) + '">' +
      '<div style="' + c({ display:'flex',justifyContent:'space-between',fontFamily:FM,fontSize:9,letterSpacing:'0.22em',opacity:0.55,marginBottom:6 }) + '"><span>VOL \u00B7 LBS / WK</span><span>PEAK 12,400</span></div>' +
      '<div style="' + c({ height:100,display:'flex',alignItems:'flex-end',gap:4,borderBottom:'1px solid '+P.void,position:'relative' }) + '">' +
        '<div style="' + c({ position:'absolute',left:0,right:0,bottom:(10000/maxW*100)+'%',borderTop:'1px dashed rgba(10,9,8,0.25)' }) + '"></div>' +
        bars +
      '</div>' +
      '<div style="' + c({ display:'flex',justifyContent:'space-between',fontFamily:FM,fontSize:8,letterSpacing:'0.15em',opacity:0.45,marginTop:4 }) + '"><span>W01</span><span>W04</span><span>W08</span><span>W12</span></div>' +
    '</div>' +

    // stats row
    '<div style="' + c({ margin:'14px 18px 10px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',border:'1px solid '+P.void }) + '">' + statsHTML + '</div>' +

    // PR table
    '<div style="' + c({ padding:'6px 18px 0' }) + '">' +
      '<div style="' + c({ display:'flex',justifyContent:'space-between',fontFamily:FM,fontSize:9,letterSpacing:'0.22em',opacity:0.55,marginBottom:4 }) + '"><span>\u00A7 PERSONAL RECORDS</span><span>N=04</span></div>' +
      rule(P.void) + prRows +
    '</div>' +

    // session log
    '<div style="' + c({ padding:'10px 18px 0' }) + '">' +
      '<div style="' + c({ display:'flex',justifyContent:'space-between',fontFamily:FM,fontSize:9,letterSpacing:'0.22em',opacity:0.55,marginBottom:4 }) + '"><span>ENTRIES \u2014 RECENT</span><span>\u2193 047</span></div>' +
      rule(P.void) + sessionRows +
    '</div>' +

    tabBar('LOG') + grain(0.09) +
    '</div>';
  }

  // ─── Export SKIN ───
  window.SKIN = {
    header: {
      tag: '\u00A7 PROJECT \u2014 K&N LIFTS / BRUTALIST RESKIN / EXPLORATION',
      title: 'K&N LIFTS \u2014 <span style="color:#C2410C">RESKINNED</span>',
      description: 'Your actual screens \u2014 day picker, chapters, focus view, rest timer, history \u2014 reimagined with brutalist typography, flat matte blocks, hairline rules, and the spice / ochre / dune / void palette. No shadows. No rounded corners.',
    },
    sections: [
      {
        title: 'Core flow',
        subtitle: 'Home \u00B7 Workout Chapters \u00B7 Active Focus',
        gap: 56,
        artboards: [
          { label: '01 \u2014 HOME / TODAY',      width: 402, height: 874, html: homeScreen },
          { label: '02 \u2014 WORKOUT CHAPTERS',  width: 402, height: 874, html: chaptersScreen },
          { label: '03 \u2014 ACTIVE FOCUS',       width: 402, height: 874, html: focusScreen },
        ],
      },
      {
        title: 'Session & History',
        subtitle: 'Rest Timer \u00B7 The Log',
        gap: 56,
        artboards: [
          { label: '04 \u2014 REST TIMER',    width: 402, height: 874, html: restTimerScreen },
          { label: '05 \u2014 HISTORY + PRs', width: 402, height: 874, html: historyScreen },
        ],
      },
    ],
    footer: 'TYPE \u00B7 OSWALD (DISPLAY) / JETBRAINS MONO (DATA) &nbsp;\u00B7&nbsp; PALETTE \u00B7 #C2410C / #8B3A1A / #A87732 / #D6B88A / #0A0908 &nbsp;\u00B7&nbsp; NO GRADIENTS / NO SHADOWS / NO ROUNDED CORNERS &nbsp;\u00B7&nbsp; K&N LIFTS DATA / VANILLA JS ARCHITECTURE',
  };
})();
