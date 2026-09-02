export class InputManager {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        
        this.lastTouch = null;
        this.startTouch = null;
        this.hasMoved = false;
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), {passive: false});
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), {passive: false});
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Mouse fallbacks for desktop testing/emulation
        this.canvas.addEventListener('mousedown', (e) => this.onTouchStart(this.mouseEventToTouch(e)));
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.lastTouch) this.onTouchMove(this.mouseEventToTouch(e));
        });
        this.canvas.addEventListener('mouseup', () => this.onTouchEnd());
        this.canvas.addEventListener('mouseleave', () => this.onTouchEnd());
    }
    
    mouseEventToTouch(e) {
        return {
            preventDefault: () => {},
            touches: [{ clientX: e.clientX, clientY: e.clientY }]
        };
    }

    getCanvasPos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        // Calculate scale in case canvas display size differs from internal size
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    getGridPos(canvasX, canvasY) {
        const renderer = this.game.renderer;
        // Adjust for camera offset
        const worldX = canvasX - renderer.camera.x;
        const worldY = canvasY - renderer.camera.y;
        return {
            x: Math.floor(worldX / renderer.GRID_SIZE),
            y: Math.floor(worldY / renderer.GRID_SIZE)
        };
    }

    onTouchStart(e) {
        if (this.game.state !== 'PLAYING') return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const pos = this.getCanvasPos(touch.clientX, touch.clientY);
        
        this.lastTouch = pos;
        this.startTouch = pos;
        this.hasMoved = false;
    }

    onTouchMove(e) {
        if (this.game.state !== 'PLAYING') return;
        e.preventDefault();
        if (!this.lastTouch) return;
        
        const touch = e.touches[0];
        const pos = this.getCanvasPos(touch.clientX, touch.clientY);
        
        const dx = pos.x - this.lastTouch.x;
        const dy = pos.y - this.lastTouch.y;
        
        if (!this.hasMoved) {
            const dist = Math.hypot(pos.x - this.startTouch.x, pos.y - this.startTouch.y);
            if (dist > 5) {
                this.hasMoved = true;
            }
        }
        
        if (this.hasMoved) {
            this.game.renderer.moveCamera(dx, dy);
        }
        
        this.lastTouch = pos;
    }

    onTouchEnd(e) {
        if (!this.hasMoved && this.startTouch) {
            // It was a tap! Apply tool if tapping on a tile (or anywhere in farm bounds)
            const gridPos = this.getGridPos(this.startTouch.x, this.startTouch.y);
            if (this.game.farm.hasTile(gridPos.x, gridPos.y)) {
                this.applyTool(gridPos);
            }
        }
        
        this.lastTouch = null;
        this.startTouch = null;
        this.hasMoved = false;
    }
    
    applyTool(gridPos) {
        // Apply tool to a specific grid cell
        this.game.farm.interact(gridPos.x, gridPos.y, this.game.currentTool);
    }

    update() {}
}
