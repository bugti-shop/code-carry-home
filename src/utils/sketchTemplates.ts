// Sketch note template data generators
// Each returns a JSON string of SketchData for the sketch editor

import type { SketchData, Layer, Stroke, TextAnnotation, StickyNoteData, WashiTapeData, CanvasImageData } from '@/components/sketch/SketchTypes';

// Import generated AI images
import floralWreathImg from '@/assets/sketch-templates/floral-wreath.png';
import kawaiStickersImg from '@/assets/sketch-templates/kawaii-stickers.png';
import vintageBordersImg from '@/assets/sketch-templates/vintage-borders.png';
import plannerHeaderImg from '@/assets/sketch-templates/planner-header.png';
import mindmapCenterImg from '@/assets/sketch-templates/mindmap-center.png';

const mkPt = (x: number, y: number, pressure = 0.5) => ({ x, y, pressure });

// Helper: create a filled rectangle stroke
const filledRect = (
  x: number, y: number, w: number, h: number,
  color: string, fillColor: string, fillOpacity = 0.3, lineWidth = 2
): Stroke => ({
  points: [mkPt(x, y), mkPt(x + w, y), mkPt(x + w, y + h), mkPt(x, y + h), mkPt(x, y)],
  color, width: lineWidth, tool: 'rect' as any,
  fillColor, fillOpacity, fillType: 'solid',
});

// Helper: line stroke
const lineStroke = (
  x1: number, y1: number, x2: number, y2: number,
  color: string, width = 2, tool: string = 'pen'
): Stroke => ({
  points: [mkPt(x1, y1), mkPt(x2, y2)], color, width, tool: tool as any,
});

// Helper: arrow stroke
const arrowStroke = (
  x1: number, y1: number, x2: number, y2: number,
  color: string, width = 3
): Stroke => ({
  points: [mkPt(x1, y1), mkPt(x2, y2)], color, width, tool: 'arrow' as any,
});

// Helper: circle stroke
const circleStroke = (
  cx: number, cy: number, r: number,
  color: string, fillColor?: string, fillOpacity = 0.2, width = 2
): Stroke => ({
  points: [mkPt(cx - r, cy), mkPt(cx, cy - r), mkPt(cx + r, cy), mkPt(cx, cy + r), mkPt(cx - r, cy)],
  color, width, tool: 'circle' as any,
  fillColor, fillOpacity: fillColor ? fillOpacity : undefined,
  fillType: fillColor ? 'solid' : undefined,
});

// Helper: text annotation
const txt = (
  id: number, x: number, y: number, content: string,
  fontSize = 16, color = '#1a1a2e', bold = false, italic = false,
  font = 'Inter, sans-serif'
): TextAnnotation => ({
  id, x, y, text: content, font, fontSize, color, bold, italic,
});

// Helper: sticky note
const sticky = (
  id: number, x: number, y: number, w: number, h: number,
  content: string, color = '#FEF3C7', fontSize = 12, rotation = 0
): StickyNoteData => ({
  id, x, y, width: w, height: h, text: content, color, fontSize, rotation,
});

// Helper: washi tape
const washi = (
  id: number, x: number, y: number, w: number, h: number,
  patternId: string, rotation = 0, opacity = 0.85
): WashiTapeData => ({
  id, x, y, width: w, height: h, patternId, rotation, opacity,
});

// Helper: image
const img = (
  id: number, x: number, y: number, w: number, h: number, src: string
): CanvasImageData => ({
  id, x, y, width: w, height: h, src, naturalWidth: w * 2, naturalHeight: h * 2,
});

// ═══════════════════════════════════════════
// Template 1: Aesthetic Study Notes
// ═══════════════════════════════════════════
export const generateAestheticStudyNotes = (): string => {
  const W = 800, H = 1400;

  const bgStrokes: Stroke[] = [
    filledRect(20, 15, W - 40, 60, '#7c3aed', '#c4b5fd', 0.5, 2),
    filledRect(20, 110, W / 2 - 30, 280, '#ec4899', '#fce7f3', 0.45, 2),
    filledRect(W / 2 + 10, 110, W / 2 - 30, 280, '#3b82f6', '#dbeafe', 0.4, 2),
    filledRect(20, 420, W - 40, 200, '#10b981', '#d1fae5', 0.35, 2),
    filledRect(20, 650, W / 2 - 30, 180, '#8b5cf6', '#ede9fe', 0.4, 2),
    filledRect(W / 2 + 10, 650, W / 2 - 30, 180, '#f59e0b', '#fef3c7', 0.4, 2),
    filledRect(20, 860, W - 40, 160, '#ec4899', '#fdf2f8', 0.3, 2),
    filledRect(20, 1050, W - 40, 8, '#7c3aed', '#7c3aed', 0.6, 0),
    filledRect(20, 1062, W - 40, 4, '#ec4899', '#ec4899', 0.4, 0),
    circleStroke(W / 2 + W / 4 - 5, 220, 60, '#3b82f6', '#bfdbfe', 0.3, 2),
    circleStroke(W / 2 + W / 4 - 5, 220, 30, '#6366f1', '#c7d2fe', 0.25, 1.5),
    lineStroke(W / 2 + W / 4 - 65, 220, W / 2 + W / 4 + 55, 220, '#3b82f6', 1),
    lineStroke(W / 2 + W / 4 - 5, 160, W / 2 + W / 4 - 5, 280, '#3b82f6', 1),
    arrowStroke(W / 2 - 25, 250, W / 2 + 15, 250, '#8b5cf6', 2.5),
    arrowStroke(W / 2 - 100, 395, W / 2 - 100, 425, '#10b981', 2.5),
    ...Array.from({ length: 12 }, (_, i) =>
      circleStroke(12, 130 + i * 80, 3, '#d8b4fe', '#d8b4fe', 0.6, 1)
    ),
    lineStroke(35, 175, 42, 175, '#ec4899', 3),
    lineStroke(35, 200, 42, 200, '#ec4899', 3),
    lineStroke(35, 225, 42, 225, '#ec4899', 3),
    lineStroke(35, 250, 42, 250, '#ec4899', 3),
    lineStroke(35, 475, 42, 475, '#10b981', 3),
    lineStroke(35, 505, 42, 505, '#10b981', 3),
    lineStroke(35, 535, 42, 535, '#10b981', 3),
    lineStroke(35, 565, 42, 565, '#10b981', 3),
  ];

  const textAnnotations: TextAnnotation[] = [
    txt(1, W / 2 - 80, 52, '📚 Study Notes', 22, '#4c1d95', true),
    txt(2, 35, 140, '✦ Key Concepts', 15, '#be185d', true),
    txt(3, W / 2 + 25, 140, '◎ Diagram', 15, '#1d4ed8', true),
    txt(4, 48, 175, 'Main idea goes here...', 11, '#6b7280'),
    txt(5, 48, 200, 'Supporting detail one', 11, '#6b7280'),
    txt(6, 48, 225, 'Supporting detail two', 11, '#6b7280'),
    txt(7, 48, 250, 'Additional notes & context', 11, '#6b7280'),
    txt(8, W / 2 + W / 4 - 35, 300, 'Label A', 10, '#3b82f6', false, true),
    txt(9, W / 2 + W / 4 + 30, 215, 'Label B', 10, '#3b82f6', false, true),
    txt(10, W / 2 + W / 4 - 30, 160, 'Label C', 10, '#6366f1', false, true),
    txt(11, W / 2 + W / 4 - 65, 215, 'Label D', 10, '#6366f1', false, true),
    txt(12, 35, 448, '★ Important Notes', 15, '#047857', true),
    txt(13, 48, 475, '→ Point one: Write your key takeaway here', 11, '#374151'),
    txt(14, 48, 505, '→ Point two: Add supporting evidence', 11, '#374151'),
    txt(15, 48, 535, '→ Point three: Cross-reference topics', 11, '#374151'),
    txt(16, 48, 565, '→ Point four: Questions to follow up', 11, '#374151'),
    txt(17, 35, 678, '∑ Formulas', 15, '#6d28d9', true),
    txt(18, 40, 710, 'Formula 1 = A × B', 12, '#4c1d95', false, true),
    txt(19, 40, 738, 'Formula 2 = C + D²', 12, '#4c1d95', false, true),
    txt(20, 40, 766, 'Formula 3 = E / F', 12, '#4c1d95', false, true),
    txt(21, W / 2 + 25, 678, '⚡ Quick Facts', 15, '#b45309', true),
    txt(22, W / 2 + 30, 710, '• Fact one: Brief info', 11, '#78350f'),
    txt(23, W / 2 + 30, 735, '• Fact two: Key detail', 11, '#78350f'),
    txt(24, W / 2 + 30, 760, '• Fact three: Remember this', 11, '#78350f'),
    txt(25, W / 2 + 30, 785, '• Fact four: Important date', 11, '#78350f'),
    txt(26, 35, 888, '📝 Summary', 15, '#be185d', true),
    txt(27, 40, 920, 'Write a brief summary of the topic here.', 11, '#6b7280'),
    txt(28, 40, 942, 'Include main points, relationships, review items.', 11, '#6b7280'),
    txt(29, 40, 968, 'Helps with recall and spaced repetition.', 11, '#6b7280'),
    txt(30, W / 2 - 60, 1085, 'Made with Flowist ✨', 10, '#a78bfa', false, true),
  ];

  const stickyNotes: StickyNoteData[] = [
    sticky(1, W - 170, 320, 140, 90, '💡 Tip:\nHighlight key terms\nand review daily!', '#FBCFE8', 10, -3),
    sticky(2, 30, 1090, 130, 85, '📌 Remember:\nPractice > Reading\nActive recall works!', '#BBF7D0', 10, 2),
    sticky(3, W - 180, 870, 150, 85, '🎯 Goal:\nUnderstand & apply\nnot just memorize', '#BFDBFE', 10, -2),
    sticky(4, W / 2 - 70, 1095, 140, 80, '⭐ Review Date:\n__/__/____', '#E9D5FF', 11, 0),
  ];

  const washiTapes: WashiTapeData[] = [
    washi(1, -5, 95, 180, 18, 'hearts-pink', -2),
    washi(2, W - 160, 95, 170, 18, 'clouds-blue', 1),
    washi(3, W / 2 - 80, 635, 160, 16, 'solid-lavender', 0),
    washi(4, 10, 845, 140, 16, 'sakura', -1),
  ];

  // Add floral wreath as decoration
  const images: CanvasImageData[] = [
    img(1, W - 200, 1070, 160, 160, floralWreathImg),
  ];

  const layer0: Layer = {
    id: 0, name: 'Decorations', strokes: bgStrokes, textAnnotations: [],
    stickyNotes: [], images, washiTapes, opacity: 1, visible: true,
  };
  const layer1: Layer = {
    id: 1, name: 'Content', strokes: [], textAnnotations,
    stickyNotes, images: [], washiTapes: [], opacity: 1, visible: true,
  };

  const data: SketchData = {
    layers: [layer0, layer1], activeLayerId: 1,
    background: 'grid-sm', width: W, height: H, version: 2,
  };
  return JSON.stringify(data);
};

// ═══════════════════════════════════════════
// Template 2: Daily Planner
// ═══════════════════════════════════════════
export const generateDailyPlanner = (): string => {
  const W = 800, H = 1600;

  const strokes: Stroke[] = [
    // Header banner
    filledRect(20, 15, W - 40, 80, '#6366f1', '#e0e7ff', 0.5, 2),
    // Time blocks - Morning
    filledRect(20, 130, W - 40, 40, '#f97316', '#ffedd5', 0.4, 1.5),
    // Morning schedule lines
    ...Array.from({ length: 5 }, (_, i) =>
      filledRect(20, 180 + i * 55, W - 40, 50, '#f97316', '#fff7ed', 0.15, 1)
    ),
    // Afternoon section
    filledRect(20, 465, W - 40, 40, '#3b82f6', '#dbeafe', 0.4, 1.5),
    ...Array.from({ length: 5 }, (_, i) =>
      filledRect(20, 515 + i * 55, W - 40, 50, '#3b82f6', '#eff6ff', 0.15, 1)
    ),
    // Evening section  
    filledRect(20, 800, W - 40, 40, '#8b5cf6', '#ede9fe', 0.4, 1.5),
    ...Array.from({ length: 3 }, (_, i) =>
      filledRect(20, 850 + i * 55, W - 40, 50, '#8b5cf6', '#f5f3ff', 0.15, 1)
    ),
    // To-do section
    filledRect(20, 1040, W / 2 - 30, 250, '#10b981', '#d1fae5', 0.3, 2),
    // Notes section
    filledRect(W / 2 + 10, 1040, W / 2 - 30, 250, '#ec4899', '#fce7f3', 0.3, 2),
    // Gratitude section
    filledRect(20, 1320, W - 40, 140, '#f59e0b', '#fef3c7', 0.25, 2),
    // Water tracker circles
    ...Array.from({ length: 8 }, (_, i) =>
      circleStroke(60 + i * 90, 1510, 25, '#3b82f6', '#dbeafe', 0.2, 1.5)
    ),
    // Decorative bottom bar
    filledRect(20, 1560, W - 40, 6, '#6366f1', '#6366f1', 0.5, 0),
  ];

  const texts: TextAnnotation[] = [
    txt(1, W / 2 - 70, 62, '📅 Daily Planner', 22, '#312e81', true),
    txt(2, 35, 155, '🌅 MORNING', 14, '#c2410c', true),
    txt(3, 35, 490, '☀️ AFTERNOON', 14, '#1e40af', true),
    txt(4, 35, 825, '🌙 EVENING', 14, '#5b21b6', true),
    // Time labels
    ...Array.from({ length: 5 }, (_, i) =>
      txt(10 + i, 30, 200 + i * 55, `${6 + i}:00`, 10, '#9ca3af', false, false)
    ),
    ...Array.from({ length: 5 }, (_, i) =>
      txt(20 + i, 30, 535 + i * 55, `${12 + i}:00`, 10, '#9ca3af', false, false)
    ),
    ...Array.from({ length: 3 }, (_, i) =>
      txt(30 + i, 30, 870 + i * 55, `${18 + i}:00`, 10, '#9ca3af', false, false)
    ),
    // Section headers
    txt(40, 35, 1068, '✅ To-Do List', 13, '#047857', true),
    txt(41, W / 2 + 25, 1068, '📝 Notes', 13, '#be185d', true),
    txt(42, 35, 1345, '🙏 Gratitude', 14, '#b45309', true),
    txt(43, 40, 1375, '1. ________________________', 11, '#92400e'),
    txt(44, 40, 1400, '2. ________________________', 11, '#92400e'),
    txt(45, 40, 1425, '3. ________________________', 11, '#92400e'),
    // To-do checkboxes
    ...Array.from({ length: 6 }, (_, i) =>
      txt(50 + i, 40, 1098 + i * 28, `☐ Task ${i + 1}`, 11, '#374151')
    ),
    // Water tracker label
    txt(60, W / 2 - 50, 1540, '💧 Water Tracker', 11, '#1e40af', true),
    txt(61, W / 2 - 60, 1575, 'Made with Flowist ✨', 10, '#a78bfa', false, true),
  ];

  const stickyNotes: StickyNoteData[] = [
    sticky(1, W - 170, 130, 140, 80, '🎯 Today\'s Goal:\n\nWrite here...', '#BFDBFE', 10, -2),
    sticky(2, W - 160, 1320, 130, 80, '💪 Motivation:\nYou got this!', '#BBF7D0', 10, 3),
  ];

  const washiTapes: WashiTapeData[] = [
    washi(1, -5, 120, 160, 16, 'dots-gold', -1),
    washi(2, W - 150, 455, 160, 16, 'stripes-blue', 2),
  ];

  const images: CanvasImageData[] = [
    img(1, W - 120, 20, 90, 70, plannerHeaderImg),
  ];

  const layer0: Layer = {
    id: 0, name: 'Layout', strokes, textAnnotations: [],
    stickyNotes: [], images, washiTapes, opacity: 1, visible: true,
  };
  const layer1: Layer = {
    id: 1, name: 'Content', strokes: [], textAnnotations: texts,
    stickyNotes, images: [], washiTapes: [], opacity: 1, visible: true,
  };

  return JSON.stringify({
    layers: [layer0, layer1], activeLayerId: 1,
    background: 'dots', width: W, height: H, version: 2,
  } as SketchData);
};

// ═══════════════════════════════════════════
// Template 3: Mind Map
// ═══════════════════════════════════════════
export const generateMindMap = (): string => {
  const W = 900, H = 900;
  const cx = W / 2, cy = H / 2;

  // Branch positions
  const branches = [
    { angle: -45, color: '#ec4899', fill: '#fce7f3', label: 'Topic A' },
    { angle: 45, color: '#3b82f6', fill: '#dbeafe', label: 'Topic B' },
    { angle: 135, color: '#10b981', fill: '#d1fae5', label: 'Topic C' },
    { angle: -135, color: '#f59e0b', fill: '#fef3c7', label: 'Topic D' },
    { angle: 0, color: '#8b5cf6', fill: '#ede9fe', label: 'Topic E' },
    { angle: 180, color: '#ef4444', fill: '#fee2e2', label: 'Topic F' },
  ];

  const strokes: Stroke[] = [
    // Center circle
    circleStroke(cx, cy, 70, '#7c3aed', '#e9d5ff', 0.4, 3),
    circleStroke(cx, cy, 50, '#7c3aed', '#c4b5fd', 0.3, 2),
  ];

  const texts: TextAnnotation[] = [
    txt(1, cx - 50, cy + 5, '🧠 Main Topic', 16, '#4c1d95', true),
  ];

  branches.forEach((b, i) => {
    const rad = (b.angle * Math.PI) / 180;
    const dist = 230;
    const bx = cx + Math.cos(rad) * dist;
    const by = cy + Math.sin(rad) * dist;
    
    // Branch line
    strokes.push(arrowStroke(
      cx + Math.cos(rad) * 75, cy + Math.sin(rad) * 75,
      bx - Math.cos(rad) * 55, by - Math.sin(rad) * 55,
      b.color, 3
    ));
    // Branch node
    strokes.push(circleStroke(bx, by, 55, b.color, b.fill, 0.4, 2));
    // Branch label
    texts.push(txt(10 + i, bx - 30, by + 5, b.label, 12, b.color, true));
    
    // Sub-branches
    const subDist = 110;
    for (let j = 0; j < 2; j++) {
      const subAngle = rad + (j === 0 ? -0.5 : 0.5);
      const sx = bx + Math.cos(subAngle) * subDist;
      const sy = by + Math.sin(subAngle) * subDist;
      strokes.push(lineStroke(
        bx + Math.cos(subAngle) * 55, by + Math.sin(subAngle) * 55,
        sx, sy, b.color, 1.5
      ));
      strokes.push(circleStroke(sx, sy, 30, b.color, b.fill, 0.25, 1));
      texts.push(txt(20 + i * 2 + j, sx - 18, sy + 4, `Sub ${j + 1}`, 9, b.color, false, true));
    }
  });

  const images: CanvasImageData[] = [
    img(1, cx - 90, cy - 90, 180, 180, mindmapCenterImg),
  ];

  const stickyNotes: StickyNoteData[] = [
    sticky(1, 10, 10, 130, 70, '💡 Add your\nideas here!', '#E9D5FF', 10, -3),
    sticky(2, W - 150, H - 90, 130, 70, '✏️ Click to\nedit text', '#BFDBFE', 10, 2),
  ];

  const layer0: Layer = {
    id: 0, name: 'Map', strokes, textAnnotations: [],
    stickyNotes: [], images, washiTapes: [], opacity: 1, visible: true,
  };
  const layer1: Layer = {
    id: 1, name: 'Labels', strokes: [], textAnnotations: texts,
    stickyNotes, images: [], washiTapes: [], opacity: 1, visible: true,
  };

  return JSON.stringify({
    layers: [layer0, layer1], activeLayerId: 1,
    background: 'dots', width: W, height: H, version: 2,
  } as SketchData);
};

// ═══════════════════════════════════════════
// Template 4: Cornell Notes
// ═══════════════════════════════════════════
export const generateCornellNotes = (): string => {
  const W = 800, H = 1400;
  const cueW = 200;

  const strokes: Stroke[] = [
    // Title bar
    filledRect(15, 10, W - 30, 60, '#1e3a5f', '#e0f2fe', 0.5, 2),
    // Cue column
    filledRect(15, 80, cueW, 900, '#6366f1', '#eef2ff', 0.15, 2),
    // Notes column
    filledRect(cueW + 20, 80, W - cueW - 35, 900, '#374151', '#f9fafb', 0.08, 1),
    // Summary box
    filledRect(15, 1000, W - 30, 200, '#059669', '#d1fae5', 0.25, 2),
    // Horizontal dividers in notes area
    ...Array.from({ length: 20 }, (_, i) =>
      lineStroke(cueW + 25, 120 + i * 43, W - 25, 120 + i * 43, '#d1d5db', 0.5)
    ),
    // Vertical separator
    lineStroke(cueW + 17, 80, cueW + 17, 980, '#6366f1', 1.5),
    // Decorative bottom line
    filledRect(15, 1220, W - 30, 4, '#6366f1', '#6366f1', 0.5, 0),
  ];

  const texts: TextAnnotation[] = [
    txt(1, W / 2 - 70, 48, '📖 Cornell Notes', 20, '#1e3a5f', true),
    txt(2, 25, 100, 'CUE / QUESTIONS', 10, '#4338ca', true),
    txt(3, cueW + 35, 100, 'NOTES', 10, '#374151', true),
    txt(4, 25, 1025, '📝 SUMMARY', 13, '#047857', true),
    // Cue prompts
    txt(5, 25, 140, 'What is...?', 10, '#6366f1', false, true),
    txt(6, 25, 230, 'Why does...?', 10, '#6366f1', false, true),
    txt(7, 25, 320, 'How can...?', 10, '#6366f1', false, true),
    txt(8, 25, 410, 'Key terms:', 10, '#6366f1', false, true),
    // Note lines
    txt(9, cueW + 35, 140, 'Write your lecture notes here...', 11, '#6b7280'),
    txt(10, cueW + 35, 183, 'Include details, examples, diagrams', 11, '#6b7280'),
    // Summary
    txt(11, 25, 1060, 'Summarize the key points in your own words.', 11, '#065f46'),
    txt(12, 25, 1085, 'This helps consolidate learning and aids review.', 11, '#065f46'),
    // Footer
    txt(13, W / 2 - 60, 1235, 'Made with Flowist ✨', 10, '#a78bfa', false, true),
  ];

  const images: CanvasImageData[] = [
    img(1, W - 140, 10, 120, 60, vintageBordersImg),
  ];

  const stickyNotes: StickyNoteData[] = [
    sticky(1, W - 160, 1000, 140, 80, '⚡ Review within\n24 hours for\nbest retention!', '#FEF3C7', 10, -2),
  ];

  const washiTapes: WashiTapeData[] = [
    washi(1, -5, 70, 130, 14, 'solid-lavender', -1),
    washi(2, W / 2 - 60, 990, 120, 14, 'dots-gold', 0),
  ];

  const layer0: Layer = {
    id: 0, name: 'Layout', strokes, textAnnotations: [],
    stickyNotes: [], images, washiTapes, opacity: 1, visible: true,
  };
  const layer1: Layer = {
    id: 1, name: 'Content', strokes: [], textAnnotations: texts,
    stickyNotes, images: [], washiTapes: [], opacity: 1, visible: true,
  };

  return JSON.stringify({
    layers: [layer0, layer1], activeLayerId: 1,
    background: 'lined', width: W, height: H, version: 2,
  } as SketchData);
};

// ═══════════════════════════════════════════
// Template 5: Kawaii Journal
// ═══════════════════════════════════════════
export const generateKawaiiJournal = (): string => {
  const W = 800, H = 1400;

  const strokes: Stroke[] = [
    // Header cloud shape
    filledRect(30, 20, W - 60, 90, '#f9a8d4', '#fdf2f8', 0.5, 2),
    // Mood tracker section
    filledRect(30, 140, W / 2 - 40, 150, '#fbbf24', '#fffbeb', 0.4, 2),
    // Weather section
    filledRect(W / 2 + 10, 140, W / 2 - 40, 150, '#67e8f9', '#ecfeff', 0.4, 2),
    // Today I'm grateful for
    filledRect(30, 320, W - 60, 180, '#a78bfa', '#f5f3ff', 0.3, 2),
    // Highlight of the day
    filledRect(30, 530, W - 60, 160, '#f472b6', '#fdf2f8', 0.3, 2),
    // Doodle zone
    filledRect(30, 720, W / 2 - 40, 300, '#34d399', '#ecfdf5', 0.2, 2),
    // Memories section
    filledRect(W / 2 + 10, 720, W / 2 - 40, 300, '#fb923c', '#fff7ed', 0.2, 2),
    // Tomorrow's goals
    filledRect(30, 1050, W - 60, 180, '#60a5fa', '#eff6ff', 0.25, 2),
    // Decorative stars
    ...Array.from({ length: 6 }, (_, i) =>
      circleStroke(80 + i * 120, 1280, 8, '#fbbf24', '#fef3c7', 0.5, 1.5)
    ),
  ];

  const texts: TextAnnotation[] = [
    txt(1, W / 2 - 80, 72, '🌸 My Journal 🌸', 22, '#be185d', true),
    txt(2, W / 2 - 50, 95, 'Date: __/__/____', 11, '#9ca3af'),
    txt(3, 45, 165, '😊 Mood Tracker', 13, '#b45309', true),
    txt(4, 55, 195, '😄  😊  😐  😔  😢', 18, '#374151'),
    txt(5, W / 2 + 25, 165, '🌤️ Weather', 13, '#0891b2', true),
    txt(6, W / 2 + 35, 195, '☀️  ⛅  🌧️  ❄️  🌈', 18, '#374151'),
    txt(7, 45, 345, '🙏 Today I\'m Grateful For...', 14, '#6d28d9', true),
    txt(8, 55, 380, '1. ________________________', 11, '#7c3aed'),
    txt(9, 55, 408, '2. ________________________', 11, '#7c3aed'),
    txt(10, 55, 436, '3. ________________________', 11, '#7c3aed'),
    txt(11, 45, 555, '✨ Highlight of the Day', 14, '#be185d', true),
    txt(12, 55, 590, 'What made today special?', 11, '#9ca3af', false, true),
    txt(13, 45, 745, '🎨 Doodle Zone', 12, '#059669', true),
    txt(14, 55, 775, 'Draw here!', 10, '#9ca3af', false, true),
    txt(15, W / 2 + 25, 745, '📸 Memories', 12, '#c2410c', true),
    txt(16, W / 2 + 35, 775, 'Paste photos or draw', 10, '#9ca3af', false, true),
    txt(17, 45, 1075, '🎯 Tomorrow\'s Goals', 14, '#1d4ed8', true),
    txt(18, 55, 1110, '☐ Goal 1: ________________', 11, '#374151'),
    txt(19, 55, 1138, '☐ Goal 2: ________________', 11, '#374151'),
    txt(20, 55, 1166, '☐ Goal 3: ________________', 11, '#374151'),
    txt(21, W / 2 - 60, 1295, 'Made with Flowist ✨', 10, '#f9a8d4', false, true),
  ];

  const stickyNotes: StickyNoteData[] = [
    sticky(1, W - 170, 325, 130, 80, '💕 Self-care tip:\nDrink water &\ntake breaks! 🌿', '#FBCFE8', 10, 3),
    sticky(2, 35, 1250, 120, 70, '⭐ You are\namazing! ✨', '#FEF3C7', 10, -2),
  ];

  const washiTapes: WashiTapeData[] = [
    washi(1, -5, 130, 160, 16, 'hearts-pink', -2),
    washi(2, W - 150, 130, 160, 16, 'clouds-blue', 1),
    washi(3, W / 2 - 70, 1040, 140, 14, 'sakura', 0),
  ];

  const images: CanvasImageData[] = [
    img(1, W - 180, 530, 150, 150, kawaiStickersImg),
  ];

  const layer0: Layer = {
    id: 0, name: 'Layout', strokes, textAnnotations: [],
    stickyNotes: [], images, washiTapes, opacity: 1, visible: true,
  };
  const layer1: Layer = {
    id: 1, name: 'Content', strokes: [], textAnnotations: texts,
    stickyNotes, images: [], washiTapes: [], opacity: 1, visible: true,
  };

  return JSON.stringify({
    layers: [layer0, layer1], activeLayerId: 1,
    background: 'grid-sm', width: W, height: H, version: 2,
  } as SketchData);
};

// ═══════════════════════════════════════════
// Template metadata
// ═══════════════════════════════════════════

export interface SketchTemplate {
  id: string;
  name: string;
  description: string;
  generator: () => string;
  icon: string;
  previewColor: string;
  premium?: boolean;
  tags?: string[];
}

export const SKETCH_TEMPLATES: SketchTemplate[] = [
  {
    id: 'aesthetic-study-notes',
    name: 'Aesthetic Study Notes',
    description: 'Beautiful study layout with colored sections, diagrams, sticky notes & washi tapes',
    generator: generateAestheticStudyNotes,
    icon: '📚',
    previewColor: '#f3e8ff',
    tags: ['study', 'notes', 'academic'],
  },
  {
    id: 'daily-planner',
    name: 'Daily Planner',
    description: 'Structured daily planner with time blocks, to-do list, gratitude & water tracker',
    generator: generateDailyPlanner,
    icon: '📅',
    previewColor: '#e0e7ff',
    tags: ['planner', 'productivity', 'daily'],
  },
  {
    id: 'mind-map',
    name: 'Mind Map',
    description: 'Radial mind map with center topic, 6 branches with sub-nodes & decorative mandala',
    generator: generateMindMap,
    icon: '🧠',
    previewColor: '#ede9fe',
    tags: ['brainstorm', 'ideas', 'thinking'],
  },
  {
    id: 'cornell-notes',
    name: 'Cornell Notes',
    description: 'Classic Cornell note-taking method with cue column, notes area & summary section',
    generator: generateCornellNotes,
    icon: '📖',
    previewColor: '#e0f2fe',
    tags: ['study', 'cornell', 'academic'],
  },
  {
    id: 'kawaii-journal',
    name: 'Kawaii Journal',
    description: 'Cute journal with mood tracker, gratitude, doodle zone & adorable kawaii stickers',
    generator: generateKawaiiJournal,
    icon: '🌸',
    previewColor: '#fdf2f8',
    tags: ['journal', 'cute', 'diary'],
  },
];
