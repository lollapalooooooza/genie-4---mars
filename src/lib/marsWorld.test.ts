import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MARS_SECTORS,
  STEER_PRESETS,
  WEBRTC_MAX_PAYLOAD_BYTES,
  buildWorldSetupPayload,
  createSteerCooldown,
  formatSessionTimer,
  mapKeyboardToGenieInput,
  mapKeyboardToSteerPreset,
  validateWorldPrompt,
} from './marsWorld';

test('MARS_SECTORS defines 4 distinct Mars presets with continuous POV prompts', () => {
  assert.equal(MARS_SECTORS.length, 4);
  const ids = new Set(MARS_SECTORS.map((s) => s.id));
  assert.equal(ids.size, 4);

  for (const sector of MARS_SECTORS) {
    assert.ok(sector.worldPrompt.length > 50, `${sector.id} should have rich prompt`);
    assert.match(sector.worldPrompt.toLowerCase(), /no camera cuts/);
    assert.match(sector.imagePath, /^\/src\/assets\/images\/mars_.*\.jpg$/);
  }
});

test('mapKeyboardToGenieInput maps only trained WASD and Arrow keys', () => {
  assert.equal(mapKeyboardToGenieInput('KeyW'), 'key_w');
  assert.equal(mapKeyboardToGenieInput('KeyA'), 'key_a');
  assert.equal(mapKeyboardToGenieInput('KeyS'), 'key_s');
  assert.equal(mapKeyboardToGenieInput('KeyD'), 'key_d');
  assert.equal(mapKeyboardToGenieInput('ArrowUp'), 'arrow_up');
  assert.equal(mapKeyboardToGenieInput('ArrowDown'), 'arrow_down');
  assert.equal(mapKeyboardToGenieInput('ArrowLeft'), 'arrow_left');
  assert.equal(mapKeyboardToGenieInput('ArrowRight'), 'arrow_right');

  // Untrained movement keys must return null (mapped to steering impulses instead)
  assert.equal(mapKeyboardToGenieInput('KeyE'), null);
  assert.equal(mapKeyboardToGenieInput('Space'), null);
  assert.equal(mapKeyboardToGenieInput('Escape'), null);
});

test('mapKeyboardToSteerPreset maps Space/Q/E/R to steering presets', () => {
  assert.equal(STEER_PRESETS.length, 4);
  assert.equal(mapKeyboardToSteerPreset('Space')?.id, 'boost-speed');
  assert.equal(mapKeyboardToSteerPreset('KeyQ')?.id, 'dust-storm');
  assert.equal(mapKeyboardToSteerPreset('KeyE')?.id, 'floodlights');
  assert.equal(mapKeyboardToSteerPreset('KeyR')?.id, 'blue-sunset');
  assert.equal(mapKeyboardToSteerPreset('KeyW'), null);
});

test('buildWorldSetupPayload adheres to strict protobuf schema without type field', () => {
  const payload = buildWorldSetupPayload('  Mars rover driving forward.  ', 'data:image/jpeg;base64,/9j/4AAQ');
  assert.equal(payload.event_type, 'world_setup');
  assert.deepEqual(payload.world_prompt, {text: 'Mars rover driving forward.'});
  assert.deepEqual(payload.reference_image, {
    mime_type: 'image/jpeg',
    data: '/9j/4AAQ',
  });
  assert.equal('type' in payload.world_prompt, false);
  assert.equal('type' in (payload.reference_image ?? {}), false);
});

test('buildWorldSetupPayload rejects empty prompts and oversized WebRTC payloads', () => {
  assert.throws(() => validateWorldPrompt('   '));
  assert.throws(() => buildWorldSetupPayload(''));

  const hugeBase64 = 'A'.repeat(WEBRTC_MAX_PAYLOAD_BYTES + 1024);
  assert.throws(() => buildWorldSetupPayload('Mars canyon flight', hugeBase64));
});

test('createSteerCooldown blocks overlapping impulses inside 2s window', () => {
  const cooldown = createSteerCooldown(2000);
  assert.equal(cooldown.tryAcquire(1000), true);
  assert.equal(cooldown.tryAcquire(1500), false);
  assert.equal(cooldown.remainingMs(1500), 1500);
  assert.equal(cooldown.tryAcquire(2999), false);
  assert.equal(cooldown.tryAcquire(3000), true);
  cooldown.reset();
  assert.equal(cooldown.remainingMs(3100), 0);
});

test('formatSessionTimer formats MM:SS cleanly with zero floor', () => {
  assert.equal(formatSessionTimer(120), '02:00');
  assert.equal(formatSessionTimer(65), '01:05');
  assert.equal(formatSessionTimer(5), '00:05');
  assert.equal(formatSessionTimer(0), '00:00');
  assert.equal(formatSessionTimer(-10), '00:00');
});
