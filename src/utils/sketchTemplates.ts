// Sketch note template data generators
// Each returns a JSON string of SketchData for the sketch editor

import type { SketchData, Layer, Stroke, TextAnnotation, StickyNoteData, WashiTapeData } from '@/components/sketch/SketchTypes';

const mkPt = (x: number, y: number, pressure = 0.5) => ({ x, y, pressure });

// Helper: create a filled rectangle stroke
const filledRect = (
  x: number, y: number, w: number, h: number,
  color: string, fillColor: string, fillOpacity = 0.3, lineWidth = 2
): Stroke => ({
  points: [mkPt(x, y), mkPt(x + w, y), mkPt(x + w, y + h), mkPt(x, y + h), mkPt(x, y)],
  color,
  width: lineWidth,
  tool: 'rect' as any,
  fillColor,
  fillOpacity,
  fillType: 'solid',
});

// Helper: create line stroke
const lineStroke = (
  x1: number, y1: number, x2: number, y2: number,
  color: string, width = 2, tool: string = 'pen'
): Stroke => ({
  points: [mkPt(x1, y1), mkPt(x2, y2)],
  color,
  width,
  tool: tool as any,
});

// Helper: arrow stroke
const arrowStroke = (
  x1: number, y1: number, x2: number, y2: number,
  color: string, width = 3
): Stroke => ({
  points: [mkPt(x1, y1), mkPt(x2, y2)],
  color,
  width,
  tool: 'arrow' as any,
});

// Helper: circle stroke
const circleStroke = (
  cx: number, cy: number, r: number,
  color: string, fillColor?: string, fillOpacity = 0.2, width = 2
): Stroke => ({
  points: [mkPt(cx - r, cy), mkPt(cx, cy - r), mkPt(cx + r, cy), mkPt(cx, cy + r), mkPt(cx - r, cy)],
  color,
  width,
  tool: 'circle' as any,
  fillColor,
  fillOpacity: fillColor ? fillOpacity : undefined,
  fillType: fillColor ? 'solid' : undefined,
});

// Helper: text annotation
const text = (
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

// ─── Template 1: Aesthetic Study Notes ───

export const generateAestheticStudyNotes = (): string => {
  const W = 800;
  const H = 1400;

  // --- Layer 0: Background decorations ---
  const bgStrokes: Stroke[] = [
    // Title banner - gradient purple rectangle
    filledRect(20, 15, W - 40, 60, '#7c3aed', '#c4b5fd', 0.5, 2),

    // Section 1: "Key Concepts" box - soft pink
    filledRect(20, 110, W / 2 - 30, 280, '#ec4899', '#fce7f3', 0.45, 2),

    // Section 2: "Diagram" box - soft blue
    filledRect(W / 2 + 10, 110, W / 2 - 30, 280, '#3b82f6', '#dbeafe', 0.4, 2),

    // Section 3: "Important Notes" - soft green, full width
    filledRect(20, 420, W - 40, 200, '#10b981', '#d1fae5', 0.35, 2),

    // Section 4: "Formulas" - lavender
    filledRect(20, 650, W / 2 - 30, 180, '#8b5cf6', '#ede9fe', 0.4, 2),

    // Section 5: "Quick Facts" - soft orange
    filledRect(W / 2 + 10, 650, W / 2 - 30, 180, '#f59e0b', '#fef3c7', 0.4, 2),

    // Section 6: "Summary" - full width pink
    filledRect(20, 860, W - 40, 160, '#ec4899', '#fdf2f8', 0.3, 2),

    // Bottom decorative bar
    filledRect(20, 1050, W - 40, 8, '#7c3aed', '#7c3aed', 0.6, 0),
    filledRect(20, 1062, W - 40, 4, '#ec4899', '#ec4899', 0.4, 0),

    // Diagram: circle in the blue box
    circleStroke(W / 2 + W / 4 - 5, 220, 60, '#3b82f6', '#bfdbfe', 0.3, 2),
    // Inner circle
    circleStroke(W / 2 + W / 4 - 5, 220, 30, '#6366f1', '#c7d2fe', 0.25, 1.5),

    // Cross lines in diagram circle
    lineStroke(W / 2 + W / 4 - 5 - 60, 220, W / 2 + W / 4 - 5 + 60, 220, '#3b82f6', 1),
    lineStroke(W / 2 + W / 4 - 5, 160, W / 2 + W / 4 - 5, 280, '#3b82f6', 1),

    // Arrows connecting sections
    arrowStroke(W / 2 - 25, 250, W / 2 + 15, 250, '#8b5cf6', 2.5),
    arrowStroke(W / 2 - 100, 395, W / 2 - 100, 425, '#10b981', 2.5),

    // Decorative dots along the left margin
    ...Array.from({ length: 12 }, (_, i) =>
      circleStroke(12, 130 + i * 80, 3, '#d8b4fe', '#d8b4fe', 0.6, 1)
    ),

    // Bullet lines in Key Concepts box
    lineStroke(35, 175, 42, 175, '#ec4899', 3),
    lineStroke(35, 200, 42, 200, '#ec4899', 3),
    lineStroke(35, 225, 42, 225, '#ec4899', 3),
    lineStroke(35, 250, 42, 250, '#ec4899', 3),

    // Bullet lines in Important Notes box
    lineStroke(35, 475, 42, 475, '#10b981', 3),
    lineStroke(35, 505, 42, 505, '#10b981', 3),
    lineStroke(35, 535, 42, 535, '#10b981', 3),
    lineStroke(35, 565, 42, 565, '#10b981', 3),

    // Corner decorations - small triangles
    // Top-left
    { points: [mkPt(20, 15), mkPt(35, 15), mkPt(20, 30)], color: '#7c3aed', width: 2, tool: 'triangle' as any, fillColor: '#7c3aed', fillOpacity: 0.3, fillType: 'solid' },
    // Top-right
    { points: [mkPt(W - 20, 15), mkPt(W - 35, 15), mkPt(W - 20, 30)], color: '#7c3aed', width: 2, tool: 'triangle' as any, fillColor: '#7c3aed', fillOpacity: 0.3, fillType: 'solid' },

    // Star decoration near formulas
    { points: [mkPt(35, 665), mkPt(40, 655), mkPt(45, 665), mkPt(50, 655), mkPt(55, 665)], color: '#8b5cf6', width: 2, tool: 'star' as any, fillColor: '#c4b5fd', fillOpacity: 0.4, fillType: 'solid' },
  ];

  // --- Layer 1: Text content ---
  const textAnnotations: TextAnnotation[] = [
    // Title
    text(1, W / 2 - 80, 52, '📚 Study Notes', 22, '#4c1d95', true, false),

    // Section headers
    text(2, 35, 140, '✦ Key Concepts', 15, '#be185d', true),
    text(3, W / 2 + 25, 140, '◎ Diagram', 15, '#1d4ed8', true),

    // Key concepts content
    text(4, 48, 175, 'Main idea goes here...', 11, '#6b7280', false, false),
    text(5, 48, 200, 'Supporting detail one', 11, '#6b7280', false, false),
    text(6, 48, 225, 'Supporting detail two', 11, '#6b7280', false, false),
    text(7, 48, 250, 'Additional notes & context', 11, '#6b7280', false, false),

    // Diagram labels
    text(8, W / 2 + W / 4 - 35, 300, 'Label A', 10, '#3b82f6', false, true),
    text(9, W / 2 + W / 4 + 30, 215, 'Label B', 10, '#3b82f6', false, true),
    text(10, W / 2 + W / 4 - 30, 160, 'Label C', 10, '#6366f1', false, true),
    text(11, W / 2 + W / 4 - 65, 215, 'Label D', 10, '#6366f1', false, true),

    // Section 3 header
    text(12, 35, 448, '★ Important Notes', 15, '#047857', true),

    // Important notes content
    text(13, 48, 475, '→ Point one: Write your key takeaway here', 11, '#374151'),
    text(14, 48, 505, '→ Point two: Add supporting evidence or examples', 11, '#374151'),
    text(15, 48, 535, '→ Point three: Cross-reference with other topics', 11, '#374151'),
    text(16, 48, 565, '→ Point four: Note any questions to follow up on', 11, '#374151'),

    // Section 4 header
    text(17, 35, 678, '∑ Formulas', 15, '#6d28d9', true),
    // Formula placeholders
    text(18, 40, 710, 'Formula 1 = A × B', 12, '#4c1d95', false, true),
    text(19, 40, 738, 'Formula 2 = C + D²', 12, '#4c1d95', false, true),
    text(20, 40, 766, 'Formula 3 = E / F', 12, '#4c1d95', false, true),

    // Section 5 header
    text(21, W / 2 + 25, 678, '⚡ Quick Facts', 15, '#b45309', true),
    // Quick facts
    text(22, W / 2 + 30, 710, '• Fact one: Brief info', 11, '#78350f'),
    text(23, W / 2 + 30, 735, '• Fact two: Key detail', 11, '#78350f'),
    text(24, W / 2 + 30, 760, '• Fact three: Remember this', 11, '#78350f'),
    text(25, W / 2 + 30, 785, '• Fact four: Important date/number', 11, '#78350f'),

    // Summary header
    text(26, 35, 888, '📝 Summary', 15, '#be185d', true),
    text(27, 40, 920, 'Write a brief summary of the topic here. Include the main', 11, '#6b7280'),
    text(28, 40, 942, 'points, key relationships, and anything you need to review.', 11, '#6b7280'),
    text(29, 40, 968, 'This section helps with recall and spaced repetition.', 11, '#6b7280'),

    // Footer
    text(30, W / 2 - 60, 1085, 'Made with Flowist ✨', 10, '#a78bfa', false, true),
  ];

  // Sticky notes
  const stickyNotes: StickyNoteData[] = [
    sticky(1, W - 170, 320, 140, 90, '💡 Tip:\nHighlight key terms\nand review daily!', '#FBCFE8', 10, -3),
    sticky(2, 30, 1090, 130, 85, '📌 Remember:\nPractice > Reading\nActive recall works!', '#BBF7D0', 10, 2),
    sticky(3, W - 180, 870, 150, 85, '🎯 Goal:\nUnderstand & apply\nnot just memorize', '#BFDBFE', 10, -2),
    sticky(4, W / 2 - 70, 1095, 140, 80, '⭐ Review Date:\n__/__/____', '#E9D5FF', 11, 0),
  ];

  // Washi tapes
  const washiTapes: WashiTapeData[] = [
    washi(1, -5, 95, 180, 18, 'hearts-pink', -2),
    washi(2, W - 160, 95, 170, 18, 'clouds-blue', 1),
    washi(3, W / 2 - 80, 635, 160, 16, 'stars-purple', 0),
    washi(4, 10, 845, 140, 16, 'flowers-pink', -1),
  ];

  const layer0: Layer = {
    id: 0,
    name: 'Decorations',
    strokes: bgStrokes,
    textAnnotations: [],
    stickyNotes: [],
    images: [],
    washiTapes: washiTapes,
    opacity: 1,
    visible: true,
  };

  const layer1: Layer = {
    id: 1,
    name: 'Content',
    strokes: [],
    textAnnotations: textAnnotations,
    stickyNotes: stickyNotes,
    images: [],
    washiTapes: [],
    opacity: 1,
    visible: true,
  };

  const sketchData: SketchData = {
    layers: [layer0, layer1],
    activeLayerId: 1,
    background: 'grid-sm',
    width: W,
    height: H,
    version: 2,
  };

  return JSON.stringify(sketchData);
};

// Available sketch templates for the template sheet
export const SKETCH_TEMPLATES = [
  {
    id: 'aesthetic-study-notes',
    name: 'Aesthetic Study Notes',
    description: 'Beautiful pre-made study layout with colored sections, diagrams, sticky notes & washi tapes',
    generator: generateAestheticStudyNotes,
  },
];
