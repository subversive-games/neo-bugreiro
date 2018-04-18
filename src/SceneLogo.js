function SceneLogo() {

    this.waitLogoTime = 0;
    this.done = true;
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
        this.load.image('chars', 'img/n_chars.png');

        // Bugreiro
        this.load.spritesheet('bug_down', 'chars', [0, 0, 16, 16, 2], 123);
        this.load.spritesheet('bug_side', 'chars', [0, 16, 16, 16, 2], 123);
        this.load.spritesheet('bug_up', 'chars', [0, 32, 16, 16, 2], 123);
        this.load.spritesheet('bug_shoot_down', 'chars', [32, 0, 16, 16, 4], 120);
        this.load.spritesheet('bug_shoot_side', 'chars', [32, 16, 16, 16, 4], 120);
        this.load.spritesheet('bug_shoot_up', 'chars', [32, 32, 16, 16, 4], 120);
        this.load.animMachine('bugreiro', ['bug_down', 'bug_side', 'bug_up', 'bug_shoot_down', 'bug_shoot_side', 'bug_shoot_up']);

        // Effects
        this.load.spritesheet('shoot_effect_side', 'chars', [96, 0, 16, 16, 3, 1], 120);
        this.load.spritesheet('shoot_effect_updown', 'chars', [112, 0, 16, 16, 3, 1], 120);
        this.load.spritesheet('bullet_explosion', 'chars', [128, 0, 16, 16, 4, 1], 120);
        this.load.spritesheet('blood_explosion', 'chars', [80, 48, 16, 16, 5, 1], 160);
        this.load.spritesheet('alert', 'chars', [64, 80, 16, 16, 4, 1], 123);

        /// FOLKS
        var x = 0;
        var y = 48;
        var row = 0;
        var folkDown, folkUp, folkSide;
        var dur = 240;

        for (var i = 0; i < MAX_FOLKS; i++) {

            folkDown = 'folk_down_' + i.toString();
            folkSide = 'folk_side_' + i.toString();
            folkUp = 'folk_up_' + i.toString();
            this.load.spritesheet(folkDown, 'chars', [x, y, 16, 16, 2], dur);
            this.load.spritesheet(folkSide, 'chars', [x, y + 16, 16, 16, 2], dur);
            this.load.spritesheet(folkUp, 'chars', [x, y + 32, 16, 16, 2], dur);
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
                } else if (/^bug_/.test(asset.name)) {
                    asset.loop = true;
                    asset.duration = dur * 1000;
                }
            }

        });

    };

    this.start = function () {
        this.transition.settings.setOutDuration(1);
        this.transition.settings.setEaseOutMethod(scintilla.Ease.Type.CUT, 3);
        this.transition.settings.setEaseInMethod(scintilla.Ease.Type.CUT, 3);
        this.transition.out();

        if (this.goToScene === 'title')
        this.audio.playPersistent('titleMusic', 0.3, true);
    };

    this.update = function (dt) {
        if (!this.done) {
            this.waitLogoTime += dt / 2.5;

            if (this.waitLogoTime >= 1) {
                this.transition.settings.setInDuration(1);
                this.done = true;
            }
        } else {

            /*this.transition.in();

            var next = function () {
                this.scene.set(this.goToScene);
            };*/
            this.scene.set(this.goToScene);
            //this.events.subscribeOnce('transition_end', next, this);
        }
    };

    this.gui = function (drawer) {
        drawer.sprite('antifaJamLogo', 320 / 2, 240 / 2, 0.5, 0.5);
    };
}