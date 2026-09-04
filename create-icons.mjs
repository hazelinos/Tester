// Script untuk generate ikon PWA sederhana tanpa dependency tambahan
// Jalankan: node create-icons.mjs

import { writeFileSync } from 'fs';
import { createCanvas } from 'canvas';

const sizes = [192, 512];

for (const size of sizes) {
  try {
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background gelap rounded
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    const r = size * 0.22;
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    // Inner green
    ctx.fillStyle = '#1E3A2F';
    ctx.beginPath();
    const ir = size * 0.14;
    const ix = size * 0.12;
    const iw = size * 0.76;
    ctx.moveTo(ix + ir, ix);
    ctx.lineTo(ix + iw - ir, ix);
    ctx.quadraticCurveTo(ix + iw, ix, ix + iw, ix + ir);
    ctx.lineTo(ix + iw, ix + iw - ir);
    ctx.quadraticCurveTo(ix + iw, ix + iw, ix + iw - ir, ix + iw);
    ctx.lineTo(ix + ir, ix + iw);
    ctx.quadraticCurveTo(ix, ix + iw, ix, ix + iw - ir);
    ctx.lineTo(ix, ix + ir);
    ctx.quadraticCurveTo(ix, ix, ix + ir, ix);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.font = `${size * 0.45}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💰', size / 2, size / 2);

    writeFileSync(`public/icons/icon-${size}.png`, canvas.toBuffer('image/png'));
    console.log(`✓ icon-${size}.png`);
  } catch {
    console.log(`canvas module not found, using fallback for ${size}px`);
  }
}
