"use strict";
/*----------------------------------
- DEPENDANCES
----------------------------------*/
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
// Npm
var fs_extra_1 = __importDefault(require("fs-extra"));
var got_1 = __importDefault(require("got"));
var cheerio_1 = __importDefault(require("cheerio"));
// Libs
var utils_1 = require("../utils");
/*----------------------------------
- CONFIG
----------------------------------*/
// TODO: Configure from Scraper instanciation
var debugDir = 'crawlers/debug';
var debug = true;
/*----------------------------------
- METHODES
----------------------------------*/
var Scraper = /** @class */ (function () {
    function Scraper(id) {
        this.id = id;
    }
    Scraper.prototype.scrape = function (crawler) {
        return __awaiter(this, void 0, void 0, function () {
            var html, url, proxy, e_1, fichierLocal, $, element, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!('url' in crawler)) return [3 /*break*/, 7];
                        url = crawler.url;
                        if (!(crawler.proxy !== undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, crawler.proxy.get()];
                    case 1:
                        proxy = _a.sent();
                        url = proxy.prefix + url;
                        _a.label = 2;
                    case 2:
                        debug && console.log("[scraper] Requete vers " + url);
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, got_1["default"](url, __assign(__assign({ 
                                // Prend en compte les probabilités d'échec des proxies
                                retry: crawler.proxy !== undefined ? 5 : 0 }, (crawler.gotOptions || {})), { responseType: 'text', isStream: false, resolveBodyOnly: true }))];
                    case 4:
                        html = _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        console.error("[scraper][" + this.id + "] Erreur lors du crawling de " + url, e_1);
                        throw e_1;
                    case 6:
                        if (html && debug) {
                            fichierLocal = debugDir + '/' + this.id + '.html';
                            fs_extra_1["default"].outputFileSync(fichierLocal, html);
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        html = crawler.html;
                        _a.label = 8;
                    case 8:
                        // Extraction code html
                        if (html === undefined)
                            return [2 /*return*/];
                        $ = cheerio_1["default"].load(html);
                        element = $('html');
                        return [4 /*yield*/, this.extractItems(crawler, $, element)];
                    case 9:
                        results = _a.sent();
                        debug && console.log("[scraper] Termin\u00E9.");
                        return [2 /*return*/, results];
                }
            });
        });
    };
    Scraper.prototype.extractItems = function (crawler, $, elements) {
        return __awaiter(this, void 0, void 0, function () {
            var debug, finder, itemsList, fichierLocal, items;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        debug = true;
                        if (!(crawler.items === undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.extractData(crawler, $, elements, 0)];
                    case 1: return [2 /*return*/, [
                            _a.sent()
                        ]];
                    case 2:
                        finder = function (selector) { return elements.find(selector); };
                        itemsList = crawler.items(finder).toArray();
                        debug && console.log("[scraper][" + this.id + "] " + itemsList.length + " Items trouv\u00E9s");
                        if (itemsList.length === 0 && debug) {
                            fichierLocal = debugDir + '/' + this.id + '.html';
                            fs_extra_1["default"].outputFileSync(fichierLocal, $.root().html());
                            // Pas normal
                            console.warn("Aucun r\u00E9sultat trouv\u00E9. html enregistr\u00E9 dans " + fichierLocal);
                        }
                        items = [];
                        return [4 /*yield*/, Promise.all(itemsList.map(function (item, index) {
                                return _this.extractData(crawler, $, $(item), index).then(function (itemData) {
                                    if (itemData) {
                                        items.push(itemData);
                                        debug && console.log("[scraper][" + _this.id + "] Crawled data", itemData);
                                    }
                                });
                            }))];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, items];
                }
            });
        });
    };
    // object = données crawlées
    // 0 = exclusion de l'item
    // -1 = Arrêt de l'itération des résultats
    Scraper.prototype.extractData = function (crawler, $, element, index) {
        return __awaiter(this, void 0, void 0, function () {
            var finder, $jsonld, itemData, _a, _b, _i, dataname, value, error_1, exclude, processResult, error_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        finder = function (selector) { return element.find(selector); };
                        $jsonld = utils_1.jsonldreader($);
                        itemData = typeof crawler.extract === 'function'
                            ? crawler.extract(finder, $jsonld, element)
                            : crawler.extract;
                        _a = [];
                        for (_b in itemData)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 9];
                        dataname = _a[_i];
                        value = itemData[dataname];
                        if (!(typeof value === 'object' && value._subset === true)) return [3 /*break*/, 6];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.extractItems(value, $, element)];
                    case 3:
                        value = _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _c.sent();
                        console.warn("[scraper][extractData] Erreur lors de l'extraction de " + dataname + ":", error_1);
                        value = null;
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        value = utils_1.parseFromHTML(value);
                        _c.label = 7;
                    case 7:
                        // Echec de l'extraction
                        if (value === undefined || value === null || value === '') {
                            exclude = crawler.required !== undefined && crawler.required.includes(dataname);
                            console.warn("[scraper][extractData] Echec de l'extraction de " + dataname, exclude ? "Exclusion de l'item" : '');
                            if (exclude)
                                return [2 /*return*/, false];
                            value = undefined;
                        }
                        // assignation de la valeur extraite
                        itemData[dataname] = value;
                        _c.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 1];
                    case 9:
                        debug && console.log('[scraper][extractData]', this.id, 'Données brutes extraites:', itemData);
                        if (!(crawler.process !== undefined)) return [3 /*break*/, 13];
                        _c.label = 10;
                    case 10:
                        _c.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, crawler.process(itemData, index)];
                    case 11:
                        processResult = _c.sent();
                        if (processResult === false)
                            return [2 /*return*/, false];
                        debug && console.log('[scraper][extractData]', this.id, 'Données après traitement:', processResult);
                        return [2 /*return*/, processResult];
                    case 12:
                        error_2 = _c.sent();
                        debug && console.warn('[scraper][extractData]', this.id, "Erreur lors du traitement des données", error_2);
                        return [2 /*return*/, false];
                    case 13: return [2 /*return*/, itemData];
                }
            });
        });
    };
    return Scraper;
}());
exports["default"] = Scraper;
