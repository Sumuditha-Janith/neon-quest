import * as PIXI from 'pixi.js';

export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export class GameWorld {
    constructor(app, interactablesData, onInteract, onUpdateProximityHint, isAnyModalOpenRef) {
        this.app = app;
        this.interactablesData = interactablesData;
        this.onInteract = onInteract;
        this.onUpdateProximityHint = onUpdateProximityHint;
        this.isAnyModalOpenRef = isAnyModalOpenRef;

        this.player = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, radius: 16, speed: 5.1 };
        this.playerOffsetY = 0;
        this.highlightedGraphic = null;
        this.closestItem = null;

        this.keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false, KeyE: false };
        this.interactPressed = false;
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);

        this.playerGraphic = null;
        this.interactableGraphics = new Map();
        this.bobPhases = new Map();
        this.highlightRing = null;

        this.initGraphics();
        this.app.ticker.add(() => this.update());
    }

    initGraphics() {
        // Player
        this.playerGraphic = new PIXI.Graphics();
        this.playerGraphic.lineStyle(3.5, 0x000000, 0.95);
        this.playerGraphic.beginFill(0x3a86ff);
        this.playerGraphic.drawCircle(0, 0, this.player.radius);
        this.playerGraphic.endFill();
        this.playerGraphic.beginFill(0xffffff);
        this.playerGraphic.drawCircle(-6.5, -5, 4.2);
        this.playerGraphic.drawCircle(6.5, -5, 4.2);
        this.playerGraphic.endFill();
        this.playerGraphic.beginFill(0x0a0f1e);
        this.playerGraphic.drawCircle(-6.5, -5, 1.9);
        this.playerGraphic.drawCircle(6.5, -5, 1.9);
        this.playerGraphic.endFill();
        this.playerGraphic.position.set(this.player.x, this.player.y);
        this.app.stage.addChild(this.playerGraphic);

        // Interactables
        this.interactablesData.forEach(item => {
            const graphic = new PIXI.Graphics();
            const isNPC = ['npc', 'mrsGino', 'tommy'].includes(item.id);

            if (isNPC) {
                graphic.lineStyle(4.5, 0x111111, 0.9);
                graphic.beginFill(item.color);
                graphic.drawCircle(0, 0, item.radius);
                graphic.endFill();

                const icon = new PIXI.Text(item.icon, { fontSize: 28, fill: 0xffffff, dropShadow: true, dropShadowBlur: 5, dropShadowDistance: 3 });
                icon.anchor.set(0.5);
                icon.position.set(0, -9);
                graphic.addChild(icon);

                const label = new PIXI.Text(item.name, { fontSize: 15, fill: 0xffffff, fontWeight: "bold", dropShadow: true, dropShadowBlur: 5, dropShadowDistance: 3 });
                label.anchor.set(0.5);
                label.position.set(0, -item.radius - 22);
                graphic.addChild(label);
            } else {
                graphic.lineStyle(4, 0x111111, 0.9);
                graphic.beginFill(item.color);
                graphic.drawRect(-item.radius, -item.radius, item.radius * 2, item.radius * 2);
                graphic.endFill();

                const icon = new PIXI.Text(item.icon, { fontSize: 32, fill: 0xffffff, dropShadow: true, dropShadowBlur: 5 });
                icon.anchor.set(0.5);
                graphic.addChild(icon);

                const label = new PIXI.Text(item.name, { fontSize: 14, fill: 0xffffff, fontWeight: "bold", dropShadow: true });
                label.anchor.set(0.5);
                label.position.set(0, item.radius + 18);
                graphic.addChild(label);
            }

            graphic.position.set(item.x, item.y);
            this.app.stage.addChild(graphic);
            this.interactableGraphics.set(item.id, graphic);

            if (isNPC) this.bobPhases.set(item.id, Math.random() * Math.PI * 2);
        });

        // Highlight ring
        this.highlightRing = new PIXI.Graphics();
        this.app.stage.addChild(this.highlightRing);

        // Background grid
        const grid = new PIXI.Graphics();
        grid.lineStyle(1, 0x88aadd, 0.22);
        for (let i = 0; i < WORLD_WIDTH; i += 45) {
            grid.moveTo(i, 0);
            grid.lineTo(i, WORLD_HEIGHT);
            grid.moveTo(0, i);
            grid.lineTo(WORLD_WIDTH, i);
        }
        this.app.stage.addChildAt(grid, 0);
    }

    _onKeyDown(e) {
        const code = e.code;
        if (this.keys.hasOwnProperty(code)) {
            this.keys[code] = true;
            if (code === 'KeyE') this.interactPressed = true;
            e.preventDefault();
        }
        if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight') {
            e.preventDefault();
        }
    }

    _onKeyUp(e) {
        const code = e.code;
        if (this.keys.hasOwnProperty(code)) this.keys[code] = false;
    }

    isMoveUp() { return this.keys.KeyW; }
    isMoveDown() { return this.keys.KeyS; }
    isMoveLeft() { return this.keys.KeyA; }
    isMoveRight() { return this.keys.KeyD; }
    isInteractJustPressed() {
        if (this.interactPressed) {
            this.interactPressed = false;
            return true;
        }
        return false;
    }

    update() {
        if (!this.isAnyModalOpenRef.current) this.handleMovement();
        this.applyBoundaries();

        const moving = this.isMoveUp() || this.isMoveDown() || this.isMoveLeft() || this.isMoveRight();
        this.playerOffsetY = moving ? Math.sin(Date.now() / 110) * 3.2 : 0;
        this.playerGraphic.position.set(this.player.x, this.player.y + this.playerOffsetY);

        this.interactablesData.forEach(item => {
            if (this.bobPhases.has(item.id)) {
                const g = this.interactableGraphics.get(item.id);
                const phase = this.bobPhases.get(item.id);
                const bob = Math.sin(Date.now() / 280 + phase) * 3.8;
                g.position.y = item.y + bob;
            }
        });

        this.checkInteractions();
    }

    handleMovement() {
        let dx = 0, dy = 0;
        if (this.isMoveUp()) dy -= 1;
        if (this.isMoveDown()) dy += 1;
        if (this.isMoveLeft()) dx -= 1;
        if (this.isMoveRight()) dx += 1;
        if (dx || dy) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;
            this.player.x += dx * this.player.speed;
            this.player.y += dy * this.player.speed;
        }
    }

    applyBoundaries() {
        this.player.x = Math.min(Math.max(this.player.x, this.player.radius), WORLD_WIDTH - this.player.radius);
        this.player.y = Math.min(Math.max(this.player.y, this.player.radius), WORLD_HEIGHT - this.player.radius);
    }

    checkInteractions() {
        let closestDist = Infinity;
        let closest = null;

        for (const item of this.interactablesData) {
            const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
            const threshold = this.player.radius + item.radius + 14;
            if (dist < threshold && dist < closestDist) {
                closestDist = dist;
                closest = item;
            }
        }

        if (closest) {
            const g = this.interactableGraphics.get(closest.id);
            if (this.highlightedGraphic !== g) {
                if (this.highlightedGraphic) this.highlightedGraphic.scale.set(1);
                g.scale.set(1.13);
                this.highlightedGraphic = g;
            }
        } else if (this.highlightedGraphic) {
            this.highlightedGraphic.scale.set(1);
            this.highlightedGraphic = null;
        }

        this.closestItem = closest;
        this.highlightRing.clear();
        if (closest) {
            const pulse = 18 + Math.sin(Date.now() / 110) * 4;
            this.highlightRing.lineStyle(7, 0xffee44, 0.8);
            this.highlightRing.drawCircle(closest.x, closest.y, closest.radius + pulse);
        }

        let hint = closest ? `💬 Press [E] to interact with ${closest.name}` : "";
        this.onUpdateProximityHint(hint);

        if (this.isInteractJustPressed() && closest) this.onInteract(closest.id);
    }

    destroy() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        this.app.ticker.stop();
        this.app.destroy(true);
    }
}