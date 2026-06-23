import React from 'react';
import heroPhoto from '../../src/client/public/hero-photo.png';
import { HeroPhotoFrame } from 'client';

export function Default() {
  return (
    <div style={{ padding: 32, background: 'var(--bg-page)', display: 'flex', justifyContent: 'center' }}>
      <HeroPhotoFrame photo={heroPhoto as string} />
    </div>
  );
}

export function Mobile() {
  return (
    <div style={{ padding: 32, background: 'var(--bg-page)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 375 }}>
        <HeroPhotoFrame photo={heroPhoto as string} />
      </div>
    </div>
  );
}
