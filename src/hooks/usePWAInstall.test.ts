import test from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatformFromNavigator } from './usePWAInstall';

test('detects iPhone Safari accurately', () => {
  const result = detectPlatformFromNavigator(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'iPhone',
    5
  );
  assert.equal(result.isIOS, true);
  assert.equal(result.isIPad, false);
  assert.equal(result.isAndroid, false);
  assert.equal(result.iosBrowser, 'safari');
});

test('detects iPadOS desktop-mode Safari via MacIntel + touch points', () => {
  const result = detectPlatformFromNavigator(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    'MacIntel',
    5
  );
  assert.equal(result.isIOS, true);
  assert.equal(result.isIPad, true);
  assert.equal(result.iosBrowser, 'safari');
});

test('detects iPhone Chrome (CriOS)', () => {
  const result = detectPlatformFromNavigator(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1',
    'iPhone',
    5
  );
  assert.equal(result.isIOS, true);
  assert.equal(result.iosBrowser, 'chrome');
});

test('detects iPhone WhatsApp / Instagram / Facebook in-app WebViews', () => {
  const instagram = detectPlatformFromNavigator(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F79 Instagram 330.0.0.23.92',
    'iPhone',
    5
  );
  assert.equal(instagram.isIOS, true);
  assert.equal(instagram.iosBrowser, 'in-app');

  const whatsappWkWebView = detectPlatformFromNavigator(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    'iPhone',
    5
  );
  assert.equal(whatsappWkWebView.isIOS, true);
  assert.equal(whatsappWkWebView.iosBrowser, 'in-app');

  const facebook = detectPlatformFromNavigator(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F79 [FBAN/FBIOS;FBAV/460.0.0]',
    'iPhone',
    5
  );
  assert.equal(facebook.isIOS, true);
  assert.equal(facebook.iosBrowser, 'in-app');
});

test('detects iPhone Firefox / Edge as other iOS browser', () => {
  const firefox = detectPlatformFromNavigator(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/126.0 Mobile/15E148 Safari/605.1.15',
    'iPhone',
    5
  );
  assert.equal(firefox.isIOS, true);
  assert.equal(firefox.iosBrowser, 'other');
});

test('detects Android Chrome as non-iOS', () => {
  const android = detectPlatformFromNavigator(
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    'Linux armv8l',
    5
  );
  assert.equal(android.isIOS, false);
  assert.equal(android.isAndroid, true);
  assert.equal(android.iosBrowser, null);
});
