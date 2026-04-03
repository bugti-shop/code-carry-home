import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { m as motion } from 'framer-motion';
import { Share2, Edit3, Check, Copy, Flame } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { triggerHaptic } from '@/utils/haptics';
import { lazyHtml2canvas } from '@/utils/lazyHtml2canvas';
import { shareImageBlob } from '@/utils/shareImage';

const QRCodeSVG = lazy(() => import('qrcode.react').then(m => ({ default: m.QRCodeSVG })));

interface StreakConsistencyCertificateProps {
  currentStreak: number;
  totalCompletions: number;
  longestStreak: number;
}

const getShareText = (streak: number, totalTasks: number, userName: string) => {
  return `🔥 I'm on a ${streak} day productivity streak!\n\nI've completed ${totalTasks} tasks with consistency on Flowist! Every day counts. 💪\n\n${userName ? `${userName}` : ''}\n#Productivity #Streak #Flowist #Consistency`;
};

const getStreakColor = (_streak: number) => {
  return { bg: 'linear-gradient(135deg, #f98e40, #f87415)', accent: '#f87415', glow: 'rgba(248, 116, 21, 0.4)' };
};

export const StreakConsistencyCertificate = ({ currentStreak, totalCompletions, longestStreak }: StreakConsistencyCertificateProps) => {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [cardName, setCardName] = useState(profile.name || '');
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    if (!cardName && profile.name) setCardName(profile.name);
  }, [profile.name]);

  const colors = getStreakColor(currentStreak);
  const displayName = cardName.trim();

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    triggerHaptic('medium').catch(() => {});

    try {
      const W = 800;
      const H = 520;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#f98e40');
      grad.addColorStop(1, '#f87415');
      ctx.fillStyle = grad;
      roundRect(ctx, 0, 0, W, H, 32);
      ctx.fill();

      // Decorative circles
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(W - 60, -20, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-20, H + 10, 100, 0, Math.PI * 2);
      ctx.fill();

      // Flame watermark
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      // Simple teardrop shape
      const fx = W - 120, fy = H / 2 - 40;
      ctx.moveTo(fx, fy - 80);
      ctx.bezierCurveTo(fx + 50, fy - 20, fx + 60, fy + 40, fx, fy + 70);
      ctx.bezierCurveTo(fx - 60, fy + 40, fx - 50, fy - 20, fx, fy - 80);
      ctx.fill();
      ctx.globalAlpha = 1;

      // "I'm on a"
      ctx.fillStyle = 'rgba(255,255,255,0.87)';
      ctx.font = '700 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText("I'm on a", 48, 72);

      // Big streak number
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 88px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.shadowColor = 'rgba(248, 116, 21, 0.4)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 4;
      ctx.fillText(String(currentStreak), 48, 165);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // "day productivity streak!"
      ctx.fillStyle = 'rgba(255,255,255,0.87)';
      ctx.font = '700 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('day productivity', 48, 210);
      ctx.fillText('streak!', 48, 250);

      // User name
      if (displayName) {
        ctx.fillStyle = 'rgba(255,255,255,0.73)';
        ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(displayName, 48, 290);
      }

      // Stats
      const statsY = 370;
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(String(totalCompletions), 48, statsY);
      ctx.fillStyle = 'rgba(255,255,255,0.67)';
      ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Tasks Done', 48, statsY + 20);

      const col2X = 170;
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(String(longestStreak), col2X, statsY);
      ctx.fillStyle = 'rgba(255,255,255,0.67)';
      ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Best Streak', col2X, statsY + 20);

      // QR Code - draw as white rounded rect with text
      const qrX = W - 200, qrY = H - 100;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, qrX, qrY, 56, 56, 8);
      ctx.fill();
      // Draw a simple QR placeholder pattern
      ctx.fillStyle = '#000000';
      ctx.font = '700 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('QR', qrX + 28, qrY + 32);
      ctx.textAlign = 'left';

      // Try to render actual QR from the DOM
      try {
        const qrSvg = cardRef.current?.querySelector('svg[viewBox]') as SVGElement | null;
        if (qrSvg) {
          const svgData = new XMLSerializer().serializeToString(qrSvg);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.fillStyle = '#ffffff';
              roundRect(ctx, qrX, qrY, 56, 56, 8);
              ctx.fill();
              ctx.drawImage(img, qrX + 4, qrY + 4, 48, 48);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
            img.src = url;
          });
        }
      } catch { /* fallback to text QR */ }

      // Branding text
      ctx.fillStyle = 'rgba(255,255,255,0.87)';
      ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Flowist', qrX + 66, qrY + 25);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Notepad & To Do List', qrX + 66, qrY + 42);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) { setIsSharing(false); return; }

      await shareImageBlob({
        blob,
        fileName: `flowist-streak-${currentStreak}.png`,
        title: `${currentStreak} Day Streak!`,
        text: getShareText(currentStreak, totalCompletions, displayName),
        dialogTitle: 'Share Streak',
      });
    } catch (e) {
      console.error('[StreakCert] Share failed:', e);
    } finally {
      setIsSharing(false);
    }
  }, [currentStreak, totalCompletions, longestStreak, displayName]);

  const handleCopyText = useCallback(async () => {
    const text = getShareText(currentStreak, totalCompletions, displayName);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedText(true);
    triggerHaptic('light').catch(() => {});
    setTimeout(() => setCopiedText(false), 2000);
  }, [currentStreak, totalCompletions, displayName]);

  return (
    <div className="space-y-3">
      {/* The shareable card */}
      <div
        ref={cardRef}
        style={{
          background: colors.bg,
          borderRadius: 20,
          padding: '32px 24px 24px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 280,
        }}
      >
        {/* Decorative glow circles */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.glow}30, transparent 70%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: -30, left: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.glow}20, transparent 70%)`,
        }} />

        {/* "I'm on a" text */}
        <p style={{
          color: '#ffffffdd',
          fontSize: 22,
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.3,
          position: 'relative',
          zIndex: 1,
        }}>
          I'm on a
        </p>

        {/* Big streak number */}
        <p style={{
          color: '#ffffff',
          fontSize: 48,
          fontWeight: 900,
          margin: '12px 0 4px',
          lineHeight: 1,
          position: 'relative',
          zIndex: 1,
          textShadow: `0 4px 20px ${colors.glow}`,
          textAlign: 'left',
        }}>
          {currentStreak}
        </p>

        {/* "day productivity streak!" */}
        <p style={{
          color: '#ffffffdd',
          fontSize: 22,
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.3,
          position: 'relative',
          zIndex: 1,
        }}>
          day productivity<br />streak!
        </p>

        {/* User name */}
        {displayName && (
          <p style={{
            color: '#ffffffbb',
            fontSize: 13,
            fontWeight: 600,
            marginTop: 12,
            position: 'relative',
            zIndex: 1,
          }}>
            {displayName}
          </p>
        )}

        {/* Stats row at bottom */}
        <div style={{
          display: 'flex',
          gap: 20,
          marginTop: 20,
          position: 'relative',
          zIndex: 1,
        }}>
          <div>
            <p style={{ color: '#ffffff', fontSize: 18, fontWeight: 800, margin: 0 }}>{totalCompletions}</p>
            <p style={{ color: '#ffffffaa', fontSize: 9, margin: 0, fontWeight: 500 }}>Tasks Done</p>
          </div>
          <div>
            <p style={{ color: '#ffffff', fontSize: 18, fontWeight: 800, margin: 0 }}>{longestStreak}</p>
            <p style={{ color: '#ffffffaa', fontSize: 9, margin: 0, fontWeight: 500 }}>Best Streak</p>
          </div>
        </div>

        {/* Branding at bottom-right */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 1,
        }}>
          <Suspense fallback={null}>
            <div style={{
              background: '#ffffff',
              borderRadius: 6,
              padding: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <QRCodeSVG
                value="https://play.google.com/store/apps/details?id=nota.npd.com"
                size={40}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          </Suspense>
          <div>
            <p style={{ color: '#ffffffdd', fontSize: 11, fontWeight: 700, margin: 0 }}>Flowist</p>
            <p style={{ color: '#ffffff99', fontSize: 7, margin: 0 }}>Notepad & To Do List</p>
          </div>
        </div>

        {/* Flame icon decorative */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: 16,
          transform: 'translateY(-60%)',
          opacity: 0.15,
          zIndex: 0,
        }}>
          <svg width="120" height="160" viewBox="0 0 24 24" fill="white">
            <path d="M12 23c-3.866 0-7-3.134-7-7 0-3.866 4-9 7-13 3 4 7 9.134 7 13 0 3.866-3.134 7-7 7z" />
          </svg>
        </div>
      </div>

      {/* Name input */}
      <div className="bg-card border rounded-xl p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Your Name</span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-primary flex items-center gap-1"
          >
            <Edit3 className="h-3 w-3" />
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>
        {isEditing ? (
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder={t('common.enterYourName', 'Enter your name')}
            maxLength={40}
            autoFocus
            className="w-full text-sm bg-muted rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        ) : (
          <p className="text-sm font-medium truncate">{displayName || t('common.tapEditName', 'Tap Edit to add your name')}</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          disabled={isSharing}
          className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSharing ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {isSharing ? 'Exporting...' : 'Share'}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyText}
          className="bg-card border rounded-xl px-4 py-3 text-sm flex items-center gap-2"
        >
          {copiedText ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          {copiedText ? 'Copied!' : 'Copy'}
        </motion.button>
      </div>
    </div>
  );
};
