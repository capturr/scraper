"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.ScraperProxies = exports.subset = exports.scrape = void 0;
var instance_1 = __importDefault(require("./Scraper/instance"));
var ProxyManager_1 = __importDefault(require("./ProxyManager"));
exports.ScraperProxies = ProxyManager_1["default"];
var scrape = function (id, config) { return new instance_1["default"](id).scrape(config); };
exports.scrape = scrape;
var subset = function (options) { return (__assign({ _subset: true }, options)); };
exports.subset = subset;
exports["default"] = { scrape: exports.scrape, subset: exports.subset, Proxies: ProxyManager_1["default"] };
