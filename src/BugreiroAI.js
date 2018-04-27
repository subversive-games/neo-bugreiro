function BugreiroAI() {

    this.spr = null;
    this.isMoving = false;
    this.isShooting = false;
    this.isAttacking = false;

    this.scheduleShoot = false;
    this.timeToCreateBullet = 0;
    this.bulletCreated = false;
    this.animMachine = null;

    this.pursuingPlayer = false;
    this.chainNode = null;
    this.target = null;
    this.targetTile = {
        x: 0,
        y: 0
    };
    this.speedUp = false;
    this.navigation = 0;

    this.start = function () {

        CreateTiledEntity(this, 50);
        this.animMachine = this.modules.attach.animMachine('bugreiro');
        this.animMachine.onAnimationEnd = OnBugreiroAnimationEnd;
        this.origin.set(0.5, 0.5);
        this.spr = this.modules.get('render');
        this.spr.depth = 4;
        this.animMachine.stop();

        this.tile.x = 0;
        this.tile.y = 5;
        SetToTile(this, this.tile.x, this.tile.y);

    };

    this.speedUpBug = function () {
        if (this.speedUp === false) {
            // speed up bugreiro
            this.spd = 58.5; // maybe 57, 57.5, 58, 59
            this.spdDuration = (16 / this.spd);
            this.speedUp = true;
        }
    };

    this.pursuitPlayer = function () {

        // is not on screen
        if (!this.scene.camera.isCulled(this.spr) && Environment.player.tile.x >= FPLAYER_TILE_START) {
            // move bugreiro to left screen
            var cameraTile = GetFlooredTile(this.scene.camera.x, this.scene.camera.y);
            cameraTile.x -= 2;
            var transportTile = TileTrace(cameraTile, 0, 1, 20);
            SetToRoundedTile(this, transportTile.x, transportTile.y);
            this.speedUpBug();
        }



        // hack to bugreiro go direct to the player
        KillAllFolks();
        this.pursuingPlayer = true;
        this.isMoving = false;
        this.isAttacking = false;
        this.isShooting = false;
        this.bulletCreated = false;
        this.bulletCreated = false;
    };


    this.update = function (dt) {


        if (this.isAttacking === false && this.isShooting === false) {
            if (this.isMoving === false) {


                if (Environment.reachCity === false) {
                    if (this.pursuingPlayer === false) {
                        this.target = GetNearestFolkByTile(this.tile.x, this.tile.y);
                    } else {
                        this.target = null;
                        if (this.speedUp === false && this.tile.x > 32) {
                            this.speedUpBug();
                        }
                    }

                    if (this.target === null) {
                        if (Environment.player.dead === false) {
                            if (this.pursuingPlayer === false) {
                                this.pursuitPlayer();
                            }
                            this.target = Environment.player;
                        }
                    } else {

                        // check if player reach the third flag
                        if (Environment.player.tile.x > 43) {
                            if (Environment.player.dead === false) {
                                if (this.pursuingPlayer === false) {
                                    this.pursuitPlayer();
                                }
                                this.target = Environment.player;
                            }
                        } else {

                            if (Environment.player.dead === false) {
                                // check if player is near
                                var distToPlayer = scintilla.Math.manhattan(this.tile.x, this.tile.y, Environment.player.tile.x, Environment.player.tile.y);
                                var distToFolk = scintilla.Math.manhattan(this.tile.x, this.tile.y, this.target.tile.x, this.target.tile.y);

                                if (distToPlayer.x < distToFolk.x && distToPlayer.y < distToFolk.y) {
                                    this.target = Environment.player;
                                }
                            }

                        }

                    }
                } else {
                    this.target = null;
                }

                var canShoot = null;
                if (this.target !== null) {
                    this.targetTile.x = this.target.tile.x;
                    this.targetTile.y = this.target.tile.y;
                    if (Environment.reachCity === false) {
                        canShoot = BugreiroCanShoot(this, this.target);
                    }
                } else { /// killed everyone
                    this.targetTile.x = 2;
                    this.targetTile.y = 5;
                }
                if (canShoot === null) {

                    this.chainNode = PathFinder.FindPath(this.tile, this.targetTile, undefined, BugreiroAICollisionTest, this);

                    if (this.chainNode !== null) {
                        if (this.chainNode.length > 1) {
                            this.navigation = 1;
                            var dir = ActivePathNodeMovement(this, this.chainNode[1]);
                            ChangeBugreiroState(this, 1, dir);
                        }
                    }
                } else {
                    BugreiroAIScheduleAttack(this, canShoot);
                }

            }
        }

        if (this.isMoving === true) {
            BugreiroTileMovementThroughPathNode(this.chainNode, this, dt, this.spdDuration);
        }

        // Environment.endGame === 0
        if (Environment.reachCity === false) {
            if (this.isShooting === true && this.bulletCreated === false) {

                this.timeToCreateBullet += dt * 1000;

                if (this.timeToCreateBullet >= SHOOT_TIMER) {

                    this.bulletCreated = true;
                    if (Environment.bullets.length < MAX_BULLETS) {
                        var bullet = this.scene.pool.pull('bullet');
                        bullet.setup(this.position, this.dir);

                        Environment.bullets.push(bullet);
                    } else {
                        this.isShooting = false;
                    }
                }

            }
        }

    };



}