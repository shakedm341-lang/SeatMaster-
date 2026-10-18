import { Table, Guest, DanceFloor } from '../types';

export interface MapExportOptions {
  title?: string;
  cropToContent?: boolean;
  scale?: number; // 1 = standard, 2 = HD (recommended), 3 = Ultra HD
  includeGuestNames?: boolean;
  theme?: 'clean' | 'blueprint' | 'dark';
}

interface TableDimensions {
  width: number;
  height: number;
  isRound: boolean;
  isRect: boolean;
}

function getTableDims(capacity: number): TableDimensions {
  if (capacity >= 10 && capacity <= 12) {
    return { width: 120, height: 120, isRound: false, isRect: false };
  }
  if (capacity >= 18 && capacity <= 24) {
    return { width: 240, height: 100, isRound: false, isRect: true };
  }
  return { width: 100, height: 100, isRound: true, isRect: false };
}

/**
 * Helper to draw a rounded rectangle on a canvas context
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Renders the seating plan floor plan to an HTMLCanvasElement
 */
export async function renderMapToCanvas(
  tables: Table[],
  guests: Guest[],
  danceFloor?: DanceFloor | null,
  options: MapExportOptions = {}
): Promise<HTMLCanvasElement> {
  const {
    title = 'מפת סידור שולחנות',
    cropToContent = true,
    scale = 2,
    includeGuestNames = false,
    theme = 'clean',
  } = options;

  const placedTables = tables.filter((t) => t.position && t.position.isPlaced !== false);

  // Hall boundary definitions
  const HALL_ORIGINAL_WIDTH = 1200;
  const HALL_ORIGINAL_HEIGHT = 3000;

  let originX = 0;
  let originY = 0;
  let renderWidth = HALL_ORIGINAL_WIDTH;
  let renderHeight = HALL_ORIGINAL_HEIGHT;

  if (cropToContent && placedTables.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Calculate bounds of all placed tables
    placedTables.forEach((table) => {
      const pos = table.position || { x: 0, y: 0 };
      const dims = getTableDims(table.capacity);
      const halfW = dims.width / 2 + 30; // buffer for chairs
      const halfH = dims.height / 2 + 30;
      minX = Math.min(minX, pos.x - halfW);
      minY = Math.min(minY, pos.y - halfH);
      maxX = Math.max(maxX, pos.x + dims.width + halfW);
      maxY = Math.max(maxY, pos.y + dims.height + halfH);
    });

    // Also include dance floor if present
    if (danceFloor) {
      minX = Math.min(minX, danceFloor.x - 20);
      minY = Math.min(minY, danceFloor.y - 20);
      maxX = Math.max(maxX, danceFloor.x + danceFloor.width + 20);
      maxY = Math.max(maxY, danceFloor.y + danceFloor.height + 20);
    }

    // Add healthy padding and space for stage header and entrance footer
    const paddingSide = 80;
    const paddingTop = 160; // For title & stage
    const paddingBottom = 160; // For entrance & legend

    originX = Math.max(0, Math.floor(minX - paddingSide));
    originY = Math.max(0, Math.floor(minY - paddingTop));

    const rightBound = Math.min(HALL_ORIGINAL_WIDTH, Math.ceil(maxX + paddingSide));
    const bottomBound = Math.min(HALL_ORIGINAL_HEIGHT, Math.ceil(maxY + paddingBottom));

    renderWidth = Math.max(900, rightBound - originX);
    renderHeight = Math.max(700, bottomBound - originY);
  } else if (cropToContent && placedTables.length === 0) {
    // Default reasonable view if empty
    renderWidth = HALL_ORIGINAL_WIDTH;
    renderHeight = 1200;
  }

  // Create canvas with scale multiplier
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(renderWidth * scale);
  canvas.height = Math.round(renderHeight * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Scale up for high resolution
  ctx.scale(scale, scale);
  ctx.translate(-originX, -originY);

  // 1. Draw Hall Floor Background
  if (theme === 'blueprint') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(originX, originY, renderWidth, renderHeight);

    // Blueprint grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = originX; x < originX + renderWidth; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, originY);
      ctx.lineTo(x, originY + renderHeight);
      ctx.stroke();
    }
    for (let y = originY; y < originY + renderHeight; y += 30) {
      ctx.beginPath();
      ctx.moveTo(originX, y);
      ctx.lineTo(originX + renderWidth, y);
      ctx.stroke();
    }
  } else {
    // Clean light architectural style
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(originX, originY, renderWidth, renderHeight);

    // Elegant subtle dot grid
    ctx.fillStyle = '#cbd5e1';
    for (let x = originX + 20; x < originX + renderWidth; x += 32) {
      for (let y = originY + 20; y < originY + renderHeight; y += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 2. Outer Hall Border & Header
  ctx.strokeStyle = theme === 'blueprint' ? '#334155' : '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.strokeRect(originX + 8, originY + 8, renderWidth - 16, renderHeight - 16);

  // 3. Stage Banner (Top of hall)
  const stageY = Math.max(originY + 24, 40);
  const centerX = originX + renderWidth / 2;

  ctx.fillStyle = theme === 'blueprint' ? '#1e293b' : '#f1f5f9';
  roundRect(ctx, centerX - 140, stageY, 280, 36, 18);
  ctx.fill();
  ctx.strokeStyle = theme === 'blueprint' ? '#475569' : '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 13px Rubik, Heebo, sans-serif';
  ctx.fillStyle = theme === 'blueprint' ? '#94a3b8' : '#475569';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎭  במה / קדמת האולם', centerX, stageY + 18);

  // 4. Header Event Info Box
  const headerBoxY = originY + 70;
  ctx.fillStyle = theme === 'blueprint' ? '#1e293b' : '#f8fafc';
  roundRect(ctx, centerX - 260, headerBoxY, 520, 56, 14);
  ctx.fill();
  ctx.strokeStyle = theme === 'blueprint' ? '#334155' : '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = 'bold 17px Rubik, Heebo, sans-serif';
  ctx.fillStyle = theme === 'blueprint' ? '#f8fafc' : '#0f172a';
  ctx.fillText(title, centerX, headerBoxY + 20);

  const totalAssignedPeople = guests
    .filter((g) => g.tableId && placedTables.some((t) => t.id === g.tableId))
    .reduce((sum, g) => sum + g.partySize, 0);

  const totalSeats = placedTables.reduce((sum, t) => sum + t.capacity, 0);
  const infoText = `שולחנות באולם: ${placedTables.length}  |  מקומות ישיבה: ${totalSeats}  |  מוזמנים משובצים: ${totalAssignedPeople}`;
  ctx.font = '12px Rubik, Heebo, sans-serif';
  ctx.fillStyle = theme === 'blueprint' ? '#94a3b8' : '#64748b';
  ctx.fillText(infoText, centerX, headerBoxY + 41);

  // 5. Draw Dance Floor (if placed)
  if (danceFloor) {
    ctx.save();
    ctx.fillStyle = theme === 'blueprint' ? '#1e1b4b' : '#eef2ff';
    roundRect(ctx, danceFloor.x, danceFloor.y, danceFloor.width, danceFloor.height, 20);
    ctx.fill();

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dance floor label
    ctx.font = 'bold 15px Rubik, Heebo, sans-serif';
    ctx.fillStyle = '#4f46e5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎶 רחבת ריקודים', danceFloor.x + danceFloor.width / 2, danceFloor.y + danceFloor.height / 2);
    ctx.restore();
  }

  // 6. Draw Tables and Chairs
  placedTables.forEach((table) => {
    const pos = table.position || { x: 0, y: 0, rotation: 0 };
    const dims = getTableDims(table.capacity);
    const seatedGuests = guests.filter((g) => g.tableId === table.id);
    const seatedCount = seatedGuests.reduce((sum, g) => sum + g.partySize, 0);
    const rotation = pos.rotation || 0;

    const tableCenterX = pos.x + dims.width / 2;
    const tableCenterY = pos.y + dims.height / 2;

    ctx.save();
    ctx.translate(tableCenterX, tableCenterY);
    ctx.rotate((rotation * Math.PI) / 180);

    // 6.a Draw Chairs Around Table
    const totalChairs = Math.max(1, table.capacity);
    const chairRadius = 6;

    if (dims.isRound) {
      const radius = dims.width / 2;
      const chairOrbit = radius + 12;

      for (let i = 0; i < totalChairs; i++) {
        const angle = (i * 2 * Math.PI) / totalChairs - Math.PI / 2;
        const cx = Math.cos(angle) * chairOrbit;
        const cy = Math.sin(angle) * chairOrbit;

        ctx.beginPath();
        ctx.arc(cx, cy, chairRadius, 0, Math.PI * 2);
        if (i < seatedCount) {
          ctx.fillStyle = '#6366f1'; // Seated chair (indigo)
        } else {
          ctx.fillStyle = theme === 'blueprint' ? '#334155' : '#e2e8f0'; // Empty chair
        }
        ctx.fill();
        ctx.strokeStyle = theme === 'blueprint' ? '#64748b' : '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else {
      // Rectangle or Square chairs along the perimeter
      const w = dims.width;
      const h = dims.height;
      const margin = 12;
      const topBottomChairs = dims.isRect ? Math.floor(totalChairs * 0.4) : Math.floor(totalChairs / 4);
      const sideChairs = dims.isRect ? Math.floor((totalChairs - topBottomChairs * 2) / 2) : Math.floor(totalChairs / 4);

      let chairIdx = 0;

      // Top side
      for (let i = 0; i < topBottomChairs && chairIdx < totalChairs; i++) {
        const cx = -w / 2 + (w / (topBottomChairs + 1)) * (i + 1);
        const cy = -h / 2 - margin;
        ctx.beginPath();
        ctx.arc(cx, cy, chairRadius, 0, Math.PI * 2);
        ctx.fillStyle = chairIdx < seatedCount ? '#6366f1' : theme === 'blueprint' ? '#334155' : '#e2e8f0';
        ctx.fill();
        ctx.strokeStyle = theme === 'blueprint' ? '#64748b' : '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();
        chairIdx++;
      }

      // Bottom side
      for (let i = 0; i < topBottomChairs && chairIdx < totalChairs; i++) {
        const cx = -w / 2 + (w / (topBottomChairs + 1)) * (i + 1);
        const cy = h / 2 + margin;
        ctx.beginPath();
        ctx.arc(cx, cy, chairRadius, 0, Math.PI * 2);
        ctx.fillStyle = chairIdx < seatedCount ? '#6366f1' : theme === 'blueprint' ? '#334155' : '#e2e8f0';
        ctx.fill();
        ctx.strokeStyle = theme === 'blueprint' ? '#64748b' : '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();
        chairIdx++;
      }

      // Left & Right sides
      for (let i = 0; i < sideChairs && chairIdx < totalChairs; i++) {
        const cy = -h / 2 + (h / (sideChairs + 1)) * (i + 1);
        // Left
        ctx.beginPath();
        ctx.arc(-w / 2 - margin, cy, chairRadius, 0, Math.PI * 2);
        ctx.fillStyle = chairIdx < seatedCount ? '#6366f1' : theme === 'blueprint' ? '#334155' : '#e2e8f0';
        ctx.fill();
        ctx.stroke();
        chairIdx++;

        // Right
        if (chairIdx < totalChairs) {
          ctx.beginPath();
          ctx.arc(w / 2 + margin, cy, chairRadius, 0, Math.PI * 2);
          ctx.fillStyle = chairIdx < seatedCount ? '#6366f1' : theme === 'blueprint' ? '#334155' : '#e2e8f0';
          ctx.fill();
          ctx.stroke();
          chairIdx++;
        }
      }
    }

    // 6.b Draw Table Surface
    ctx.beginPath();
    if (dims.isRound) {
      ctx.arc(0, 0, dims.width / 2, 0, Math.PI * 2);
    } else {
      roundRect(ctx, -dims.width / 2, -dims.height / 2, dims.width, dims.height, 16);
    }

    ctx.fillStyle = theme === 'blueprint' ? '#1e293b' : '#ffffff';
    ctx.fill();

    // Table border color based on status
    if (seatedCount > table.capacity) {
      ctx.strokeStyle = '#e11d48'; // Overloaded (red)
      ctx.lineWidth = 3;
    } else if (seatedCount === table.capacity) {
      ctx.strokeStyle = '#10b981'; // Full (green)
      ctx.lineWidth = 2.5;
    } else if (seatedCount > 0) {
      ctx.strokeStyle = '#6366f1'; // Assigned (indigo)
      ctx.lineWidth = 2.5;
    } else {
      ctx.strokeStyle = theme === 'blueprint' ? '#475569' : '#cbd5e1';
      ctx.lineWidth = 2;
    }
    ctx.stroke();

    // 6.c Draw Table Text (Counter-rotate so text is always horizontal & legible)
    ctx.rotate((-rotation * Math.PI) / 180);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Table Name
    ctx.font = 'bold 14px Rubik, Heebo, sans-serif';
    ctx.fillStyle = theme === 'blueprint' ? '#f8fafc' : '#0f172a';
    ctx.fillText(table.name, 0, -8);

    // Capacity & Occupancy Badge
    ctx.font = 'bold 10px Rubik, Heebo, sans-serif';
    if (seatedCount > 0) {
      ctx.fillStyle = seatedCount > table.capacity ? '#e11d48' : '#4f46e5';
      ctx.fillText(`${seatedCount}/${table.capacity} מקומות`, 0, 12);
    } else {
      ctx.fillStyle = theme === 'blueprint' ? '#94a3b8' : '#64748b';
      ctx.fillText(`${table.capacity} מקומות`, 0, 12);
    }

    // Optional: Draw seated guest list below table if requested
    if (includeGuestNames && seatedGuests.length > 0) {
      const guestNamesText = seatedGuests
        .map((g) => (g.partySize > 1 ? `${g.name} (${g.partySize})` : g.name))
        .join(', ');

      ctx.font = '9px Rubik, Heebo, sans-serif';
      ctx.fillStyle = theme === 'blueprint' ? '#cbd5e1' : '#334155';

      // Truncate if too long
      const maxTextWidth = Math.max(dims.width + 40, 160);
      let truncated = guestNamesText;
      if (ctx.measureText(truncated).width > maxTextWidth) {
        while (ctx.measureText(truncated + '...').width > maxTextWidth && truncated.length > 3) {
          truncated = truncated.slice(0, -1);
        }
        truncated += '...';
      }
      ctx.fillText(truncated, 0, dims.height / 2 + 28);
    }

    ctx.restore();
  });

  // 7. Entrance Banner (Bottom of hall)
  const entranceY = Math.min(originY + renderHeight - 65, HALL_ORIGINAL_HEIGHT - 40);
  ctx.fillStyle = theme === 'blueprint' ? '#1e293b' : '#f1f5f9';
  roundRect(ctx, centerX - 140, entranceY, 280, 36, 18);
  ctx.fill();
  ctx.strokeStyle = theme === 'blueprint' ? '#475569' : '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 13px Rubik, Heebo, sans-serif';
  ctx.fillStyle = theme === 'blueprint' ? '#94a3b8' : '#475569';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚪  כניסת אורחים ראשית', centerX, entranceY + 18);

  // 8. Legend at bottom right
  const legendX = originX + 24;
  const legendY = originY + renderHeight - 55;
  ctx.font = '11px Rubik, Heebo, sans-serif';
  ctx.textAlign = 'left';

  // Blue chair icon
  ctx.beginPath();
  ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#6366f1';
  ctx.fill();
  ctx.fillStyle = theme === 'blueprint' ? '#94a3b8' : '#475569';
  ctx.fillText('מקום תפוס', legendX + 12, legendY);

  // Gray chair icon
  ctx.beginPath();
  ctx.arc(legendX + 85, legendY, 5, 0, Math.PI * 2);
  ctx.fillStyle = theme === 'blueprint' ? '#334155' : '#cbd5e1';
  ctx.fill();
  ctx.fillStyle = theme === 'blueprint' ? '#94a3b8' : '#475569';
  ctx.fillText('מקום פנוי', legendX + 97, legendY);

  return canvas;
}

/**
 * Generates a PNG Blob from the seating plan
 */
export async function generateMapImageBlob(
  tables: Table[],
  guests: Guest[],
  danceFloor?: DanceFloor | null,
  options: MapExportOptions = {}
): Promise<Blob> {
  const canvas = await renderMapToCanvas(tables, guests, danceFloor, options);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create map image blob'));
    }, 'image/png');
  });
}

/**
 * Triggers an automatic download of the seating plan map image
 */
export async function downloadMapImage(
  tables: Table[],
  guests: Guest[],
  danceFloor?: DanceFloor | null,
  options: MapExportOptions = {},
  filename?: string
): Promise<void> {
  const blob = await generateMapImageBlob(tables, guests, danceFloor, options);
  const defaultName = `seating-plan-map-${new Date().toISOString().slice(0, 10)}.png`;
  const finalFilename = filename || defaultName;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
