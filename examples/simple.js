"use strict";
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
// Import package
var src_1 = __importDefault(require("../src"));
// Configure proxy to bypass captcha & other anti-bot verification
var proxyRotator = undefined; /*new Scraper.Proxies({

    scraperapi: {
        prefix: 'http://api.scraperapi.com/?api_key=<apikey>&url=',
        getRemaining: () => got('http://api.scraperapi.com/account?api_key=<apikey>', {
            responseType: 'json'
        }).then(res => {
            debug && console.log(`[proxy][getRemaining] scraperapi`, res.body);
            return res.body['requestLimit'] - res.body['requestCount'];
        })
    },

});*/
// Scrape Cryptocurrencies list
src_1["default"].scrape('cryptocurrencies', {
    // URL address to scrape
    url: 'https://coinmarketcap.com/',
    // Proxy Rotator instance (optional)
    proxy: proxyRotator,
    // Items to iterate (optional)
    items: function ($) { return $('table.cmc-table > tbody > tr'); },
    // Data to extract for each item
    extract: function ($) { return ({
        logo: $('> td:eq(2) img.coin-logo').attr('src'),
        name: $('> td:eq(2) p[font-weight="semibold"]').text(),
        price: $('> td:eq(3)').text()
    }); },
    // If name or price cannot be extracted, the item will be excluded from results
    required: ['name', 'price'],
    // Normalize / Format the extracted data (optional)
    process: function (_a) {
        var logo = _a.logo, name = _a.name, price = _a.price;
        return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_b) {
                return [2 /*return*/, ({
                        logo: logo,
                        name: name.trim(),
                        price: parseFloat(price.trim().replace(/[^\d\.]/g, ''))
                    })];
            });
        });
    }
}).then(function (result) {
    // Print result
    console.log(result);
    /*
        Prints the following array:
    
        [{
            logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
            name: "Bitcoin",
            price: 47669.92
    
        }, {
            logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
            name: "Ethereum",
            price: 3139.49
    
        }, ...]
    */
});
