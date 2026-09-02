export const CROPS = {
    carrot: { emojiReady: '🥕', emojiMid: '🌿', emojiSprout: '🌱', cost: 5, growTime: 10, profit: 15 },
    corn: { emojiReady: '🌽', emojiMid: '🌾', emojiSprout: '🌱', cost: 15, growTime: 30, profit: 50 },
    watermelon: { emojiReady: '🍉', emojiMid: '🪴', emojiSprout: '🌱', cost: 50, growTime: 60, profit: 200 }
};

export class FarmLogic {
    constructor(game) {
        this.game = game;
        
        // 2D Map of tiles: Map<x, Map<y, Tile>>
        this.tiles = new Map();
        
        // Initial Farm plot (5x5 around 0,0)
        for(let x = -2; x <= 2; x++) {
            for(let y = -2; y <= 2; y++) {
                this.addTile(x, y, 'grass');
            }
        }
        
        this.lastAction = { x: null, y: null, tool: null, time: 0 };
        
        // Farm Animals for cute ambiance
        this.animals = [
            this.createAnimal('dog', '🐕', 0.8),
            this.createAnimal('cat', '🐈', 0.5),
            this.createAnimal('butterfly', '🦋', 1.5),
            this.createAnimal('butterfly2', '🦋', 1.2),
            this.createAnimal('lizard', '🦎', 1.0)
        ];
    }

    createAnimal(type, emoji, speed) {
        return {
            type, emoji, speed,
            x: (Math.random() - 0.5) * 4,
            y: (Math.random() - 0.5) * 4,
            targetX: (Math.random() - 0.5) * 4,
            targetY: (Math.random() - 0.5) * 4,
            pauseTime: Math.random() * 2,
            direction: 1 // 1 for right, -1 for left
        };
    }

    getSize() {
        let count = 0;
        this.tiles.forEach(col => count += col.size);
        return count;
    }

    addTile(x, y, state = 'grass') {
        if (!this.tiles.has(x)) this.tiles.set(x, new Map());
        this.tiles.get(x).set(y, {
            x, y,
            state: state, // 'grass', 'plowed'
            watered: false,
            plant: null // { growth: 0-100 }
        });
    }

    getTile(x, y) {
        if (this.tiles.has(x)) {
            return this.tiles.get(x).get(y);
        }
        return null;
    }

    hasTile(x, y) {
        return this.getTile(x, y) !== null;
    }

    interact(x, y, tool) {
        // Debounce to prevent rapid spamming on the exact same tile
        const now = Date.now();
        if (this.lastAction.x === x && this.lastAction.y === y && 
            this.lastAction.tool === tool && now - this.lastAction.time < 300) {
            return;
        }
        
        const tile = this.getTile(x, y);
        if (!tile) return;

        // If plant is withered, ANY interaction triggers the heal puzzle
        if (tile.plant && tile.plant.isWithered) {
            let mistakes = 0;
            this.game.math.triggerHealPuzzle(() => {
                tile.plant.isWithered = false;
                if (Math.random() < 0.10) {
                    tile.plant.bonusMultiplier = 2; // 10% chance for 2x yield
                }
            }, () => {
                mistakes++;
                if (mistakes >= 3) {
                    alert('ต้นไม้ตายแล้ว!');
                    tile.plant = null;
                    tile.state = 'plowed';
                    return true; // Close the modal
                }
                return false;
            });
            return; // Block other tool actions
        }

        this.lastAction = { x, y, tool, time: now };

        let actionTool = tool;
        let seedType = null;
        if (tool.startsWith('seed-')) {
            seedType = tool.split('-')[1];
            actionTool = 'seed';
        }

        switch(actionTool) {
            case 'hoe':
                if (tile.state === 'grass') {
                    tile.state = 'plowed';
                    if(this.game.audio) this.game.audio.playPlant();
                }
                break;
            case 'seed':
                if (tile.state === 'plowed' && !tile.plant) {
                    const crop = CROPS[seedType];
                    if (crop && this.game.spendMoney(crop.cost)) {
                        tile.plant = { type: seedType, growth: 0, isWithered: false, rolledWither: false, bonusMultiplier: 1 };
                        if(this.game.audio) this.game.audio.playPlant();
                    } else if (crop) {
                        alert(`เงินไม่พอซื้อเมล็ดพันธุ์! (ต้องการ ${crop.cost} บาท)`);
                        if(this.game.audio) this.game.audio.playError();
                    }
                }
                break;
            case 'water':
                if (tile.state === 'plowed' && !tile.watered) {
                    if (this.game.useWater()) {
                        tile.watered = true;
                        if(this.game.audio) this.game.audio.playWater();
                    }
                }
                break;
            case 'harvest':
                if (tile.plant && tile.plant.growth >= 100 && !tile.plant.isWithered) {
                    const cropType = tile.plant.type || 'carrot';
                    const profit = CROPS[cropType] ? CROPS[cropType].profit : 15;
                    const multiplier = tile.plant.bonusMultiplier || 1;
                    const totalProfit = profit * multiplier;
                    
                    tile.plant = null;
                    tile.watered = false; // Harvesting dries the soil
                    
                    if(this.game.audio) this.game.audio.playPlant();
                    
                    this.game.addMoney(totalProfit);
                }
                break;
        }
    }

    expandFarm(area) {
        // Expand the bounds based on the solved area size roughly
        const currentSize = Math.sqrt(this.getSize());
        const increase = Math.ceil(Math.sqrt(area) / 2);
        const newRadius = Math.floor(currentSize / 2) + increase;
        
        for(let x = -newRadius; x <= newRadius; x++) {
            for(let y = -newRadius; y <= newRadius; y++) {
                if (!this.hasTile(x, y)) {
                    this.addTile(x, y, 'grass');
                }
            }
        }
    }

    update(dt) {
        // Grow plants over time
        this.tiles.forEach(col => {
            col.forEach(tile => {
                if (tile.plant && tile.watered && tile.plant.growth < 100 && !tile.plant.isWithered) {
                    const cropType = tile.plant.type || 'carrot';
                    const timeRequired = CROPS[cropType] ? CROPS[cropType].growTime : 10;
                    // timeRequired is in seconds. Growth is 0 to 100.
                    const growthRate = 100 / timeRequired; 

                    tile.plant.growth += (growthRate * (dt / 1000));
                    if (tile.plant.growth >= 100) {
                        tile.plant.growth = 100;
                        if (!tile.plant.rolledWither) {
                            tile.plant.rolledWither = true;
                            if (Math.random() < 0.30) {
                                tile.plant.isWithered = true;
                            }
                        }
                    }
                }
            });
        });

        // Update Animals
        if (this.animals) {
            this.animals.forEach(animal => {
                if (animal.pauseTime > 0) {
                    animal.pauseTime -= dt / 1000;
                    return;
                }

                const dx = animal.targetX - animal.x;
                const dy = animal.targetY - animal.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < 0.1) {
                    // Reached target, pick new target within farm bounds
                    let minX = 0, maxX = 0, minY = 0, maxY = 0;
                    this.tiles.forEach(col => {
                        col.forEach(tile => {
                            minX = Math.min(minX, tile.x);
                            maxX = Math.max(maxX, tile.x);
                            minY = Math.min(minY, tile.y);
                            maxY = Math.max(maxY, tile.y);
                        });
                    });
                    
                    // Add a little padding so they can walk slightly outside
                    animal.targetX = (minX - 1) + Math.random() * (maxX - minX + 2);
                    animal.targetY = (minY - 1) + Math.random() * (maxY - minY + 2);
                    animal.pauseTime = Math.random() * 3 + 0.5; // pause 0.5 to 3.5 seconds
                } else {
                    // Move towards target
                    const moveDist = animal.speed * (dt / 1000);
                    animal.x += (dx / dist) * moveDist;
                    animal.y += (dy / dist) * moveDist;
                    animal.direction = dx > 0 ? 1 : -1;
                }
            });
        }
    }
}
