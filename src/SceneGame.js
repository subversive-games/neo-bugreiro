function SceneGame() {

    var camSpeed = 100;
    var player;
    var tilemap;

    var peacefulTime = 0;

    // fascist stuff
    var blinkDollarTime = 0;
    var blinkTrigger = false;
    var currentSymbol = 0;
    var fromSymbol = 0;
    var toSymbol = 0;
    var symbolTime = 0;
    var tribeArea = null;
    var onTribeArea = 0;



    this.start = function () {
        this.transition.out();
        this.audio.play('gameMusic', 0.3, true);

        // pool
        this.pool.create("bullet", Bullet, 10);
        this.pool.create("bullet_efx", ShootEffect, 10);
        this.pool.create('explosion', BulletExplosion, 10);

        // tilemap
        var map = this.create.tilemap('tilemap');
        tilemap = map.modules.get('render');
        Environment.map = tilemap;
        Environment.largeTribeArea = tilemap.getObjectsLayer('FolkTribe').objects[0];
        Environment.tribeArea = tilemap.getObjectsLayer('FolkTribe').objects[1];
        Environment.safePoints = tilemap.getObjectsLayer('SafePoints').objects;

        PathFinder.map = tilemap;
        PathFinder.collisionPredicate = PathFindCollisionTest;

        // Player
        player = this.entity.create(Player);
        Environment.player = player;

        InstantiateFolks(this, tilemap);


    };

    this.update = function (dt) {
        CameraFollowPlayer(this.camera, player);


        this.naziUpdate(dt);

    };

    this.naziUpdate = function (dt) {

        if (AntifaControl.killedFirstFolk === true) {

            blinkDollarTime += dt;
            symbolTime += dt / 0.25;

            if (symbolTime > 1.0) {
                symbolTime = 1.0;
            }

            if (blinkDollarTime >= 0.2) {
                blinkDollarTime = 0;
                blinkTrigger = !blinkTrigger;


                if (AntifaControl.naziCount > currentSymbol) {
                    fromSymbol = currentSymbol;
                    toSymbol = AntifaControl.naziCount;
                    symbolTime = 0;
                }

            }

            currentSymbol = scintilla.Math.lerp(fromSymbol, toSymbol, symbolTime);
        } else {
            if (onTribeArea === 0) {
                if (Environment.largeTribeArea.intersects(player.x, player.y, 8, 8)) {
                    onTribeArea = 1;
                    player.reachTheTribe = true;
                }
            } else if (onTribeArea >= 1 && AntifaControl.peace === true) {

                if (onTribeArea == 1) {
                    if (Environment.tribeArea.intersects(player.x, player.y, 8, 8)) {
                        onTribeArea = 2;
                    }
                } else {
                    peacefulTime += dt;

                    if (peacefulTime >= 30) {
                        Environment.endGame = 1;
                    }
                }
            }
        }
    }

    this.naziUI = function (drawer) {

        if (currentSymbol > 0) {

            var fy = 0;
            var j;

            for (var i = 0; i < currentSymbol * 4; i++) { // 64

                j = i % 2;

                fy = (blinkTrigger - j === 0) ? 0 : 1;

                drawer.spritePart('chars', 2 + (10 * i), 5 - fy, 128, 176 + (fy * 8), 8, 8);
            }
        }

    };

    this.gui = function (drawer) {
        drawer.color = '#000';
        drawer.rect(0, 0, 320, 16);

        this.naziUI(drawer);
        //draw.font('Press Start 2P', 7, 'normal');
        //drawer.text('SCORE: 999', 8, 12, 'white', 'left');

    };
}