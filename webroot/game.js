"use strict";

class Example extends Phaser.Scene {
    preload() {

    }

    create() {
        this.add.image(400, 300, 'sky');

        const particles = this.add.particles(0, 0, 'red', {
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD'
        });

        const logo = this.physics.add.image(400, 100, 'logo');

        logo.setVelocity(100, 200);
        logo.setBounce(1, 1);
        logo.setCollideWorldBounds(true);

        particles.startFollow(logo);
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    }

    resize() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Adjust camera
        this.cameras.main.setZoom(this.getOptimalZoom());

        // Reposition UI elements
        this.repositionUI();
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: Example,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 }
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE, // Or other scaling modes
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
