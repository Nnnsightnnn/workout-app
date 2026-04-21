// kn-screens.jsx — K&N Lifts Brutalist Reskin Mockup
// Dune-inspired, data-dense, zero-radius, hairline-ruled

const PAL = {
  spice: '#C2410C',
  sienna: '#8B3A1A',
  ochre: '#A87732',
  dune: '#D6B88A',
  sand: '#E8D5B0',
  void: '#0A0908',
  bone: '#F2EBDD',
  ash: '#2A2523',
  rule: 'rgba(10,9,8,0.18)',
  // Brutalized muscle group colors
  chest: '#C2410C',    // spice
  back: '#5B4A3F',     // dark earth
  legs: '#6B7F3A',     // olive drab
  shoulders: '#A87732',// ochre
  arms: '#8B3A1A',     // sienna
  core: '#7A8B7A',     // sage
};

const F_DISP = '"Oswald", "Barlow Condensed", "Arial Narrow", sans-serif';
const F_MONO = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace';

// ─────────────────────────────────────────────────────────────
// Film grain overlay
// ─────────────────────────────────────────────────────────────
function Grain({ opacity = 0.08 }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100,
      backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg).replace(/%23n/g, '%23n')}")`,
      backgroundSize: '220px 220px',
      mixBlendMode: 'multiply',
      opacity,
    }} />
  );
}

// ─────────────────────────────────────────────────────────────
// Shared building blocks
// ─────────────────────────────────────────────────────────────
function Rule({ color = PAL.rule, style = {} }) {
  return <div style={{ height: 1, background: color, width: '100%', ...style }} />;
}

function BaselineGrid({ step = 8, color = 'rgba(10,9,8,0.04)' }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
      backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${step - 1}px, ${color} ${step - 1}px, ${color} ${step}px)`,
    }} />
  );
}

function ColGrid({ cols = 4, color = 'rgba(10,9,8,0.05)' }) {
  const gutters = Array.from({ length: cols - 1 }).map((_, i) => (
    <div key={i} style={{
      position: 'absolute', top: 0, bottom: 0,
      left: `${((i + 1) / cols) * 100}%`,
      width: 1, background: color,
    }} />
  ));
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>{gutters}</div>;
}

const zpad = (n, w = 3) => String(n).padStart(w, '0');

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function BrutalStatusBar({ fg = PAL.void, time = '05:42' }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '18px 22px 0',
      fontFamily: F_MONO, fontSize: 11, letterSpacing: '0.1em',
      color: fg, textTransform: 'uppercase',
    }}>
      <span>{time}</span>
      <span style={{ opacity: 0.7 }}>◊ ◊ ◊ ◊ ◊</span>
      <span>98%</span>
    </div>
  );
}

function CoordStrip({ left, right, fg = PAL.void }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.15em',
      color: fg, opacity: 0.55, textTransform: 'uppercase',
      padding: '0 18px',
    }}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// K&N Tab Bar
// ─────────────────────────────────────────────────────────────
function KNTabBar({ active = 'LIFT', fg = PAL.void, bg = PAL.bone }) {
  const tabs = ['LIFT', 'LOG', 'MARKS', 'CONFIG'];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
      background: bg,
      borderTop: `1px solid ${PAL.rule}`,
      padding: '10px 0 26px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {tabs.map(t => (
          <div key={t} style={{
            fontFamily: F_DISP, fontSize: 12, fontWeight: 500,
            letterSpacing: '0.22em', color: fg,
            opacity: t === active ? 1 : 0.35,
            position: 'relative',
            padding: '6px 0',
          }}>
            {t === active && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 6, height: 6, background: PAL.spice,
              }} />
            )}
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 1 — HOME / TODAY
// ─────────────────────────────────────────────────────────────
function KNHomeScreen() {
  // 28-day timeline data
  const days = ['M','T','W','T','F','S','S','M','T','W','T','F','S','S',
                'M','T','W','T','F','S','S','M','T','W','T','F','S','S'];
  const completedDays = [0,2,4,5,7,9,11,12,14,16,18,19]; // indices of completed days
  const todayIdx = 20; // Monday of current week
  const muscleColors = [PAL.chest, PAL.legs, PAL.back, PAL.shoulders, PAL.chest, PAL.arms,
                        PAL.legs, PAL.back, PAL.chest, PAL.shoulders, PAL.legs, PAL.arms];

  return (
    <div style={{
      width: 402, height: 874, position: 'relative',
      background: PAL.bone, color: PAL.void,
      fontFamily: F_DISP, overflow: 'hidden',
    }}>
      <BaselineGrid />
      <ColGrid cols={4} />
      <BrutalStatusBar />

      {/* top metadata */}
      <div style={{ paddingTop: 58 }}>
        <CoordStrip left="K&N LIFTS" right="WK 06 / 16" />
        <div style={{ height: 14 }} />
        <Rule />
      </div>

      {/* massive date block */}
      <div style={{ padding: '20px 18px 14px', position: 'relative' }}>
        <div style={{
          fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.22em',
          opacity: 0.6, marginBottom: 14,
        }}>
          SUNDAY · CYCLE 06 / 16
        </div>
        <div style={{
          fontFamily: F_DISP, fontWeight: 600,
          fontSize: 148, lineHeight: 0.82,
          letterSpacing: '-0.04em', textTransform: 'uppercase',
        }}>
          APR<br/>20
        </div>
        <div style={{
          position: 'absolute', top: 28, right: 18,
          fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.2em',
          textAlign: 'right', opacity: 0.6, lineHeight: 1.6,
        }}>
          DAY<br/>110<br/>OF<br/>365
        </div>
      </div>

      <Rule />

      {/* timeline strip */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.22em',
          opacity: 0.55, marginBottom: 8,
        }}>
          <span>TIMELINE — 28D</span>
          <span>STREAK 11</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {days.map((d, i) => {
            const isComplete = completedDays.includes(i);
            const isToday = i === todayIdx;
            const colorIdx = completedDays.indexOf(i);
            return (
              <div key={i} style={{
                flex: 1, height: 28, position: 'relative',
                background: isToday ? PAL.spice : isComplete ? PAL.void : 'transparent',
                border: !isComplete && !isToday ? `1px solid ${PAL.rule}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: F_MONO, fontSize: 7, letterSpacing: '0.05em',
                  color: isToday || isComplete ? PAL.bone : PAL.void,
                  opacity: i > todayIdx ? 0.3 : 1,
                }}>{d}</span>
                {isComplete && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: 3, background: muscleColors[colorIdx] || PAL.dune,
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* phase bar */}
        <div style={{ display: 'flex', marginTop: 6, height: 4 }}>
          <div style={{ flex: 4, background: PAL.ochre }} />
          <div style={{ flex: 4, background: PAL.spice, border: `1px solid ${PAL.void}` }} />
          <div style={{ flex: 4, background: PAL.sienna }} />
          <div style={{ flex: 2, background: PAL.dune }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: F_MONO, fontSize: 7, letterSpacing: '0.12em',
          opacity: 0.45, marginTop: 3,
        }}>
          <span>ACCUM</span>
          <span>INTENS</span>
          <span>PEAK</span>
          <span>DL</span>
        </div>
      </div>

      {/* streak counter */}
      <div style={{
        padding: '12px 18px 0',
        display: 'flex', alignItems: 'baseline', gap: 10,
      }}>
        <span style={{
          fontFamily: F_DISP, fontSize: 32, fontWeight: 500,
          color: PAL.spice,
        }}>11</span>
        <span style={{
          fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.22em',
          opacity: 0.55,
        }}>CONSECUTIVE DAYS</span>
      </div>

      <div style={{ height: 10 }} />
      <Rule />

      {/* monolithic workout card */}
      <div style={{ padding: '0 18px' }}>
        <div style={{
          background: PAL.void, color: PAL.bone,
          margin: '14px 0', padding: '20px 18px 22px',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.2em',
            opacity: 0.55, marginBottom: 16,
          }}>
            <span>DAY 03 — PROTOCOL</span>
            <span>EST. 48 MIN</span>
          </div>
          <div style={{
            fontFamily: F_DISP, fontWeight: 500,
            fontSize: 50, lineHeight: 0.88,
            letterSpacing: '-0.02em', textTransform: 'uppercase',
          }}>
            UPPER<br/>PUSH<br/><span style={{ color: PAL.spice }}>STRENGTH</span>
          </div>
          <div style={{
            display: 'flex', gap: 24, marginTop: 18,
            fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.18em',
            opacity: 0.75,
          }}>
            <span>8 MVMTS</span>
            <span>·</span>
            <span>3 BLOCKS</span>
            <span>·</span>
            <span>9,240 LBS</span>
          </div>
          <div style={{
            marginTop: 18, paddingTop: 16,
            borderTop: '1px solid rgba(242,235,221,0.18)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{
              fontFamily: F_DISP, fontSize: 16, fontWeight: 500,
              letterSpacing: '0.24em',
            }}>BEGIN RITE →</div>
            <div style={{
              fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.15em',
              opacity: 0.5,
            }}>001 / 008</div>
          </div>
        </div>
      </div>

      <KNTabBar active="LIFT" />
      <Grain opacity={0.09} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2 — CHAPTERS (Workout Overview)
// ─────────────────────────────────────────────────────────────
function KNChaptersScreen() {
  const blocks = [
    {
      letter: 'A', name: 'COMPOUND', color: PAL.chest,
      exercises: [
        { n: 1, name: 'BENCH PRESS',       sets: '4×5', status: 'done', muscle: 'CHEST' },
        { n: 2, name: 'INCLINE DB PRESS',  sets: '3×8', status: 'done', muscle: 'UPPER CHEST' },
      ],
    },
    {
      letter: 'B', name: 'PRESS & DELTS', color: PAL.shoulders,
      exercises: [
        { n: 3, name: 'STRICT PRESS',      sets: '4×6', status: 'done', muscle: 'SHOULDERS' },
        { n: 4, name: 'LATERAL RAISE',     sets: '3×12', status: 'partial', muscle: 'SIDE DELT' },
        { n: 5, name: 'FACE PULL',         sets: '3×15', status: 'pending', muscle: 'REAR DELT' },
      ],
    },
    {
      letter: 'C', name: 'ACCESSORIES', color: PAL.arms,
      exercises: [
        { n: 6, name: 'DIP',               sets: '3×10', status: 'pending', muscle: 'TRICEPS' },
        { n: 7, name: 'CABLE PUSHDOWN',    sets: '3×12', status: 'pending', muscle: 'TRICEPS' },
        { n: 8, name: 'SKULL CRUSHER',     sets: '3×10', status: 'pending', muscle: 'TRICEPS' },
      ],
    },
  ];

  const statusIcon = (s) => s === 'done' ? '■' : s === 'partial' ? '◧' : '□';

  return (
    <div style={{
      width: 402, height: 874, position: 'relative',
      background: PAL.bone, color: PAL.void,
      fontFamily: F_DISP, overflow: 'hidden',
    }}>
      <BrutalStatusBar />

      {/* header */}
      <div style={{ paddingTop: 58 }}>
        <div style={{
          padding: '0 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.22em',
        }}>
          <span>× END</span>
          <span style={{ opacity: 0.6 }}>DAY 03 — UPPER PUSH</span>
          <span>48:12</span>
        </div>
        <div style={{ height: 14 }} />
        <Rule />
      </div>

      {/* title */}
      <div style={{ padding: '16px 18px 10px' }}>
        <div style={{
          fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.25em',
          opacity: 0.55, marginBottom: 10,
        }}>
          § THE MANIFEST
        </div>
        <div style={{
          fontFamily: F_DISP, fontWeight: 500,
          fontSize: 48, lineHeight: 0.86,
          letterSpacing: '-0.025em', textTransform: 'uppercase',
        }}>
          UPPER PUSH<br/>
          <span style={{ color: PAL.spice }}>/ STRENGTH</span>
        </div>

        {/* summary stats */}
        <div style={{
          marginTop: 18,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: `1px solid ${PAL.void}`,
          borderBottom: `1px solid ${PAL.void}`,
        }}>
          {[
            ['BLOCKS', '003'],
            ['MVMTS', '008'],
            ['VOL·LBS', '9,240'],
            ['EST·MIN', '048'],
          ].map(([k, v], i, a) => (
            <div key={k} style={{
              padding: '10px 8px',
              borderRight: i < a.length - 1 ? `1px solid ${PAL.rule}` : 'none',
            }}>
              <div style={{
                fontFamily: F_MONO, fontSize: 8.5, letterSpacing: '0.2em',
                opacity: 0.55,
              }}>{k}</div>
              <div style={{
                fontFamily: F_DISP, fontSize: 20, fontWeight: 500,
                letterSpacing: '0.02em', marginTop: 2,
              }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* blocks */}
      <div style={{ padding: '0 18px' }}>
        {blocks.map(block => (
          <div key={block.letter} style={{ marginBottom: 12 }}>
            {/* block header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 4,
            }}>
              <div style={{
                width: 26, height: 26,
                background: block.color, color: PAL.bone,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: F_DISP, fontSize: 14, fontWeight: 600,
              }}>{block.letter}</div>
              <span style={{
                fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.18em',
                opacity: 0.7,
              }}>{block.name}</span>
              <span style={{
                fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.18em',
                opacity: 0.5, marginLeft: 'auto',
              }}>
                {block.exercises.filter(e => e.status === 'done').length}/{block.exercises.length}
              </span>
            </div>
            <Rule color={PAL.void} />

            {/* exercises */}
            {block.exercises.map(ex => (
              <div key={ex.n} style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 52px 24px',
                gap: 8,
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: `1px solid ${PAL.rule}`,
                opacity: ex.status === 'pending' ? 0.4 : 1,
              }}>
                <div style={{
                  fontFamily: F_MONO, fontSize: 9, opacity: 0.5,
                }}>{zpad(ex.n)}</div>
                <div>
                  <div style={{
                    fontFamily: F_DISP, fontSize: 16, fontWeight: 500,
                    letterSpacing: '0.02em',
                  }}>{ex.name}</div>
                  <div style={{
                    fontFamily: F_MONO, fontSize: 8, letterSpacing: '0.14em',
                    opacity: 0.55, marginTop: 1,
                  }}>{ex.muscle}</div>
                </div>
                <div style={{
                  fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.08em',
                  textAlign: 'right',
                }}>{ex.sets}</div>
                <div style={{
                  textAlign: 'right', fontSize: 14,
                  color: ex.status === 'done' ? PAL.spice : PAL.void,
                }}>{statusIcon(ex.status)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* bottom action */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: PAL.spice, color: PAL.bone,
        padding: '22px 18px 34px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.22em',
            opacity: 0.75,
          }}>RESUME →</div>
          <div style={{
            fontFamily: F_DISP, fontSize: 28, fontWeight: 600,
            letterSpacing: '0.06em', lineHeight: 1,
          }}>BLOCK B</div>
        </div>
        <div style={{
          fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.18em',
          opacity: 0.75, textAlign: 'right', lineHeight: 1.5,
        }}>
          004/008<br/>48:12
        </div>
      </div>

      <Grain opacity={0.09} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 3 — FOCUS (Active Session)
// ─────────────────────────────────────────────────────────────
function KNFocusScreen() {
  const sets = [
    { n: 1, weight: '135', reps: '6', rpe: '6.0', status: 'done' },
    { n: 2, weight: '155', reps: '6', rpe: '7.0', status: 'done' },
    { n: 3, weight: '165', reps: '6', rpe: '8.0', status: 'done' },
    { n: 4, weight: '165', reps: '—', rpe: '—',   status: 'active' },
    { n: 5, weight: '165', reps: '—', rpe: '—',   status: 'pending' },
    { n: 6, weight: '155', reps: '—', rpe: '—',   status: 'pending' },
  ];

  const exercises = [1,2,3,4,5];
  const currentEx = 3;

  return (
    <div style={{
      width: 402, height: 874, position: 'relative',
      background: PAL.void, color: PAL.bone,
      fontFamily: F_DISP, overflow: 'hidden',
    }}>
      <BrutalStatusBar fg={PAL.bone} />

      {/* header */}
      <div style={{ paddingTop: 58 }}>
        <div style={{
          padding: '0 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.22em',
          color: PAL.bone, opacity: 0.65,
        }}>
          <span>← OVERVIEW</span>
          <span>SET {zpad(4)} / {zpad(6)}</span>
          <span>⏸ PAUSE</span>
        </div>
        <div style={{ height: 14 }} />
        <div style={{ height: 1, background: 'rgba(242,235,221,0.12)' }} />
      </div>

      {/* exercise navigation dots */}
      <div style={{
        padding: '14px 18px 0',
        display: 'flex', gap: 6, alignItems: 'center',
      }}>
        {exercises.map(n => (
          <div key={n} style={{
            width: 28, height: 28,
            background: n < currentEx ? PAL.bone : n === currentEx ? 'transparent' : 'transparent',
            border: n === currentEx ? `2px solid ${PAL.spice}` : n < currentEx ? 'none' : `1px solid rgba(242,235,221,0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: F_MONO, fontSize: 10,
            color: n < currentEx ? PAL.void : n === currentEx ? PAL.spice : PAL.bone,
            opacity: n > currentEx ? 0.3 : 1,
          }}>{n}</div>
        ))}
        <span style={{
          fontFamily: F_MONO, fontSize: 8.5, letterSpacing: '0.18em',
          opacity: 0.4, marginLeft: 'auto',
        }}>BLOCK B</span>
      </div>

      {/* exercise identity */}
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{
          fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.25em',
          opacity: 0.55, marginBottom: 8,
        }}>
          № 003 — MOVEMENT
        </div>
        <div style={{
          fontFamily: F_DISP, fontWeight: 500,
          fontSize: 42, lineHeight: 0.9,
          letterSpacing: '-0.02em', textTransform: 'uppercase',
        }}>
          STRICT<br/>PRESS
        </div>
        <div style={{
          marginTop: 12,
          display: 'flex', gap: 18,
          fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.16em',
          opacity: 0.7,
        }}>
          <span>SHOULDERS</span>
          <span>·</span>
          <span>TRICEPS</span>
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.14em',
          opacity: 0.35,
        }}>
          PREV: 155×6 @ RPE 7.5
        </div>
      </div>

      {/* set logging table */}
      <div style={{ padding: '20px 18px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '36px 1fr 1fr 52px 28px',
          gap: 4,
          fontFamily: F_MONO, fontSize: 8.5, letterSpacing: '0.2em',
          opacity: 0.5, paddingBottom: 6,
        }}>
          <span>SET</span>
          <span>WEIGHT</span>
          <span>REPS</span>
          <span style={{ textAlign: 'right' }}>RPE</span>
          <span style={{ textAlign: 'right' }}></span>
        </div>
        <div style={{ height: 1, background: PAL.bone }} />

        {sets.map(s => (
          <div key={s.n} style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 1fr 52px 28px',
            gap: 4,
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid rgba(242,235,221,0.08)',
            borderLeft: s.status === 'active' ? `3px solid ${PAL.spice}` : '3px solid transparent',
            paddingLeft: s.status === 'active' ? 8 : 0,
            opacity: s.status === 'pending' ? 0.35 : 1,
          }}>
            <span style={{
              fontFamily: F_MONO, fontSize: 10, opacity: 0.6,
            }}>{zpad(s.n, 2)}</span>
            <span style={{
              fontFamily: F_DISP, fontSize: 22, fontWeight: 500,
              letterSpacing: '0.02em',
            }}>
              {s.weight}
              <span style={{
                fontFamily: F_MONO, fontSize: 9, marginLeft: 3,
                opacity: 0.55, letterSpacing: '0.12em',
              }}>LBS</span>
            </span>
            <span style={{
              fontFamily: F_DISP, fontSize: 22, fontWeight: 500,
            }}>
              {s.reps}
              {s.reps !== '—' && <span style={{
                fontFamily: F_MONO, fontSize: 9, marginLeft: 3,
                opacity: 0.55, letterSpacing: '0.12em',
              }}>REP</span>}
            </span>
            <span style={{
              textAlign: 'right',
              fontFamily: F_MONO, fontSize: 11, letterSpacing: '0.08em',
            }}>{s.rpe}</span>
            <span style={{
              textAlign: 'right', fontSize: 14,
              color: s.status === 'done' ? PAL.spice : PAL.bone,
            }}>
              {s.status === 'done' ? '■' : s.status === 'active' ? '▸' : '□'}
            </span>
          </div>
        ))}
      </div>

      {/* session stats strip */}
      <div style={{
        position: 'absolute', bottom: 76, left: 18, right: 18,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.18em',
        opacity: 0.45,
        borderTop: '1px solid rgba(242,235,221,0.1)',
        paddingTop: 10,
      }}>
        <span>VOL 4,860 LBS</span>
        <span>SETS 14/24</span>
        <span>PRs 1</span>
        <span>+52:38</span>
      </div>

      {/* bottom action */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: PAL.spice, color: PAL.bone,
        padding: '20px 18px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{
          fontFamily: F_DISP, fontSize: 28, fontWeight: 600,
          letterSpacing: '0.08em',
        }}>LOG SET →</div>
        <div style={{
          fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.18em',
          opacity: 0.75,
        }}>+52:38</div>
      </div>

      <Grain opacity={0.11} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 4 — REST TIMER
// ─────────────────────────────────────────────────────────────
function KNRestTimerScreen() {
  return (
    <div style={{
      width: 402, height: 874, position: 'relative',
      background: PAL.void, color: PAL.bone,
      fontFamily: F_DISP, overflow: 'hidden',
    }}>
      <BrutalStatusBar fg={PAL.bone} />

      {/* header */}
      <div style={{ paddingTop: 58 }}>
        <div style={{
          padding: '0 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.22em',
          color: PAL.bone, opacity: 0.65,
        }}>
          <span>× SKIP</span>
          <span>REST PERIOD</span>
          <span>← BACK</span>
        </div>
        <div style={{ height: 14 }} />
        <div style={{ height: 1, background: 'rgba(242,235,221,0.12)' }} />
      </div>

      {/* context */}
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{
          fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.2em',
          opacity: 0.45,
        }}>
          BETWEEN SETS — STRICT PRESS
        </div>
        <div style={{
          fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.16em',
          opacity: 0.35, marginTop: 4,
        }}>
          SET 003 OF 006 COMPLETE
        </div>
      </div>

      {/* giant timer */}
      <div style={{
        position: 'absolute', top: 250, left: 0, right: 0,
        textAlign: 'center', padding: '0 12px',
      }}>
        <div style={{
          fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.3em',
          color: PAL.spice, marginBottom: 16,
        }}>
          — REST —
        </div>
        <div style={{
          fontFamily: F_DISP, fontWeight: 600,
          fontSize: 186, lineHeight: 0.82,
          letterSpacing: '-0.05em',
          color: PAL.bone,
          fontVariantNumeric: 'tabular-nums',
        }}>
          01:48
        </div>

        {/* segmented bar */}
        <div style={{
          display: 'flex', gap: 3, margin: '26px 28px 0',
        }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 10,
              background: i < 22 ? PAL.spice : 'rgba(242,235,221,0.12)',
            }} />
          ))}
        </div>
        <div style={{
          marginTop: 10,
          display: 'flex', justifyContent: 'space-between',
          padding: '0 28px',
          fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.2em',
          opacity: 0.55,
        }}>
          <span>00:00</span>
          <span>150"</span>
        </div>
      </div>

      {/* rest duration selector */}
      <div style={{
        position: 'absolute', top: 540, left: 28, right: 28,
      }}>
        <div style={{
          fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.22em',
          opacity: 0.45, marginBottom: 8,
        }}>REST DURATION</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[60, 90, 120, 150, 180].map(s => (
            <div key={s} style={{
              flex: 1, padding: '10px 0',
              border: s === 150
                ? `2px solid ${PAL.spice}`
                : '1px solid rgba(242,235,221,0.15)',
              background: s === 150 ? PAL.spice : 'transparent',
              color: PAL.bone,
              textAlign: 'center',
              fontFamily: F_MONO, fontSize: 11, letterSpacing: '0.08em',
            }}>{s}s</div>
          ))}
        </div>
      </div>

      {/* next set preview */}
      <div style={{
        position: 'absolute', bottom: 100, left: 18, right: 18,
      }}>
        <div style={{
          fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.22em',
          opacity: 0.45, marginBottom: 8,
        }}>NEXT UP</div>
        <div style={{ height: 1, background: 'rgba(242,235,221,0.15)' }} />
        <div style={{
          padding: '12px 0',
          display: 'flex', justifyContent: 'space-between',
          fontFamily: F_MONO, fontSize: 11, letterSpacing: '0.12em',
        }}>
          <span>SET 004</span>
          <span>165 LBS</span>
          <span>6 REPS</span>
          <span style={{ opacity: 0.5 }}>RPE 8.5</span>
        </div>
      </div>

      {/* bottom action */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: PAL.spice, color: PAL.bone,
        padding: '20px 18px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{
          fontFamily: F_DISP, fontSize: 28, fontWeight: 600,
          letterSpacing: '0.08em',
        }}>SKIP REST →</div>
        <div style={{
          fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.18em',
          opacity: 0.75,
        }}>01:48</div>
      </div>

      <Grain opacity={0.11} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 5 — HISTORY + PRs
// ─────────────────────────────────────────────────────────────
function KNHistoryScreen() {
  const weeks = [
    6800, 8400, 7200, 9600, 8800, 10200, 9400, 11200,
    10800, 12400, 11600, 9240,
  ];
  const maxW = Math.max(...weeks);

  const prs = [
    { name: 'BENCH PRESS',  best: '185×5',  e1rm: '214', date: '2026·04·16' },
    { name: 'BACK SQUAT',   best: '275×3',  e1rm: '301', date: '2026·04·10' },
    { name: 'DEADLIFT',     best: '315×2',  e1rm: '334', date: '2026·03·28' },
    { name: 'STRICT PRESS', best: '135×5',  e1rm: '156', date: '2026·04·18' },
  ];

  const sessions = [
    { d: 'APR 20', p: '03.A', name: 'UPPER / PUSH',     vol: '9,240',  note: 'PR — STRICT PRESS 135×5' },
    { d: 'APR 18', p: '04.B', name: 'LOWER / PULL',     vol: '11,600', note: 'HAMSTRING TIGHT L' },
    { d: 'APR 17', p: '01.A', name: 'UPPER / PULL',     vol: '8,820',  note: '—' },
    { d: 'APR 16', p: '02.A', name: 'LOWER / PUSH',     vol: '12,400', note: 'PR — SQUAT 275×3' },
    { d: 'APR 14', p: '03.A', name: 'UPPER / PUSH',     vol: '8,960',  note: 'BENCH 185×4 RPE 9.5' },
  ];

  return (
    <div style={{
      width: 402, height: 874, position: 'relative',
      background: PAL.bone, color: PAL.void,
      fontFamily: F_DISP, overflow: 'hidden',
    }}>
      <BrutalStatusBar />

      <div style={{ paddingTop: 58 }}>
        <CoordStrip left="§ ARCHIVE — 00.047" right="WK 06 / 16" />
        <div style={{ height: 14 }} />
        <Rule />
      </div>

      {/* title */}
      <div style={{ padding: '16px 18px 6px' }}>
        <div style={{
          fontFamily: F_DISP, fontWeight: 500,
          fontSize: 56, lineHeight: 0.86,
          letterSpacing: '-0.025em', textTransform: 'uppercase',
        }}>
          THE<br/>LOG
        </div>
      </div>

      {/* volume chart */}
      <div style={{ padding: '10px 18px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.22em',
          opacity: 0.55, marginBottom: 6,
        }}>
          <span>VOL · LBS / WK</span>
          <span>PEAK 12,400</span>
        </div>
        <div style={{
          height: 100, display: 'flex', alignItems: 'flex-end',
          gap: 4, borderBottom: `1px solid ${PAL.void}`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `${(10000 / maxW) * 100}%`,
            borderTop: '1px dashed rgba(10,9,8,0.25)',
          }} />
          {weeks.map((v, i) => (
            <div key={i} style={{
              flex: 1,
              height: `${(v / maxW) * 100}%`,
              background: i === weeks.length - 1 ? PAL.spice : PAL.void,
              position: 'relative',
            }}>
              {i === weeks.length - 1 && (
                <div style={{
                  position: 'absolute', top: -16, left: '50%',
                  transform: 'translateX(-50%)',
                  fontFamily: F_MONO, fontSize: 8, letterSpacing: '0.1em',
                  color: PAL.spice, whiteSpace: 'nowrap',
                }}>9.2K</div>
              )}
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: F_MONO, fontSize: 8, letterSpacing: '0.15em',
          opacity: 0.45, marginTop: 4,
        }}>
          <span>W01</span><span>W04</span><span>W08</span><span>W12</span>
        </div>
      </div>

      {/* stats row */}
      <div style={{
        margin: '14px 18px 10px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        border: `1px solid ${PAL.void}`,
      }}>
        {[
          ['SESSIONS', '047', '/ 96'],
          ['STREAK', '11', 'DAYS'],
          ['PRs', '04', 'NEW'],
        ].map(([k, v, s], i, a) => (
          <div key={k} style={{
            padding: '10px 10px',
            borderRight: i < a.length - 1 ? `1px solid ${PAL.void}` : 'none',
          }}>
            <div style={{
              fontFamily: F_MONO, fontSize: 8.5, letterSpacing: '0.2em',
              opacity: 0.55,
            }}>{k}</div>
            <div style={{
              fontFamily: F_DISP, fontSize: 28, fontWeight: 500,
              letterSpacing: '0.02em', lineHeight: 1,
              marginTop: 3,
            }}>{v}</div>
            <div style={{
              fontFamily: F_MONO, fontSize: 8.5, letterSpacing: '0.16em',
              opacity: 0.5, marginTop: 2,
            }}>{s}</div>
          </div>
        ))}
      </div>

      {/* PR table */}
      <div style={{ padding: '6px 18px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.22em',
          opacity: 0.55, marginBottom: 4,
        }}>
          <span>§ PERSONAL RECORDS</span>
          <span>N={zpad(prs.length, 2)}</span>
        </div>
        <Rule color={PAL.void} />
        {prs.map((r, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 68px 50px 82px',
            alignItems: 'baseline',
            padding: '8px 0',
            borderBottom: `1px solid ${PAL.rule}`,
          }}>
            <div style={{
              fontFamily: F_DISP, fontSize: 15, fontWeight: 500,
              letterSpacing: '0.04em',
            }}>{r.name}</div>
            <div style={{
              fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.06em',
            }}>{r.best}</div>
            <div style={{
              fontFamily: F_DISP, fontSize: 18, fontWeight: 500,
              color: i === 0 ? PAL.spice : PAL.void,
              textAlign: 'right',
            }}>
              {r.e1rm}
            </div>
            <div style={{
              textAlign: 'right',
              fontFamily: F_MONO, fontSize: 8.5, letterSpacing: '0.1em',
              opacity: 0.5,
            }}>{r.date}</div>
          </div>
        ))}
      </div>

      {/* session log */}
      <div style={{ padding: '10px 18px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.22em',
          opacity: 0.55, marginBottom: 4,
        }}>
          <span>ENTRIES — RECENT</span>
          <span>↓ 047</span>
        </div>
        <Rule color={PAL.void} />
        {sessions.map((e, i) => (
          <div key={i} style={{
            padding: '9px 0',
            borderBottom: `1px solid ${PAL.rule}`,
            display: 'grid',
            gridTemplateColumns: '52px 1fr 58px',
            gap: 8, alignItems: 'baseline',
          }}>
            <div>
              <div style={{
                fontFamily: F_DISP, fontSize: 15, fontWeight: 500,
                letterSpacing: '0.02em', lineHeight: 1,
              }}>{e.d}</div>
              <div style={{
                fontFamily: F_MONO, fontSize: 8, letterSpacing: '0.16em',
                opacity: 0.45, marginTop: 2,
              }}>{e.p}</div>
            </div>
            <div>
              <div style={{
                fontFamily: F_DISP, fontSize: 14, fontWeight: 500,
                letterSpacing: '0.04em',
              }}>{e.name}</div>
              <div style={{
                fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.08em',
                opacity: 0.55, marginTop: 1,
                color: e.note.startsWith('PR') ? PAL.spice : PAL.void,
              }}>{e.note}</div>
            </div>
            <div style={{
              textAlign: 'right',
              fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.08em',
            }}>{e.vol}</div>
          </div>
        ))}
      </div>

      <KNTabBar active="LOG" />
      <Grain opacity={0.09} />
    </div>
  );
}

Object.assign(window, {
  KNHomeScreen, KNChaptersScreen, KNFocusScreen, KNRestTimerScreen, KNHistoryScreen,
});

window.SKIN_META = {
  tag: '§ PROJECT — K&N LIFTS / BRUTALIST RESKIN / EXPLORATION',
  title: 'K&N LIFTS — <span style="color:#C2410C">RESKINNED</span>',
  description: 'Your actual screens — day picker, chapters, focus view, rest timer, history — reimagined with brutalist typography, flat matte blocks, hairline rules, and the spice / ochre / dune / void palette. No shadows. No rounded corners.',
  specs: 'TYPE · OSWALD (DISPLAY) / JETBRAINS MONO (DATA)  ·  PALETTE · #C2410C / #8B3A1A / #A87732 / #D6B88A / #0A0908  ·  NO GRADIENTS / NO SHADOWS / NO ROUNDED CORNERS  ·  K&N LIFTS DATA / VANILLA JS ARCHITECTURE',
  sections: [
    {
      title: 'Core flow',
      subtitle: 'Home · Workout Chapters · Active Focus',
      gap: 56,
      screens: [
        { label: '01 — HOME / TODAY',      component: 'KNHomeScreen' },
        { label: '02 — WORKOUT CHAPTERS',  component: 'KNChaptersScreen' },
        { label: '03 — ACTIVE FOCUS',      component: 'KNFocusScreen' },
      ],
    },
    {
      title: 'Session & History',
      subtitle: 'Rest Timer · The Log',
      gap: 56,
      screens: [
        { label: '04 — REST TIMER',    component: 'KNRestTimerScreen' },
        { label: '05 — HISTORY + PRs', component: 'KNHistoryScreen' },
      ],
    },
  ],
};
