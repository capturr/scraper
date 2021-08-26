"use strict";
/*----------------------------------
- DEPENDANCES
----------------------------------*/
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.parseFromHTML = exports.jsonldreader = void 0;
var html_entities_1 = require("html-entities");
var condense_whitespace_1 = __importDefault(require("condense-whitespace"));
var jsonldreader = function ($) {
    var e_1, _a;
    var debug = false;
    var definitions = [];
    var rawDefinitions = $('script[type="application/ld+json"]');
    try {
        for (var rawDefinitions_1 = __values(rawDefinitions), rawDefinitions_1_1 = rawDefinitions_1.next(); !rawDefinitions_1_1.done; rawDefinitions_1_1 = rawDefinitions_1.next()) {
            var rawDefinition = rawDefinitions_1_1.value;
            var raw = $(rawDefinition).contents().text().trim();
            try {
                var definition = JSON.parse(raw);
                if (Array.isArray(definition))
                    definitions.push.apply(definitions, __spreadArray([], __read(definition)));
                else if (typeof definition === "object")
                    definitions.push(definition);
            }
            catch (e) {
                debug && console.warn("[scraper][jsonld] Erreur parsing json", e);
                continue;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rawDefinitions_1_1 && !rawDefinitions_1_1.done && (_a = rawDefinitions_1["return"])) _a.call(rawDefinitions_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    debug && console.log("[scraper][jsonld] D\u00E9finitions:", definitions);
    return function (path) {
        var e_2, _a, e_3, _b;
        var _c;
        // Extraction branches
        var _d = __read(path.split('.')), type = _d[0], branches = _d.slice(1);
        debug && console.log("[scraper][jsonld] Extraction de:", type, branches);
        try {
            // Recherche dans chaque bloc de définition
            itDefinitions: for (var definitions_1 = __values(definitions), definitions_1_1 = definitions_1.next(); !definitions_1_1.done; definitions_1_1 = definitions_1.next()) {
                var definition = definitions_1_1.value;
                if (((_c = definition['@type']) === null || _c === void 0 ? void 0 : _c.toLowerCase()) !== type)
                    continue;
                debug && console.log("[scraper][jsonld] " + type + " Trouv\u00E9", definition);
                // Extraction valeur
                var valeur = definition;
                try {
                    for (var branches_1 = (e_3 = void 0, __values(branches)), branches_1_1 = branches_1.next(); !branches_1_1.done; branches_1_1 = branches_1.next()) {
                        var branche = branches_1_1.value;
                        // Impossible d'itérer jusqu'au bout = définition exclue
                        if (typeof valeur !== 'object')
                            break itDefinitions;
                        valeur = valeur[branche];
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (branches_1_1 && !branches_1_1.done && (_b = branches_1["return"])) _b.call(branches_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                debug && console.log("[scraper][jsonld] Valeur trouv\u00E9e:", valeur);
                // Retour si non-nulle
                if (valeur !== undefined && valeur !== null)
                    return valeur;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (definitions_1_1 && !definitions_1_1.done && (_a = definitions_1["return"])) _a.call(definitions_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        ;
        // Pas trouvé, retourne undefined
        return undefined;
    };
};
exports.jsonldreader = jsonldreader;
function parseFromHTML(val) {
    return condense_whitespace_1["default"](html_entities_1.decode(val));
}
exports.parseFromHTML = parseFromHTML;
