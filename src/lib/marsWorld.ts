export type GenieInputKey =
  | 'key_w'
  | 'key_a'
  | 'key_s'
  | 'key_d'
  | 'arrow_up'
  | 'arrow_down'
  | 'arrow_left'
  | 'arrow_right';

export interface MarsSector {
  id: string;
  name: string;
  englishName: string;
  regionLabel: string;
  coordinates: string;
  elevation: string;
  pressure: string;
  temperature: string;
  gravity: string;
  vehicleMode: string;
  summary: string;
  imagePath: string;
  worldPrompt: string;
}

export interface SteerPreset {
  id: string;
  keyHint: string;
  keyCode: string;
  label: string;
  prompt: string;
}

export interface WorldSetupPayload {
  event_type: 'world_setup';
  world_prompt: {
    text: string;
  };
  reference_image?: {
    mime_type: 'image/jpeg';
    data: string;
  };
}

export const MAX_SESSION_SECONDS = 120;
export const WEBRTC_MAX_PAYLOAD_BYTES = 64 * 1024;
export const STEER_COOLDOWN_MS = 2000;

export const GENIE_MOVEMENT_KEYS: readonly GenieInputKey[] = [
  'key_w',
  'key_a',
  'key_s',
  'key_d',
  'arrow_up',
  'arrow_down',
  'arrow_left',
  'arrow_right',
] as const;

export const MARS_SECTORS: readonly MarsSector[] = [
  {
    id: 'jezero-crater',
    name: '毅力号陨石坑三角洲',
    englishName: 'Jezero Crater Delta',
    regionLabel: '古湖泊沉积扇区',
    coordinates: '18.38°N · 77.58°E',
    elevation: '-2,569 m',
    pressure: '6.1 hPa',
    temperature: '-63 °C',
    gravity: '3.72 m/s²',
    vehicleMode: '六轮核动力漫游车',
    summary: '沿远古河床砾石与层状赤铁矿崖壁前行，观察风蚀沉积岩层与车辙扬尘物理反馈。',
    imagePath: '/src/assets/images/mars_jezero_rover_1795281251467.jpg',
    worldPrompt:
      'Continuous first-person Mars science rover masthead POV rolling steadily forward across iron-oxide regolith and layered sedimentary delta cliffs in Jezero Crater under a pale salmon Martian sky. Twin front wheels kick up fine rust dust trails over scattered basalt rocks, crisp gravel crunch and mechanical suspension articulation foley, no camera cuts, continuous forward propulsion.',
  },
  {
    id: 'valles-marineris',
    name: '水手号峡谷悬崖',
    englishName: 'Valles Marineris Rim',
    regionLabel: '赤道构造裂谷带',
    coordinates: '13.90°S · 300.80°E',
    elevation: '+1,420 m',
    pressure: '7.8 hPa',
    temperature: '-48 °C',
    gravity: '3.72 m/s²',
    vehicleMode: '低空增压贴地滑翔器',
    summary: '贴近 7 公里深红褐砂岩断崖低空掠飞，穿行于午后金色尘霾与峡谷上升气流之间。',
    imagePath: '/src/assets/images/mars_valles_marineris_1795281251371.jpg',
    worldPrompt:
      'Continuous first-person pressurized Mars exploration skimmer POV gliding smoothly forward along the towering rust-red sandstone rim of Valles Marineris canyon in late afternoon sunlight. Vast deep chasm veiled in golden atmospheric dust haze drops away below, crisp rushing thin Martian wind against the airframe foley, no camera cuts, steady forward propulsion.',
  },
  {
    id: 'arcadia-outpost',
    name: '阿卡迪亚科研基地',
    englishName: 'Arcadia Planitia Outpost',
    regionLabel: '北半球玄武岩平原',
    coordinates: '46.70°N · 188.00°E',
    elevation: '-3,890 m',
    pressure: '6.4 hPa',
    temperature: '-71 °C',
    gravity: '3.72 m/s²',
    vehicleMode: '科考漫游车 / 舱外巡检',
    summary: '穿越平坦玄武岩风化层接近加压穹顶居住舱、折叠太阳翼与深空测控天线阵。',
    imagePath: '/src/assets/images/mars_ares_habitat_1795281252145.jpg',
    worldPrompt:
      'Continuous first-person Mars expedition rover POV advancing smoothly across flat dark basalt plains in Arcadia Planitia toward dust-coated geodesic white research domes, solar array wings, and a deep-space telemetry dish. Firm packed red soil crunches beneath tires with subtle wind grit foley, no camera cuts, steady forward travel.',
  },
  {
    id: 'olympus-lava-tube',
    name: '奥林匹斯熔岩管洞穴',
    englishName: 'Olympus Mons Lava Tube',
    regionLabel: '盾状火山地下熔岩道',
    coordinates: '18.65°N · 226.20°E',
    elevation: '+6,140 m',
    pressure: '4.2 hPa',
    temperature: '-82 °C',
    gravity: '3.72 m/s²',
    vehicleMode: '洞穴探照激光探测车',
    summary: '开启双束探照灯深入奥林匹斯山地下玄武岩熔岩管，追踪天窗日光柱与悬浮尘粒。',
    imagePath: '/src/assets/images/mars_olympus_lava_tube_1795281251524.jpg',
    worldPrompt:
      'Continuous first-person Mars cave exploration rover POV driving forward into a massive dark volcanic basalt lava tube cavern beneath Olympus Mons. Twin bright LED floodlights cut through suspended Martian dust motes toward a warm circular skylight shaft ahead, crisp crunch of volcanic scree under wheels and hollow cavern echo foley, no camera cuts, steady forward motion.',
  },
] as const;

export const STEER_PRESETS: readonly SteerPreset[] = [
  {
    id: 'boost-speed',
    keyHint: 'Space',
    keyCode: 'Space',
    label: '加速推进',
    prompt:
      'Increase forward travel speed smoothly over the Martian terrain, kicking up denser fine rust dust behind the vehicle with crisp gravel and wind foley.',
  },
  {
    id: 'dust-storm',
    keyHint: 'Q',
    keyCode: 'KeyQ',
    label: '沙尘暴来袭',
    prompt:
      'A dense Martian dust storm sweeps across the landscape with swirling rust-orange dust clouds, reduced visibility, and strong wind gusts rattling across the rocks.',
  },
  {
    id: 'floodlights',
    keyHint: 'E',
    keyCode: 'KeyE',
    label: '开启探照灯',
    prompt:
      'Switch on powerful dual white rover floodlights casting crisp volumetric beams across nearby Martian boulders, craters, and suspended dust.',
  },
  {
    id: 'blue-sunset',
    keyHint: 'R',
    keyCode: 'KeyR',
    label: '火星蓝色日落',
    prompt:
      'Transition the Martian sky toward a cool blue-tinted twilight sunset around the sun while long dramatic amber shadows stretch across the red regolith.',
  },
] as const;

const KEYBOARD_TO_GENIE: Record<string, GenieInputKey> = {
  KeyW: 'key_w',
  KeyA: 'key_a',
  KeyS: 'key_s',
  KeyD: 'key_d',
  ArrowUp: 'arrow_up',
  ArrowDown: 'arrow_down',
  ArrowLeft: 'arrow_left',
  ArrowRight: 'arrow_right',
};

export function mapKeyboardToGenieInput(code: string): GenieInputKey | null {
  return KEYBOARD_TO_GENIE[code] ?? null;
}

export function mapKeyboardToSteerPreset(code: string): SteerPreset | null {
  return STEER_PRESETS.find((preset) => preset.keyCode === code) ?? null;
}

export function validateWorldPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error('请输入有效的火星世界提示词，或选择一个着陆区预设。');
  }
  if (trimmed.length > 2400) {
    throw new Error('世界提示词过长，请精简至 2400 个字符以内。');
  }
  return trimmed;
}

export function buildWorldSetupPayload(
  prompt: string,
  referenceImageBase64?: string | null,
): WorldSetupPayload {
  const text = validateWorldPrompt(prompt);
  const payload: WorldSetupPayload = {
    event_type: 'world_setup',
    world_prompt: {text},
  };

  if (referenceImageBase64 && referenceImageBase64.trim().length > 0) {
    const cleanBase64 = referenceImageBase64
      .trim()
      .replace(/^data:image\/jpeg;base64,/, '');
    payload.reference_image = {
      mime_type: 'image/jpeg',
      data: cleanBase64,
    };
  }

  const serializedBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (serializedBytes >= WEBRTC_MAX_PAYLOAD_BYTES) {
    throw new Error(
      `首帧引导数据 (${Math.ceil(serializedBytes / 1024)} KB) 超出 WebRTC 64 KB 限制，请关闭首帧视觉引导或精简提示词。`,
    );
  }

  return payload;
}

export function createSteerCooldown(cooldownMs = STEER_COOLDOWN_MS) {
  let cooldownUntil = 0;

  return {
    tryAcquire(now = Date.now()): boolean {
      if (now < cooldownUntil) {
        return false;
      }
      cooldownUntil = now + cooldownMs;
      return true;
    },
    remainingMs(now = Date.now()): number {
      return Math.max(0, cooldownUntil - now);
    },
    reset(): void {
      cooldownUntil = 0;
    },
  };
}

export function formatSessionTimer(remainingSeconds: number): string {
  const clamped = Math.max(0, Math.floor(remainingSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
