import { InputManager } from './InputManager.js';
import { Renderer } from './Renderer.js';
import { FarmLogic } from './FarmLogic.js';
import { MathSystem } from './MathSystem.js';
import { AINPCManager } from './AINPCManager.js';
import { AudioManager } from './AudioManager.js';

export class GameManager {
    constructor() {
        this.state = 'MENU'; // MENU, PLAYING, MATH_PUZZLE
        this.lastTime = 0;
        
        // DOM Elements
        this.screens = {
            menu: document.getElementById('main-menu'),
            game: document.getElementById('game-ui')
        };
        this.canvas = document.getElementById('game-canvas');
        
        // UI Elements
        this.ui = {
            money: document.getElementById('money'),
            waterFraction: document.getElementById('water-fraction'),
            expandBtn: document.getElementById('expand-btn'),
            restartBtn: document.getElementById('restart-btn'),
            tools: document.querySelectorAll('.tool-btn')
        };

        // Systems
        this.renderer = new Renderer(this.canvas);
        this.input = new InputManager(this.canvas, this);
        this.farm = new FarmLogic(this);
        this.math = new MathSystem(this);
        this.aiNPC = new AINPCManager(this);
        this.audio = new AudioManager();
        
        this.currentTool = 'hoe';
        this.money = 100.00;
        this.waterCapacity = { current: 4, max: 4 }; // 4/4 = 1/1
        
        this.tutorialModal = document.getElementById('tutorial-modal');
        document.getElementById('tutorial-close-btn').addEventListener('click', () => {
            this.tutorialModal.classList.remove('active');
            this.state = 'PLAYING';
            // Trigger an initial NPC event placeholder after tutorial closes
            this.aiNPC.fetchVillageHeadmanEvent(this.getStats()).then(scenario => {
                console.log("NPC Event:", scenario);
                // In a full game, this would render in an NPC modal dialogue
            });
        });
        
        this.bindEvents();
    }

    init() {
        this.loadGame();
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        this.updateUI();
        requestAnimationFrame((time) => this.loop(time));
    }

    bindEvents() {
        // Horizontal scroll by dragging for the toolbar
        const toolbar = document.querySelector('.overflow-x-auto');
        let hasDragged = false;
        
        if (toolbar) {
            let isDown = false;
            let startX;
            let scrollLeft;

            toolbar.addEventListener('mousedown', (e) => {
                isDown = true;
                hasDragged = false;
                toolbar.classList.add('cursor-grabbing');
                startX = e.pageX - toolbar.offsetLeft;
                scrollLeft = toolbar.scrollLeft;
            });
            toolbar.addEventListener('mouseleave', () => {
                isDown = false;
                toolbar.classList.remove('cursor-grabbing');
            });
            toolbar.addEventListener('mouseup', () => {
                isDown = false;
                toolbar.classList.remove('cursor-grabbing');
                // We reset hasDragged on a short timeout to allow click listeners to see it
                setTimeout(() => hasDragged = false, 50);
            });
            toolbar.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - toolbar.offsetLeft;
                const walk = (x - startX) * 2; // Scroll speed multiplier
                if (Math.abs(walk) > 5) {
                    hasDragged = true;
                }
                toolbar.scrollLeft = scrollLeft - walk;
            });
            
            // Allow mouse wheel to scroll horizontally
            toolbar.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    toolbar.scrollLeft += e.deltaY;
                }
            }, { passive: false });
        }

        this.ui.tools.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (hasDragged) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                this.ui.tools.forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                this.currentTool = target.dataset.tool;
            });
        });

        this.ui.restartBtn.addEventListener('click', () => {
            this.restartGame();
        });

        this.ui.expandBtn.addEventListener('click', () => {
            const expandCost = 50;
            if (this.money >= expandCost) {
                this.math.triggerAreaPuzzle((area) => {
                    // Success: expand the farm based on area calculation
                    this.spendMoney(expandCost);
                    this.farm.expandFarm(area);
                });
            } else {
                alert(`เงินไม่พอขยายพื้นที่ฟาร์ม! (ต้องการ ${expandCost} บาท)`);
            }
        });
        
        window.addEventListener('resize', () => {
            this.renderer.resize();
        });
    }

    startGame() {
        this.state = 'TUTORIAL';
        this.screens.menu.classList.remove('active');
        this.screens.game.classList.add('active');
        this.renderer.resize();
        this.renderer.centerCamera();
        
        if (this.audio) {
            this.audio.startBGM();
        }

        // Show tutorial modal before playing
        this.tutorialModal.classList.add('active');
    }

    restartGame() {
        localStorage.removeItem('farmGameSave');
        this.money = 100.00;
        this.waterCapacity = { current: 4, max: 4 };
        
        // Reset farm tiles
        this.farm.tiles.clear();
        for(let x = -2; x <= 2; x++) {
            for(let y = -2; y <= 2; y++) {
                this.farm.addTile(x, y, 'grass');
            }
        }
        
        this.updateUI();
        this.renderer.centerCamera();
        this.saveGame();
    }

    getStats() {
        return {
            money: this.money,
            farmSize: this.farm.getSize()
        };
    }

    updateUI() {
        this.ui.money.innerText = `฿${this.money.toFixed(2)}`;
        
        // Simplify fraction for water visually
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(this.waterCapacity.current, this.waterCapacity.max);
        let num = this.waterCapacity.current / divisor;
        let den = this.waterCapacity.max / divisor;
        if (num === 0) den = 1;
        this.ui.waterFraction.innerText = `${num}/${den}`;
    }

    useWater() {
        if (this.waterCapacity.current > 0) {
            this.waterCapacity.current--;
            this.updateUI();
            this.saveGame();
            return true;
        }
        // Out of water, trigger fraction puzzle to refill
        this.math.triggerFractionPuzzle(() => {
            this.waterCapacity.current = this.waterCapacity.max;
            this.updateUI();
            this.saveGame();
        });
        return false;
    }

    addMoney(amount) {
        this.money += amount;
        if(this.audio) this.audio.playCoin();
        this.updateUI();
        this.saveGame();
    }

    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            this.updateUI();
            this.saveGame();
            return true;
        }
        return false;
    }

    saveGame() {
        try {
            const tilesArray = [];
            this.farm.tiles.forEach((col, x) => {
                col.forEach((tile, y) => {
                    tilesArray.push(tile);
                });
            });
            const data = {
                money: this.money,
                waterCurrent: this.waterCapacity.current,
                waterMax: this.waterCapacity.max,
                tiles: tilesArray
            };
            localStorage.setItem('farmGameSave', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save game', e);
        }
    }

    loadGame() {
        try {
            const saved = localStorage.getItem('farmGameSave');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.money !== undefined) this.money = data.money;
                if (data.waterCurrent !== undefined) this.waterCapacity.current = data.waterCurrent;
                if (data.waterMax !== undefined) this.waterCapacity.max = data.waterMax;
                
                if (data.tiles) {
                    this.farm.tiles = new Map();
                    data.tiles.forEach(t => {
                        if (!this.farm.tiles.has(t.x)) this.farm.tiles.set(t.x, new Map());
                        this.farm.tiles.get(t.x).set(t.y, t);
                    });
                }
            }
        } catch (e) {
            console.error('Failed to load game', e);
        }
    }

    loop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;

        if (this.state === 'PLAYING') {
            this.update(dt);
        }

        if (this.state !== 'MENU') {
            this.renderer.render(this);
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.input.update();
        this.farm.update(dt);
        
        this.saveTimer = (this.saveTimer || 0) + dt;
        if (this.saveTimer > 5000) {
            this.saveGame();
            this.saveTimer = 0;
        }
    }
}
