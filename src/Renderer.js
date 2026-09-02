export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.GRID_SIZE = 64; // Increased for higher fidelity drawing
        
        this.camera = { x: 0, y: 0 };
        this.resize();
    }

    centerCamera() {
        if (!this.canvas.parentElement) return;
        this.camera.x = (this.canvas.parentElement.clientWidth / 2) - (this.GRID_SIZE / 2);
        this.camera.y = (this.canvas.parentElement.clientHeight / 2) - (this.GRID_SIZE / 2);
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    moveCamera(dx, dy) {
        this.camera.x += dx;
        this.camera.y += dy;
    }

    hash(x, y) {
        let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
        return n - Math.floor(n);
    }

    renderEnvironment(startX, startY, endX, endY, game, time) {
        const startGridX = Math.floor(startX / this.GRID_SIZE) - 1;
        const endGridX = Math.ceil(endX / this.GRID_SIZE) + 1;
        const startGridY = Math.floor(startY / this.GRID_SIZE) - 1;
        const endGridY = Math.ceil(endY / this.GRID_SIZE) + 1;

        for (let gx = startGridX; gx <= endGridX; gx++) {
            for (let gy = startGridY; gy <= endGridY; gy++) {
                
                const screenX = gx * this.GRID_SIZE;
                const screenY = gy * this.GRID_SIZE;

                // Base grass pattern (subtle checkerboard or noise)
                const isAlt = (gx + gy) % 2 === 0;
                this.ctx.fillStyle = isAlt ? '#7CB342' : '#8BC34A'; 
                this.ctx.fillRect(screenX, screenY, this.GRID_SIZE, this.GRID_SIZE);
                
                // Only draw big decorations outside the farm
                if (!game.farm.hasTile(gx, gy)) {
                    const h = this.hash(gx, gy);
                    
                    if (h < 0.05) {
                        // Draw a pond/water puddle
                        this.ctx.fillStyle = '#4FC3F7';
                        this.ctx.beginPath();
                        this.ctx.arc(screenX + 32, screenY + 32, 24, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        // Water ripple animation
                        const ripple = Math.sin(time * 2 + h * 10) * 2;
                        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.arc(screenX + 32, screenY + 32, 14 + ripple, 0, Math.PI * 2);
                        this.ctx.stroke();
                    } 
                    else if (h < 0.12) {
                        // Pine tree 🌲
                        this.ctx.font = `${this.GRID_SIZE * 0.9}px Arial, sans-serif`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
                        this.ctx.shadowOffsetY = 8;
                        this.ctx.shadowBlur = 4;
                        this.ctx.fillText('🌲', screenX + 32, screenY + 32 - 12);
                        this.ctx.shadowColor = 'transparent';
                    }
                    else if (h < 0.20) {
                        // Oak tree 🌳
                        this.ctx.font = `${this.GRID_SIZE * 0.8}px Arial, sans-serif`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
                        this.ctx.shadowOffsetY = 8;
                        this.ctx.shadowBlur = 4;
                        this.ctx.fillText('🌳', screenX + 32, screenY + 32 - 10);
                        this.ctx.shadowColor = 'transparent';
                    }
                    else if (h < 0.23) {
                        // Rocks 🪨
                        this.ctx.font = `${this.GRID_SIZE * 0.5}px Arial, sans-serif`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('🪨', screenX + 32, screenY + 32 + 5);
                    }
                    else if (h < 0.25) {
                        // Mushroom 🍄
                        this.ctx.font = `${this.GRID_SIZE * 0.4}px Arial, sans-serif`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('🍄', screenX + 32, screenY + 32 + 10);
                    }
                    else if (h < 0.35) {
                        // Wild flowers 🌸 🌼 🌺
                        let flower = '🌸';
                        if (h > 0.32) flower = '🌺';
                        else if (h > 0.28) flower = '🌼';
                        
                        this.ctx.font = `${this.GRID_SIZE * 0.35}px Arial, sans-serif`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        
                        // Gentle sway animation
                        const sway = Math.sin(time * 2 + h * 20) * 4;
                        this.ctx.fillText(flower, screenX + 20 + sway + (h*100)%20, screenY + 20 + (h*200)%20);
                    }
                    else {
                        // Just wild grass tufts
                        this.ctx.fillStyle = '#689F38';
                        this.ctx.fillRect(screenX + 16, screenY + 16, 4, 12);
                        this.ctx.fillRect(screenX + 44, screenY + 36, 4, 10);
                        this.ctx.fillRect(screenX + 28, screenY + 50, 6, 8);
                    }
                }
            }
        }
    }

    render(game) {
        const time = Date.now() / 1000; // For gentle animations

        // Draw soft green background for the outer bounds
        this.ctx.fillStyle = '#689F38'; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);

        const startX = -this.camera.x;
        const startY = -this.camera.y;
        const endX = startX + this.canvas.width;
        const endY = startY + this.canvas.height;
        
        // Render natural environment background first
        this.renderEnvironment(startX, startY, endX, endY, game, time);

        // Draw Farm Tiles
        game.farm.tiles.forEach((col, x) => {
            col.forEach((tile, y) => {
                if (!tile) return;
                
                const screenX = x * this.GRID_SIZE;
                const screenY = y * this.GRID_SIZE;
                
                // Simple Frustum Culling
                if (screenX + this.GRID_SIZE < startX || screenX > endX || 
                    screenY + this.GRID_SIZE < startY || screenY > endY) {
                    return;
                }
                
                // 1. Draw Base Terrain
                if (tile.state === 'grass') {
                    // Distinct farm plot grass (lighter, manicured)
                    this.ctx.fillStyle = '#AED581';
                    this.ctx.fillRect(screenX, screenY, this.GRID_SIZE, this.GRID_SIZE);
                    
                    // Subtle checkered pattern to indicate farmability
                    if ((x + y) % 2 === 0) {
                        this.ctx.fillStyle = '#9CCC65';
                        this.ctx.fillRect(screenX, screenY, this.GRID_SIZE, this.GRID_SIZE);
                    }
                    
                    // Draw tiny manicured grass tufts
                    this.ctx.fillStyle = '#8BC34A';
                    this.ctx.fillRect(screenX + 16, screenY + 20, 6, 6);
                    this.ctx.fillRect(screenX + 40, screenY + 40, 6, 6);
                    
                } else if (tile.state === 'plowed') {
                    // Dirt base
                    this.ctx.fillStyle = tile.watered ? '#5D4037' : '#8D6E63';
                    this.ctx.fillRect(screenX, screenY, this.GRID_SIZE, this.GRID_SIZE);
                    
                    // Inner dirt block
                    this.ctx.fillStyle = tile.watered ? '#4E342E' : '#795548';
                    this.ctx.fillRect(screenX + 2, screenY + 2, this.GRID_SIZE - 4, this.GRID_SIZE - 4);
                    
                    // Soil ridges for realism
                    this.ctx.fillStyle = tile.watered ? '#3E2723' : '#5D4037';
                    this.ctx.fillRect(screenX + 8, screenY + 16, this.GRID_SIZE - 16, 8);
                    this.ctx.fillRect(screenX + 8, screenY + 32, this.GRID_SIZE - 16, 8);
                    this.ctx.fillRect(screenX + 8, screenY + 48, this.GRID_SIZE - 16, 8);

                    // Add water glint
                    if (tile.watered) {
                        this.ctx.fillStyle = 'rgba(129, 212, 250, 0.2)';
                        this.ctx.fillRect(screenX + 12, screenY + 16, this.GRID_SIZE - 24, 4);
                        this.ctx.fillRect(screenX + 12, screenY + 32, this.GRID_SIZE - 24, 4);
                    }
                }
                
                // Draw grid border for clarity (dotted or dashed looks cute)
                this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([4, 4]);
                this.ctx.strokeRect(screenX, screenY, this.GRID_SIZE, this.GRID_SIZE);
                this.ctx.setLineDash([]); // reset
                
                // Wooden Border / Fence for outer edges
                this.ctx.fillStyle = '#6D4C41'; // Dark wood color
                const bw = 4; // border width
                if (!game.farm.hasTile(x, y - 1)) {
                    this.ctx.fillRect(screenX, screenY, this.GRID_SIZE, bw);
                }
                if (!game.farm.hasTile(x, y + 1)) {
                    this.ctx.fillRect(screenX, screenY + this.GRID_SIZE - bw, this.GRID_SIZE, bw);
                }
                if (!game.farm.hasTile(x - 1, y)) {
                    this.ctx.fillRect(screenX, screenY, bw, this.GRID_SIZE);
                }
                if (!game.farm.hasTile(x + 1, y)) {
                    this.ctx.fillRect(screenX + this.GRID_SIZE - bw, screenY, bw, this.GRID_SIZE);
                }

                // 2. Draw Plants
                if (tile.plant) {
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    
                    const cropType = tile.plant.type || 'carrot';
                    const cropDef = game.farm ? game.farm.CROPS : null; 
                    // To avoid circular dependency issues, we can just define emojis here or import. 
                    // Let's use a local fallback dictionary if needed.
                    const emojis = {
                        carrot: { ready: '🥕', mid: '🌿', sprout: '🌱' },
                        corn: { ready: '🌽', mid: '🌾', sprout: '🌱' },
                        watermelon: { ready: '🍉', mid: '🪴', sprout: '🌱' }
                    };
                    const cropEmojis = emojis[cropType] || emojis.carrot;

                    let emoji = cropEmojis.sprout;
                    let sizeMultiplier = 0.5;
                    let yOffset = 0;
                    
                    if (tile.plant.growth >= 100) {
                        emoji = cropEmojis.ready; // Harvest ready
                        sizeMultiplier = 0.8;
                        yOffset = -4; // Stand slightly taller
                    } else if (tile.plant.growth > 50) {
                        emoji = cropEmojis.mid; // Growing
                        sizeMultiplier = 0.6 + (tile.plant.growth / 100) * 0.2;
                    } else {
                        emoji = cropEmojis.sprout; // Sprout
                        sizeMultiplier = 0.4 + (tile.plant.growth / 100) * 0.2;
                    }
                    
                    // Gentle breathing animation using sine wave based on time and position
                    const breath = Math.sin(time * 3 + x + y) * 2;
                    
                    const fontSize = this.GRID_SIZE * sizeMultiplier;
                    this.ctx.font = `${fontSize}px Arial, sans-serif`;
                    
                    const cx = screenX + this.GRID_SIZE / 2;
                    const cy = screenY + this.GRID_SIZE / 2 + yOffset + breath;

                    // Drop shadow for depth
                    this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
                    this.ctx.shadowOffsetY = 4;
                    this.ctx.shadowBlur = 4;
                    
                    // Magical glow if ready to harvest
                    if (tile.plant.growth >= 100) {
                        this.ctx.shadowColor = 'rgba(255, 235, 59, 0.9)';
                        this.ctx.shadowOffsetY = 0;
                        this.ctx.shadowBlur = 20;
                    }
                    
                    if (tile.plant.isWithered) {
                        this.ctx.filter = 'grayscale(100%) sepia(50%) brightness(80%)';
                    }

                    this.ctx.fillText(emoji, cx, cy);
                    
                    // Reset shadow and filter
                    this.ctx.shadowColor = 'transparent';
                    this.ctx.shadowOffsetY = 0;
                    this.ctx.shadowBlur = 0;
                    this.ctx.filter = 'none';

                    if (tile.plant.isWithered) {
                        // Draw warning icon above
                        this.ctx.font = `${this.GRID_SIZE * 0.3}px Arial`;
                        this.ctx.fillText('🥀', cx, cy - this.GRID_SIZE * 0.5);
                    } else if (tile.plant.bonusMultiplier === 2) {
                        // Draw 2x bonus indicator
                        this.ctx.font = `bold ${this.GRID_SIZE * 0.25}px Arial`;
                        this.ctx.fillStyle = '#FFD54F';
                        this.ctx.strokeStyle = '#5D4037';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeText('x2', cx + this.GRID_SIZE * 0.3, cy - this.GRID_SIZE * 0.3);
                        this.ctx.fillText('x2', cx + this.GRID_SIZE * 0.3, cy - this.GRID_SIZE * 0.3);
                    }
                }
            });
        });

        // 3. Draw Animals
        if (game.farm.animals) {
            game.farm.animals.forEach(animal => {
                const screenX = animal.x * this.GRID_SIZE;
                const screenY = animal.y * this.GRID_SIZE;

                this.ctx.save();
                this.ctx.translate(screenX + this.GRID_SIZE / 2, screenY + this.GRID_SIZE / 2);
                
                // Flip horizontally based on direction (if going left, direction is -1)
                this.ctx.scale(animal.direction, 1);
                
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.font = `${this.GRID_SIZE * 0.5}px Arial`;

                // Add bounce/float animation
                let yOffset = 0;
                if (animal.type === 'butterfly' || animal.type === 'butterfly2') {
                    // float high and flutter fast
                    yOffset = Math.sin(time * 5 + animal.x) * 10 - 15; 
                } else {
                    // walking bounce
                    const isMoving = animal.pauseTime <= 0;
                    if (isMoving) {
                        yOffset = Math.abs(Math.sin(time * animal.speed * 8)) * -5;
                    }
                }

                // Shadow
                this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
                this.ctx.shadowOffsetY = 4 - yOffset;
                this.ctx.shadowBlur = 4;

                this.ctx.fillText(animal.emoji, 0, yOffset);
                this.ctx.restore();
            });
        }

        this.ctx.restore();
    }
}
