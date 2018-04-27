
var MAX_FOLKS = 8;
var MAP_MAX = 120 * 16;
var LONG_MAP_MAX = 200 * 16;
/// UI
var SYMBOL_START_ANGLE = Math.PI - (Math.PI / 2);
var SYMBOL_RADIUS = 84;
/// BUGREIRO
var MAX_BULLETS = 3;
var SHOOT_PERIOD = 160;
var SHOOT_TIMER = 120;
var TRACE_LENGTH = 11;
/// FOLK PLAYER
var FPLAYER_TILE_START = 32;
var FPLAYER_TILE_END = 173;
var FPLAYER_TILE_MAX = FPLAYER_TILE_END - FPLAYER_TILE_START;
// 20 tiles is size of screen
//var FPLAYER_SYMBOL_SET = 7;//FPLAYER_TILE_MAX / (20 - 7);
/// BULLET
var BULLET_SPD = 100;
/// FOLK FUNCTIONS
var AVOIDANCE_LEVEL = 40;
var FOLK_MAX_PATH_FINDING_STEPS = 15;
var DURATION_BETWEEN_AI = 0.24;
var DURATION_BETWEEN_PEACE_WALK = 0.8;


var AntifaController = function () {
    this.deadFolkPlaces = [];
    this.fascistMode = false;
    this.naziCount = 0;
    this.antifaCount = 0;
    this.activeSymbolBar = false;
    this.peace = true;

    this.reset = function() {
        this.deadFolkPlaces.length = 0;
        this.naziChoices = 0;
        this.naziCount = 0;
        this.antifaCount = 0;
        this.activeSymbolBar = false;
        this.peace = true;
    };
};

var GameEnvironment = function() {
    this.map = null;
    this.mapColliderLayer = null;
    this.mapColliderUpperLayer = null;

    this.folks = [];
    this.bullets = [];
    this.player = null;
    this.ai = null;

    this.endGame = -1;
    this.tribeArea = null;
    this.largeTribeArea = null;
    this.safePoints = null;
    this.blockingPaths = null;
    this.reachCity = false;

    this.removeFolk = function(folkToKill){
        var index = this.folks.indexOf(folkToKill);
        this.folks.splice(index, 1);
    };

    this.reset = function() {
        this.map = null;
        this.mapColliderLayer = null;
        this.mapColliderUpperLayer = null;

        this.player = null;
        this.endGame = -1;
        this.bullets.length = 0;
        this.folks.length = 0;

        this.reachCity = false;
        this.tribeArea = null;
        this.largeTribeArea = null;
        this.ai = null;
        this.blockingPaths = null;
    };

    this.playerReachedToCity = function() {
        this.reachCity = true;
        if (this.bullets.length !== 0) {
            var bullet;
            for (var i = 0; i < this.bullets.length; i++) {
                bullet = this.bullets[i];
                bullet.Explode(undefined, false);
            }
            this.bullets.length = 0;
        }
    };
};

var dollarSymbolFrame = {
    x: 128,
    y: 64
};

var quadSymbolFrame = {
    x: 112,
    y: 32,
};

var flagSymbolFrame = {
    x: 96,
    y: 48,
};

var bloodFrame = {
    x: 48,
    y: 0,
    width: 16,
    height: 16
};

var folkLimit = {
    xMin: 26,
    xMax: 35
};


var Environment = new GameEnvironment();

var AntifaControl = new AntifaController();