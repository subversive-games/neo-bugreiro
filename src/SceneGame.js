function SceneGame() {

    this.bgm = null;

    // common stuff
    this.blinkSymbolTrigger = false;
    this.blinkSymbolTime = 0;
    this.symbolFrame = null;
    this.symbolFrameIndex = 0;
    this.symbolBarTime = 0;
    this.currentSymbol = 0;
    this.fromSymbol = 0;
    this.toSymbol = 0;
    this.circleCuts = 0;
    this.symbolMultiplier = 0;
    this.noSymbols = false;

    // ending
    this.peacefulTime = 0;
    this.tParam = 0;
    this.tParam2 = 0;
    this.tParam3 = 0;
    this.endFirstText = '';
    this.endSecText = '';
    this.endThrText = null;
    this.endingControl = new GameEnding(this);

    this.endingImage = null;
    this.blinkEndingImageTimer = 0;
    this.blinkEndingImageTrigger = false;

    this.onTribeArea = 0;
    this.lastCulledCheck = false;
    this.gameEnded = false;


    this.start = function () {

        this.reset();

        // starting 
        this.transition.out();
        this.events.subscribeOnce('transition_end', function () {
            Environment.endGame = 0;
        });
        this.bgm = this.audio.play('gameMusic', 0.3, true);

        // tilemap
        var map;

        if (AntifaControl.fascistMode === true) {
            map = this.create.tilemap('tilemap');
        } else {
            map = this.create.tilemap('tilemap_long');
        }
        var tilemap = map.modules.get('render');
        Environment.map = tilemap;
        Environment.mapColliderLayer = tilemap.getTileLayer('GameLayer');
        Environment.mapColliderUpperLayer = tilemap.getTileLayer('UpperLayer');

        // get auxillary objects from tilemap
        var tilemapResource = this.cache.tilemap.get('tilemap');
        var offset = 0;
        var objlayer = tilemapResource.getObjectsLayer('FolkSpawn');
        Environment.safePoints = tilemapResource.getObjectsLayer('SafePoints').objects;

        if (AntifaControl.fascistMode === true) {
            Environment.largeTribeArea = tilemapResource.getObjectsLayer('FolkTribe').objects.at(0);
            Environment.tribeArea = tilemapResource.getObjectsLayer('FolkTribe').objects.at(1);
        } else {
            Environment.blockingPaths = tilemap.getObjectsLayer('BlockedPaths').objects;
            offset = -224;
        }

        PathFinder.map = tilemap;
        PathFinder.collisionPredicate = FolkPathFindCollisionTest;

        var player = null;
        var objs = objlayer.objects;
        var pID = -1;
        var occupiedSpawnPoints = [];

        this.endingControl.onEventEnd = GameControlEndingEventEnd;
        this.endingControl.onEventUpdate = GameEndingControlEventUpdate;

        if (AntifaControl.fascistMode === true) {
            // Fascist Player
            player = this.entity.create(Bugreiro);
            // game control
            this.symbolMultiplier = 4;
            this.symbolFrame = dollarSymbolFrame;
            // folk movement limit
            folkLimit.xMin = 26;
            folkLimit.xMax = 35;

        } else {

            // game control
            this.symbolFrame = flagSymbolFrame;
            this.symbolMultiplier = 1;

            // folk movement limit
            folkLimit.xMin = 10;
            folkLimit.xMax = 31;

            // Antifa player
            player = CreateFolkPlayer(this, objs, occupiedSpawnPoints, offset);
            pID = player.id;
            // create bugreiro ai
            Environment.ai = this.entity.create(BugreiroAI);

        }

        Environment.player = player;

        // Folks
        InstantiateFolks(this, objs, occupiedSpawnPoints, pID, offset);

    };

    this.reset = function () {
        Environment.reset();
        AntifaControl.reset();
        this.endingControl.reset();

        if (!this.pool.has("bullet"))
            this.pool.create("bullet", Bullet, 10);
        if (!this.pool.has("bullet_efx"))
            this.pool.create("bullet_efx", ShootEffect, 10);
        if (!this.pool.has("explosion"))
            this.pool.create('explosion', BulletExplosion, 10);


        this.gameEnded = false;
        this.tParam = 0;
        this.tParam2 = 0;
        this.tParam3 = 0;

        this.noSymbols = false;
        this.currentSymbol = 0;
        this.fromSymbol = 0;
        this.toSymbol = 0;
        this.symbolBarTime = 0;
        this.symbolFrameIndex = 0;
        this.blinkEndingImageTimer = 0;
        this.blinkEndingImageTrigger = false;

        this.peacefulTime = 0;
        this.onTribeArea = 0;
        this.lastCulledCheck = false;
    };

    this.update = function (dt) {

        // common update
        if (AntifaControl.activeSymbolBar === true) {

            /// blinking symbol bar
            this.blinkSymbolTime += dt;
            this.symbolBarTime += dt / 0.25;

            if (this.symbolBarTime > 1.0) {
                this.symbolBarTime = 1.0;
            }

            if (this.blinkSymbolTime >= 0.2) {
                this.blinkSymbolTime = 0;
                this.blinkSymbolTrigger = !this.blinkSymbolTrigger;


                if (AntifaControl.fascistMode === true) { // fascist symbol
                    if (AntifaControl.naziCount > this.currentSymbol) {
                        this.fromSymbol = this.currentSymbol;
                        this.toSymbol = AntifaControl.naziCount;
                        this.symbolBarTime = 0;
                    }
                } else {
                    if (Environment.player.tile.x >= FPLAYER_TILE_START) {
                        this.fromSymbol = this.currentSymbol;
                        // Math.round((Environment.player.tile.x - FPLAYER_TILE_START) / FPLAYER_SYMBOL_SET);
                        this.toSymbol = Math.round(scintilla.Math.lerp(0, 32, (Environment.player.tile.x - FPLAYER_TILE_START) / FPLAYER_TILE_MAX));
                        if (this.toSymbol > 32) {
                            this.toSymbol = 32;
                        }

                        this.symbolBarTime = 0;
                    }
                }

            }

            // animation of symbols bar
            this.currentSymbol = scintilla.Math.lerp(this.fromSymbol, this.toSymbol, this.symbolBarTime);
            if (AntifaControl.fascistMode === false) {
                this.currentSymbol = Math.round(this.currentSymbol);
            }
        }

        // ending update
        if (this.gameEnded === true) {

            if (this.endingControl.currentEvent >= 4) {

                // blinking symbol
                this.blinkEndingImageTimer += dt;

                if (this.blinkEndingImageTimer > 0.48) {
                    this.blinkEndingImageTimer = 0;
                    this.blinkEndingImageTrigger = !this.blinkEndingImageTrigger;
                }

            }

            this.endingControl.update(dt);
        }

        // selective update
        if (AntifaControl.fascistMode === true) {
            CameraFollowBugreiro(this.camera, Environment.player);
            FascistUpdate.call(this, dt);

        } else {
            CameraFollowFolkPlayer(this.camera, Environment.player);
            AntifaUpdate.call(this,dt);
        }


    };

    this.gui = function (drawer) {
        // universal rect
        drawer.color = '#000';
        drawer.rect(0, 0, 320, 16);

        // fade out rect
        if (this.gameEnded === true) {
            //drawer.color = '#000';
            drawer.alpha = this.tParam;
            drawer.rect(0, 0, 320, 240);
            drawer.alpha = 1;
        }

        //if (AntifaControl.fascistMode) {
        GameUI.call(this, drawer);
        //}

    };
}