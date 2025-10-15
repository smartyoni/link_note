import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - 그라데이션
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4a90e2');
  gradient.addColorStop(1, '#357abd');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // 링크 체인 아이콘 그리기
  const center = size / 2;
  const linkSize = size * 0.5;
  const lineWidth = size * 0.08;

  ctx.strokeStyle = 'white';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // 왼쪽 링크
  ctx.beginPath();
  ctx.arc(center - linkSize * 0.3, center, linkSize * 0.25, Math.PI * 0.3, Math.PI * 1.7);
  ctx.stroke();

  // 오른쪽 링크
  ctx.beginPath();
  ctx.arc(center + linkSize * 0.3, center, linkSize * 0.25, -Math.PI * 0.7, Math.PI * 0.7);
  ctx.stroke();

  // 중간 연결선
  ctx.beginPath();
  ctx.moveTo(center - linkSize * 0.15, center);
  ctx.lineTo(center + linkSize * 0.15, center);
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

// public 폴더 생성
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// 192x192 아이콘 생성
console.log('Generating 192x192 icon...');
const icon192 = generateIcon(192);
fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), icon192);
console.log('✓ icon-192x192.png created');

// 512x512 아이콘 생성
console.log('Generating 512x512 icon...');
const icon512 = generateIcon(512);
fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), icon512);
console.log('✓ icon-512x512.png created');

// 애플 터치 아이콘 (180x180)
console.log('Generating 180x180 apple-touch-icon...');
const icon180 = generateIcon(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), icon180);
console.log('✓ apple-touch-icon.png created');

console.log('\nAll icons generated successfully!');
