function CameraFollowFolkPlayer(camera, player) {

    var camX = player.x - 176;
    if (camX <= 0) {
        camX = 0;
    } else if (camX >= LONG_MAP_MAX - 144 - 176) {
        camX = LONG_MAP_MAX - 144 - 176;
    }
    camera.x = camX;

}

function FolkPlayerCollisionTest(x, y, player, finder) {

    var intersectsWithBlockedPath = false;

    if (finder !== undefined) {
        if (finder === true) {
            if (player.blockedPath !== null) {

                intersectsWithBlockedPath = player.blockedPath.contains(player.destPos.x, player.destPos.y);
            }
        }
    }


    if (CheckMapCollision(x, y) ||
        CollidesWithFolk(x, y, true) ||
        CollideWith(Environment.ai, x, y) ||
        intersectsWithBlockedPath) {
        return true;
    }

    return false;

}

function FolkPlayer() {

    this.animMachine = null;
    this.folkIDName = '_';
    this.blockedPathIndex = 0;
    this.blockedPath = null;
    this.nextBlockedPath = null;
    this.isMoving = false;
    this.isPlayer = true;
    this.dead = false;
    this.dying = false;
    this.reachCity = false;
    this.goToCity = false;
    this.chainNode = null;
    this.navigation = 0;


    this.ChangeState = function (direction) {

        if (direction === undefined) direction = this.dir;

        this.dir = direction;

        var stateName = 'folk_';
        var dirName = "";

        switch (direction) {
            case 0:
            case 1:
                {
                    dirName = "side";
                    break;
                }
            case 2:
                {
                    dirName = "up";
                    break;
                }
            case 3:
                {
                    dirName = "down";
                    break;
                }
        }


        stateName += dirName + this.folkIDName;

        this.animMachine.setState(stateName);

        if (this.animMachine.isPlaying === false) {
            this.animMachine.play();
        }

    };

    this.ActiveMoving = function (flip) {
        this.scale.x = flip;
        this.isMoving = true;
        this.moveTimer = 0;
        this.oldPos.x = this.x;
        this.oldPos.y = this.y;
    };

    this.animationEnd = function () {
        if (Environment.endGame !== 0) {
            this.ChangeState();
            this.animMachine.stop();
        }
    };


    this.start = function () {
        CreateTiledEntity(this, 50);
        this.animMachine = this.modules.attach.animMachine();
        this.blockedPathIndex = -1;
        this.nextBlockedPath = Environment.blockingPaths.at(0);
        this.isPlayer = true;
        this.dead = false;
        this.dying = false;
        this.origin.set(0.5, 0.5);
        this.spr = this.modules.get('render');
        this.spr.depth = 3;
        this.animMachine.stop();
    };

    this.update = function (dt) {
        if (Environment.endGame === 0 && this.dying === false) {

            if (Environment.reachCity === false) {

                var horizontal = -this.scene.key.press(scintilla.KeyCode.Left) + this.scene.key.press(scintilla.KeyCode.Right);
                var vertical = -this.scene.key.press(scintilla.KeyCode.Up) + this.scene.key.press(scintilla.KeyCode.Down);

                if (this.isMoving === false) {


                    if (horizontal !== 0) {
                        this.hspd = horizontal; // * spd;
                        this.vspd = 0;
                        this.ChangeState((horizontal === -1) ? 0 : 1);
                        this.ActiveMoving(-horizontal);
                    } else if (vertical !== 0) {
                        this.vspd = vertical; // * spd;
                        this.hspd = 0;
                        this.ChangeState((vertical == -1) ? 2 : 3);
                        this.ActiveMoving(1);
                    } else {
                        this.animMachine.stop();
                        this.isMoving = false;
                    }

                    if (this.isMoving) {
                        this.oldTile.x = this.tile.x;
                        this.oldTile.y = this.tile.y;
                        this.toTile.x = this.tile.x + this.hspd;
                        this.toTile.y = this.tile.y + this.vspd;
                        this.destPos.x = Math.round(this.toTile.x * 16 + 8);
                        this.destPos.y = Math.round(this.toTile.y * 16 + 8);


                        WorldToTile(this.destPos.x - 8, this.destPos.y - 8, this.toTile);
                        if (FolkPlayerCollisionTest(this.toTile.x, this.toTile.y, this, false)) {
                            this.animMachine.stop();
                            this.isMoving = false;
                            this.toTile.x = -99;
                            this.toTile.y = -99;
                        }
                    }
                }
            } else {
                if (this.goToCity === false) {
                    if (this.isMoving === false) {
                        this.goToCity = true;
                        var dir;
                        if (this.chainNode !== null) {

                            if (this.chainNode.length > 1) {

                                this.navigation = 1;
                                dir = ActivePathNodeMovement(this, this.chainNode[1]);
                                this.ChangeState(dir);
                            }
                        }
                    }
                } else {
                    // if (this.chainNode !== null) {
                    TileMovementThroughPathNode(this.chainNode, this, dt);
                    if (this.navigation >= this.chainNode.length) {
                        this.EndingGame();
                    }
                    //}
                }
            }

            if (this.isMoving && this.goToCity === false) {
                this.moveTimer += dt / this.spdDuration;
                if (this.moveTimer >= 1) {

                    this.isMoving = false;
                    this.moveTimer = 1;
                }
                if (this.hspd !== 0)
                    this.x = scintilla.Math.lerp(this.oldPos.x, this.destPos.x, this.moveTimer);

                if (this.vspd !== 0)
                    this.y = scintilla.Math.lerp(this.oldPos.y, this.destPos.y, this.moveTimer);

                WorldToTile(this.x - 8, this.y - 8, this.tile);

                if (!this.isMoving) {
                    this.x = this.destPos.x;
                    this.y = this.destPos.y;
                    RoundToTile(this);
                    //WorldToTile(this.x - 8, this.y - 8, this.tile);
                    this.oldTile.x = this.tile.x;
                    this.oldTile.y = this.tile.y;
                    if (this.x > this.nextBlockedPath.x + this.nextBlockedPath.width) {
                        this.blockedPathIndex++;
                        if (this.blockedPathIndex < Environment.blockingPaths.size) {

                            this.blockedPath = this.nextBlockedPath;
                            this.nextBlockedPath = Environment.blockingPaths.at(this.blockedPathIndex);

                        } else {
                            this.blockedPath = this.nextBlockedPath;
                        }
                    }
                }
            }

            // 'good' ending
            if (Environment.reachCity === false) {
                if (this.tile.x >= 173) {
                    Environment.playerReachedToCity();
                    this.chainNode = PathFinder.FindPath(
                        this.tile,
                        {
                            x: 192,
                            y: 6
                        },
                        undefined,
                        FolkPlayerCollisionTest,
                        this);
                }
            }


        }
    };

    this.Setup = function (x, y) {
        this.position.set(x + 8, y + 8);
        this.tile = GetTile(this.x - 8, this.y - 8);
        this.oldTile.x = this.tile.x;
        this.oldTile.y = this.tile.y;
        this.animMachine.stop();
        this.dying = false;
        this.dead = false;
    };

    this.Die = function () {

        if (this.dying === true)
            return;

        this.dying = true;
        this.dead = true;

        this.animMachine.stop();
        var x = (this.id % 2) * 16;
        var y = scintilla.Math.floor(this.id / 2) * 16;
        this.spr.setFrame(64 + x, 0 + y, 16, 16);
        var blood = this.scene.create.sprite('effects', 'blood', bloodFrame);
        blood.position.set(this.x - 8, this.y - 8);
        this.spr.depth = 1;
        blood.modules.get('render').depth = 0;
        //AntifaControl.naziCount++;
    };

    this.EndingGame = function () {
        this.animMachine.stop();
        var x = (this.id % 2) * 16;
        var y = scintilla.Math.floor(this.id / 2) * 16;
        this.spr.setFrame(64 + x, 64 + y, 16, 16);
        Environment.endGame = 5;
    };

}