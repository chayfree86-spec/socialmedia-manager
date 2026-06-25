import React from 'react';
import {
  siInstagram, siFacebook, siYoutube, siWhatsapp,
  siPinterest, siGoogle,
} from 'simple-icons';

/**
 * Social Media Brand Icons using Simple Icons (simple-icons.org)
 * Support both badge styling (white logo on brand color background)
 * and plain styling (colored logo on transparent background)
 */

const BRAND_ICONS = {
  instagram:      { icon: siInstagram, color: '#E4405F', bg: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' },
  facebook:       { icon: siFacebook, color: '#1877F2', bg: '#1877F2' },
  youtube:        { icon: siYoutube, color: '#FF0000', bg: '#FF0000' },
  whatsapp:       { icon: siWhatsapp, color: '#25D366', bg: '#25D366' },
  google_business:{ icon: siGoogle, color: '#4285F4', bg: '#ffffff' },
  pinterest:      { icon: siPinterest, color: '#E60023', bg: '#E60023' },
  linkedin:       { icon: null, color: '#0A66C2', bg: '#0A66C2' },
  twitter:        { icon: null, color: '#1DA1F2', bg: '#1DA1F2' },
  tiktok:         { icon: null, color: '#010101', bg: '#010101' },
  threads:        { icon: null, color: '#000000', bg: '#000000' },
  custom_platform:{ icon: null, color: '#6366F1', bg: '#6366F1' },
};

// Official Google G SVG (multicolored)
const GoogleG = ({ size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M23.745 12.27c0-.77-.07-1.54-.2-2.27H12v4.51h6.6c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/>
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
  </svg>
);

export default function SocialIcon({ platform, size = 24, className = '', badge = false }) {
  const brand = BRAND_ICONS[platform];

  if (!brand) {
    return (
      <span style={{ display: 'inline-flex', width: size, height: size, borderRadius: 8, background: '#e4e4e7', flexShrink: 0 }} className={className} />
    );
  }

  // Google is always rendered in official multicolored G SVG
  if (platform === 'google_business') {
    if (badge) {
      const containerStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '25%',
        background: '#ffffff',
        border: '1px solid #e4e4e7',
        flexShrink: 0
      };
      const iconSize = Math.round(size * 0.55);
      return (
        <span style={containerStyle} className={className}>
          <GoogleG size={iconSize} />
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0 }} className={className}>
        <GoogleG size={size} />
      </span>
    );
  }

  // Get SVG content string
  let originalSvg = '';
  if (platform === 'linkedin') {
    originalSvg = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;
  } else if (platform === 'twitter') {
    originalSvg = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
  } else if (platform === 'tiktok') {
    originalSvg = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.86 1.08 2.07 1.85 3.4 2.27V10.1c-1.68-.02-3.32-.61-4.68-1.64-.17-.13-.34-.27-.5-.42v6.13c.02 2.39-1.25 4.67-3.33 5.86-2.1 1.21-4.72 1.25-6.86.1-2.14-1.15-3.5-3.37-3.55-5.8-.05-2.43 1.24-4.71 3.32-5.9 1.76-1.01 3.89-1.15 5.76-.39V12.1c-1.31-.76-3.03-.54-4.1.53-1.07 1.07-1.25 2.76-.44 4.01.81 1.25 2.39 1.83 3.82 1.39 1.43-.44 2.39-1.8 2.38-3.3V0z"/></svg>`;
  } else if (platform === 'threads') {
    originalSvg = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M12.24 0c-6.76 0-12.24 5.48-12.24 12.24s5.48 12.24 12.24 12.24 12.24-5.48 12.24-12.24-5.48-12.24-12.24-12.24zm0 21.6c-5.16 0-9.36-4.2-9.36-9.36s4.2-9.36 9.36-9.36 9.36 4.2 9.36 9.36-4.2 9.36-9.36 9.36zm3.3-12.6c-.32 0-.61.12-.84.34-.33.31-.5.71-.5 1.15 0 .61.43 1.1 1.04 1.1h1.16c.39 0 .7-.31.7-.7s-.31-.7-.7-.7h-.76v-.49c0-.22-.1-.4-.26-.53-.16-.14-.37-.17-.64-.17zm-6.6 2.3c0-.44.17-.84.5-1.15.23-.22.52-.34.84-.34.27 0 .48.03.64.17.16.13.26.31.26.53v.49h-.76c-.39 0-.7.31-.7.7s.31.7.7.7h1.16c.61 0 1.04-.49 1.04-1.1 0-.44-.17-.84-.5-1.15-.23-.22-.52-.34-.84-.34-.58 0-1.04.45-1.04 1.04v1.86c0 .59.46 1.04 1.04 1.04.32 0 .61-.12.84-.34.33-.31.5-.71.5-1.15h1.5c0 .9-.35 1.71-.97 2.3-.59.58-1.39.9-2.27.9-1.74 0-3.14-1.4-3.14-3.14V11.3z"/></svg>`;
  } else if (platform === 'custom_platform') {
    originalSvg = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2V7c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2v1h2c1.1 0 2 .9 2 2v2.09c.82.52 1.44 1.34 1.71 2.3z"/></svg>`;
  } else if (brand.icon) {
    originalSvg = brand.icon.svg;
  }

  // If badge mode is true (colored background, white logo)
  if (badge) {
    const isInstagram = platform === 'instagram';
    const containerStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: '25%', // Squircle look
      background: isInstagram ? brand.bg : brand.bg,
      flexShrink: 0
    };

    const iconSize = Math.round(size * 0.55);
    const innerSvg = originalSvg
      .replace(/<svg/, `<svg width="${iconSize}" height="${iconSize}"`)
      .replace(/<path\s/g, `<path fill="#ffffff" `);

    return (
      <span
        style={containerStyle}
        className={className}
        dangerouslySetInnerHTML={{ __html: innerSvg }}
      />
    );
  }

  // Default mode: colored logo on transparent background
  const coloredSvg = originalSvg
    .replace(/<svg/, `<svg width="${size}" height="${size}"`)
    .replace(/<path\s/g, `<path fill="${brand.color}" `);

  return (
    <span
      style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0 }}
      className={className}
      dangerouslySetInnerHTML={{ __html: coloredSvg }}
    />
  );
}
