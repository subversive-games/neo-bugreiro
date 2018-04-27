function SceneLogo() {

    this.waitLogoTime = 0;
    this.done = false;
    this.goToScene = 'title';

    this.preload = function () {
        this.load.setPath('assets/');

        /// TITLE
        this.load.webFont('font', 'google', 'Press Start 2P');
        this.load.image('titleNeo', 'img/n_title_neo.png');
        this.load.image('titleBugre', 'img/n_title_bugre.png');
        this.load.image('titleBugreBack', 'img/n_title_bugre_fill.png');
        this.load.image('titleBorder', 'img/n_title_bugre_border.png');
        this.load.image('titleChroma', 'img/n_title_chrome.bmp');

        this.load.image('titleBg', 'img/n_title_bg.bmp');
        this.load.image('antifaJamLogo', 'img/antifagamejamlogo.png');

        /// AUDIO
        this.load.audio('titleMusic', 'sfx/505-loop3.ogg');
        this.load.audio('gameMusic', 'sfx/505-myth.ogg');
        this.load.audio('ok', 'sfx/n_confirm.wav');
        this.load.audio('shoot', 'sfx/n_shot.wav');
        this.load.audio('explosion', 'sfx/n_explosion.wav');
        this.load.audio('dead', 'sfx/n_dead.wav');

        /// GAME
        this.load.tilemapJSON('tilemap', 'map/n_tilemap.json');
        this.load.tilemapJSON('tilemap_long', 'map/n_tilemap_long.json');
        this.load.image('bugreiro', 'img/n_bugreiro.png');
        this.load.image('npcs', 'img/n_npcs.png');
        this.load.image('effects', 'img/n_effects.png');
        this.load.image('fucku', 'img/n_fuck_fascist.png');
        this.load.image('shaking', 'img/n_shaking.png');
        this.load.image('cocar', 'img/n_cocar.png');
        this.load.image('revolution', 'img/n_revolution.png');
        this.load.image('hat', 'img/n_hat.png');

        // Bugreiro
        this.load.spritesheet('bug_down', 'bugreiro', [0, 0, 16, 16, 2], 123);
        this.load.spritesheet('bug_side', 'bugreiro', [0, 16, 16, 16, 2], 123);
        this.load.spritesheet('bug_up', 'bugreiro', [0, 32, 16, 16, 2], 123);
        this.load.spritesheet('bug_shoot_down', 'bugreiro', [32, 0, 16, 16, 4], 120);
        this.load.spritesheet('bug_shoot_side', 'bugreiro', [32, 16, 16, 16, 4], 120);
        this.load.spritesheet('bug_shoot_up', 'bugreiro', [32, 32, 16, 16, 4], 120);
        this.load.spritesheet('bug_blade_up', 'bugreiro', [32, 48, 16, 16, 4], 60);
        this.load.spritesheet('bug_blade_side', 'bugreiro', [32, 64, 16, 16, 4], 60);
        this.load.spritesheet('bug_blade_down', 'bugreiro', [32, 80, 16, 16, 4], 60);
        this.load.animMachine('bugreiro', [
            'bug_down', 'bug_side', 'bug_up',
            'bug_shoot_down', 'bug_shoot_side', 'bug_shoot_up',
            'bug_blade_down', 'bug_blade_side', 'bug_blade_up'
        ]);

        // Ending images
        this.load.spritesheet('fuck_fascist', 'fucku', [0, 0, 55, 77, 2], 200);
        this.load.spritesheet('hand_shaking', 'shaking', [0, 0, 96, 77, 2], 200);
        this.load.spritesheet('cocar', 'cocar', [0, 0, 77, 70, 2], 200);
        this.load.spritesheet('revolution', 'revolution', [0, 0, 53, 80, 2], 200);
        this.load.spritesheet('hat', 'hat', [0, 0, 85, 48, 2], 200);

        // Effects
        this.load.spritesheet('shoot_effect_side', 'effects', [0, 0, 16, 16, 3, 1], 120);
        this.load.spritesheet('shoot_effect_updown', 'effects', [16, 0, 16, 16, 3, 1], 120);
        this.load.spritesheet('bullet_explosion', 'effects', [32, 0, 16, 16, 4, 1], 120);
        this.load.spritesheet('blood_explosion', 'effects', [64, 0, 16, 16, 5, 1], 160);
        this.load.spritesheet('alert', 'effects', [48, 16, 16, 16, 4, 1], 160);
        this.load.spritesheet('dol_to_naz_0', 'effects', [96, 64, 8, 8, 4, 2]);
        this.load.spritesheet('dol_to_naz_1', 'effects', [112, 64, 8, 8, 4, 2]);
        this.load.spritesheet('rot_quad', 'effects', [128, 32, 8, 8, 2, 1]);
        //this.load.spritesheet('rot_quad_1', 'effects', [112, 40, 8, 8, 2]);

        /// FOLKS
        var x = 0;
        var y = 0;
        var row = 0;
        var folkDown, folkUp, folkSide;
        var dur = 240;

        for (var i = 0; i < MAX_FOLKS; i++) {

            folkDown = 'folk_down_' + i.toString();
            folkSide = 'folk_side_' + i.toString();
            folkUp = 'folk_up_' + i.toString();
            this.load.spritesheet(folkDown, 'npcs', [x, y, 16, 16, 2], dur);
            this.load.spritesheet(folkSide, 'npcs', [x, y + 16, 16, 16, 2], dur);
            this.load.spritesheet(folkUp, 'npcs', [x, y + 32, 16, 16, 2], dur);
            this.load.animMachine('folk_' + i.toString(), [folkDown, folkSide, folkUp]);

            row++;
            if (row >= 2) {
                row = 0;
                x = 0;
                y += 48;
            } else {
                x += 32;
            }
        }

        this.events.subscribe("asset_complete", function (asset, type) {

            if (type === scintilla.AssetType.spritesheet) {
                var dur = (16 / 50) / 2;
                if (/^bug_shoot_/.test(asset.name)) {
                    asset.loop = false;
                    asset.duration = 120;
                    asset.duplicate(0);
                } else if (/^bug_blade_/.test(asset.name)) {
                    asset.loop = false;
                    asset.duration = (dur * 1000) / 1.5;
                    asset.duplicate(3);
                    asset.duplicate(3);
                    asset.duplicate(3);
                    //frame.duration = 120;
                } else if (/^bug_/.test(asset.name)) {
                    asset.loop = true;
                    asset.duration = dur * 1000;
                }
            } else if (type === scintilla.AssetType.tilemap) {
                if (asset.name === 'tilemap_long') {
                    var objs = asset.getObjectsLayer("BlockedPaths");
                    objs.sort(function (a, b) {
                        return a.x - b.x;
                    });
                }
            }

        });

    };

    this.start = function () {
        this.transition.settings.setOutDuration(1);
        this.transition.settings.setEaseOutMethod(scintilla.Ease.Type.CUT, 3);
        this.transition.settings.setEaseInMethod(scintilla.Ease.Type.CUT, 3);
        this.transition.out();

        if (this.goToScene === 'title') {
            this.audio.playPersistent('titleMusic', 0.3, true, 'bgm');
        }
    };

    this.update = function (dt) {
        if (!this.done) {
            this.waitLogoTime += dt / 2.5;

            if (this.waitLogoTime >= 1) {
                this.transition.settings.setInDuration(1);
                this.done = true;
            }
        } else {

            this.transition.in();

            var next = function () {
                this.scene.set(this.goToScene);
            };
            this.events.subscribeOnce('transition_end', next, this);
            //this.scene.set(this.goToScene);
            
        }
    };

    this.gui = function (drawer) {
        drawer.sprite('antifaJamLogo', 320 / 2, 240 / 2, 0.5, 0.5);
    };
}