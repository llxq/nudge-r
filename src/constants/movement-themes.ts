export interface MovementTheme {
  key: string;
  bg: string;
  glow1: string;
  glow2: string;
  illustrationBg: string;
  illustrationBorder: string;
  illustrationShadow: string;
  pulseShadow1: string;
  pulseShadow2: string;
  tipBg: string;
  tipBorder: string;
  tipColor: string;
  btnBg: string;
  btnShadow: string;
  subColor: string;
}

export const MOVEMENT_THEMES: MovementTheme[] = [
  {
    key: 'run',
    bg: 'linear-gradient(135deg, #0f1a2e 0%, #1a2a4a 60%, #0d2060 100%)',
    glow1: 'rgba(30,111,255,0.18)',
    glow2: 'rgba(100,200,255,0.10)',
    illustrationBg: 'linear-gradient(135deg, rgba(30,111,255,0.25), rgba(100,200,255,0.15))',
    illustrationBorder: 'rgba(100,180,255,0.25)',
    illustrationShadow: '0 0 60px rgba(30,111,255,0.3), 0 0 120px rgba(30,111,255,0.12)',
    pulseShadow1: '0 0 60px rgba(30,111,255,0.3), 0 0 120px rgba(30,111,255,0.12)',
    pulseShadow2: '0 0 80px rgba(30,111,255,0.5), 0 0 160px rgba(30,111,255,0.2)',
    tipBg: 'rgba(30,111,255,0.15)',
    tipBorder: 'rgba(30,111,255,0.3)',
    tipColor: 'rgba(160,200,255,0.9)',
    btnBg: 'rgba(30,111,255,0.9)',
    btnShadow: 'rgba(30,111,255,0.4)',
    subColor: 'rgba(180,210,255,0.75)',
  },
  {
    key: 'zen',
    bg: 'linear-gradient(135deg, #1a0f2e 0%, #2d1a4a 60%, #1a0d50 100%)',
    glow1: 'rgba(140,80,255,0.18)',
    glow2: 'rgba(200,140,255,0.10)',
    illustrationBg: 'linear-gradient(135deg, rgba(140,80,255,0.25), rgba(200,140,255,0.15))',
    illustrationBorder: 'rgba(180,120,255,0.25)',
    illustrationShadow: '0 0 60px rgba(140,80,255,0.3), 0 0 120px rgba(140,80,255,0.12)',
    pulseShadow1: '0 0 60px rgba(140,80,255,0.3), 0 0 120px rgba(140,80,255,0.12)',
    pulseShadow2: '0 0 80px rgba(140,80,255,0.5), 0 0 160px rgba(140,80,255,0.2)',
    tipBg: 'rgba(140,80,255,0.15)',
    tipBorder: 'rgba(140,80,255,0.3)',
    tipColor: 'rgba(210,170,255,0.9)',
    btnBg: 'rgba(140,80,255,0.9)',
    btnShadow: 'rgba(140,80,255,0.4)',
    subColor: 'rgba(210,180,255,0.75)',
  },
  {
    key: 'nature',
    bg: 'linear-gradient(135deg, #0a1f0f 0%, #143020 60%, #0d2810 100%)',
    glow1: 'rgba(40,180,80,0.18)',
    glow2: 'rgba(120,220,100,0.10)',
    illustrationBg: 'linear-gradient(135deg, rgba(40,180,80,0.25), rgba(120,220,100,0.15))',
    illustrationBorder: 'rgba(80,200,100,0.25)',
    illustrationShadow: '0 0 60px rgba(40,180,80,0.3), 0 0 120px rgba(40,180,80,0.12)',
    pulseShadow1: '0 0 60px rgba(40,180,80,0.3), 0 0 120px rgba(40,180,80,0.12)',
    pulseShadow2: '0 0 80px rgba(40,180,80,0.5), 0 0 160px rgba(40,180,80,0.2)',
    tipBg: 'rgba(40,180,80,0.15)',
    tipBorder: 'rgba(40,180,80,0.3)',
    tipColor: 'rgba(140,230,160,0.9)',
    btnBg: 'rgba(40,180,80,0.9)',
    btnShadow: 'rgba(40,180,80,0.4)',
    subColor: 'rgba(160,230,180,0.75)',
  },
  {
    key: 'fire',
    bg: 'linear-gradient(135deg, #2e0f00 0%, #4a1a00 60%, #601000 100%)',
    glow1: 'rgba(255,100,20,0.18)',
    glow2: 'rgba(255,180,60,0.10)',
    illustrationBg: 'linear-gradient(135deg, rgba(255,100,20,0.25), rgba(255,180,60,0.15))',
    illustrationBorder: 'rgba(255,150,60,0.25)',
    illustrationShadow: '0 0 60px rgba(255,100,20,0.3), 0 0 120px rgba(255,100,20,0.12)',
    pulseShadow1: '0 0 60px rgba(255,100,20,0.3), 0 0 120px rgba(255,100,20,0.12)',
    pulseShadow2: '0 0 80px rgba(255,100,20,0.5), 0 0 160px rgba(255,100,20,0.2)',
    tipBg: 'rgba(255,100,20,0.15)',
    tipBorder: 'rgba(255,100,20,0.3)',
    tipColor: 'rgba(255,200,140,0.9)',
    btnBg: 'rgba(220,80,10,0.9)',
    btnShadow: 'rgba(255,100,20,0.4)',
    subColor: 'rgba(255,200,160,0.75)',
  },
  {
    key: 'ocean',
    bg: 'linear-gradient(135deg, #001f2e 0%, #003040 60%, #001828 100%)',
    glow1: 'rgba(0,200,220,0.18)',
    glow2: 'rgba(60,220,255,0.10)',
    illustrationBg: 'linear-gradient(135deg, rgba(0,200,220,0.25), rgba(60,220,255,0.15))',
    illustrationBorder: 'rgba(40,210,240,0.25)',
    illustrationShadow: '0 0 60px rgba(0,200,220,0.3), 0 0 120px rgba(0,200,220,0.12)',
    pulseShadow1: '0 0 60px rgba(0,200,220,0.3), 0 0 120px rgba(0,200,220,0.12)',
    pulseShadow2: '0 0 80px rgba(0,200,220,0.5), 0 0 160px rgba(0,200,220,0.2)',
    tipBg: 'rgba(0,200,220,0.15)',
    tipBorder: 'rgba(0,200,220,0.3)',
    tipColor: 'rgba(140,240,255,0.9)',
    btnBg: 'rgba(0,180,200,0.9)',
    btnShadow: 'rgba(0,200,220,0.4)',
    subColor: 'rgba(160,240,255,0.75)',
  },
];
