/**
 * Chart and matrix rendering logic.
 */
import { state } from './state.js';
import { getCSSVariable } from './utils.js';

/**
 * Helper to draw wrapped text labels on canvas.
 */
function drawWrappedText(ctx, text, x, y, maxWidth) {
    const fullWidth = ctx.measureText(text).width;
    if (fullWidth <= maxWidth) {
        ctx.fillText(text, x, y + 5);
        return;
    }

    const words = String(text).split(' ');
    let line1 = '', line2 = '';

    for (let i = 0; i < words.length; i++) {
        const candidate = line1 ? line1 + ' ' + words[i] : words[i];
        if (ctx.measureText(candidate).width <= maxWidth) {
            line1 = candidate;
        } else {
            line2 = words.slice(i).join(' ');
            break;
        }
    }

    ctx.fillText(line1, x, y - 2);
    ctx.fillText(line2, x, y + 10);
}

/**
 * Renders the radar/spider chart.
 */
export function drawSpiderChart() {
    const { ctx, canvas } = state.elements;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 240;

    // Grid Circles
    ctx.strokeStyle = getCSSVariable('chart-grid');
    ctx.lineWidth = 1;
    for (let i = 1; i <= state.maxValue; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / state.maxValue) * i, 0, 2 * Math.PI);
        ctx.stroke();
    }

    // Grid Lines & Labels
    const entries = Object.entries(state.categories);
    ctx.fillStyle = getCSSVariable('chart-label');
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';

    entries.forEach(([id, name], i) => {
        const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        const labelX = centerX + Math.cos(angle) * (radius + 40);
        const labelY = centerY + Math.sin(angle) * (radius + 40);
        drawWrappedText(ctx, name, labelX, labelY, 150);
    });

    // Data Polygon
    if (Object.values(state.scores).some(s => s > 0)) {
        ctx.strokeStyle = getCSSVariable('chart-line') || '#0D79CE';
        
        // Premium Gradient Fill
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(13, 121, 206, 0.4)');
        gradient.addColorStop(1, 'rgba(13, 121, 206, 0.1)');
        ctx.fillStyle = gradient;
        
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const points = entries.map(([id], i) => {
            const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
            const distance = ((state.scores[id] || 0) / 100) * radius;
            return {
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance
            };
        });

        if (points.length > 0) {
            ctx.moveTo(points[0].x, points[0].y);

            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                const p3 = points[(i + 2) % points.length];

                const cp1x = p1.x + (p2.x - points[(i - 1 + points.length) % points.length].x) / 6;
                const cp1y = p1.y + (p2.y - points[(i - 1 + points.length) % points.length].y) / 6;

                const cp2x = p2.x - (p3.x - p1.x) / 6;
                const cp2y = p2.y - (p3.y - p1.y) / 6;

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            }
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Points with Glow
        entries.forEach(([id], i) => {
            const angle = (i * 2 * Math.PI) / entries.length - Math.PI / 2;
            const distance = ((state.scores[id] || 0) / 100) * radius;
            const px = centerX + Math.cos(angle) * distance;
            const py = centerY + Math.sin(angle) * distance;

            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(13, 121, 206, 0.5)';
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = getCSSVariable('chart-line') || '#0D79CE';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            ctx.shadowBlur = 0; // Reset shadow
        });
    }
}

/**
 * Renders the maturity matrix table.
 */
export function drawMatrix() {
    const { matrix } = state.elements;
    if (!matrix) return;

    let html = `<thead><th></th>${Array.from({ length: state.maxValue }, (_, i) => `<th width="40">${i + 1}</th>`).join('')}<th width="80" class="score-header">%</th></thead><tbody>`;

    for (const [id, name] of Object.entries(state.categories)) {
        const valMap = state.counts[id] || {};
        let total = 0;
        for (let i = 1; i <= state.maxValue; i++) total += (valMap[i] || 0);

        html += `<tr><td>${name}</td>`;
        for (let i = 1; i <= state.maxValue; i++) {
            const percentage = total > 0 ? (valMap[i] || 0) / total : 0;
            const heatLevel = percentage > 0 ? Math.ceil(percentage * 5) : 0;
            html += `<td class="heat_${heatLevel}"> </td>`;
        }
        html += `<td class="score-cell">${state.scores[id] || 0}</td></tr>`;
    }

    matrix.innerHTML = html + '</tbody>';
}

/**
 * Triggers all chart re-renders.
 */
export function drawAll() {
    drawSpiderChart();
    drawMatrix();
}
