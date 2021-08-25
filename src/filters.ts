/*----------------------------------
- DEPENDANCES
----------------------------------*/

import { TLocale } from '../../../PriceAlerts/site/server/src/locale';

import { decode } from 'html-entities';
import condenseWhitespace from 'condense-whitespace';
import iso6393 from '../../../PriceAlerts/site/server/src/utils/iso6393';
const iso6393Values = Object.values(iso6393)

/*----------------------------------
- BASE
----------------------------------*/
export function fromHTML(val: string) {
    return condenseWhitespace( decode(val) );
}

/*----------------------------------
- CHAINES
----------------------------------*/

// https://github.com/microlinkhq/metascraper/blob/master/packages/metascraper-helpers/index.js#L275
export const localeFilter = (input: unknown) => {

    if (!input || typeof input !== 'string')
        return undefined;

    const key = condenseWhitespace(input).toLowerCase();

    if (input.length === 3) return iso6393[key]

    const lang = key.substring(0, 2).toLowerCase()

    return iso6393Values.includes(lang) ? lang : undefined

}

export function urlFilter(baseUrl: string) {

    const infos = new URL(baseUrl);

    return function url (val: string) {

        const url = fromHTML(val);

        // Relatif vers absolu
        if (url[0] === '/') {

            /* //cdn.idealo.com/img.jpg */
            if (url[1] === '/')
                return infos.protocol + url;
            /* /img.jpg */
            else
                return infos.protocol + '//' + infos.host + url;
        }

        return url;

    }
}

export function title(val: string) {
    return fromHTML(val);
}

/*----------------------------------
- NOMBRES
----------------------------------*/
const getNumberSeparators = (locale: string) => {

    const parts = Intl.NumberFormat(locale).formatToParts(1000.1);
    let group: string, decimal: string;

    for (const part of parts)
        if (part.type === 'decimal')
            decimal = part.value;
        else if (part.type === 'group')
            group = part.value;

    if (!group || !decimal)
        throw new Error(`Impossible de déterminer les séparateurs numériques pour la locale ${locale}.`)

    return { group, decimal }

}

export const price = (price: string | number, locale: TLocale): number | null => {

    const debug = false;

    debug && console.log('[toPriceFormat]', price, locale);

    if (!price)
        return null;

    // Locale string => nombre
    if (typeof price === 'string') {

        price = fromHTML(price);

        //const sep = getNumberSeparators(locale.code);
        const priceReg = new RegExp(locale.currency + '?\\s*((?:\\d+(\\' + locale.separator.group + '\\d+)?)+[\\' + locale.separator.decimal + ']\\d{2})\\s*' + locale.currency + '?');
        debug && console.log('[toPriceFormat] Regex extraction', priceReg);

        // Extraction
        const match = price.match(priceReg);
        if (!match || !match[1])
            return null;

        price = match[1];
        debug && console.log('[toPriceFormat] Extraction via regex:', price, match);

        // Normalisation des délimiteurs
        price = price.replace(locale.separator.decimal, '.');

        // Ne garde que les chiffres et le délimiteur des décimaux
        price = price.replace(/[^\.0-9]/g, '').trim();
        debug && console.log('[toPriceFormat] Délimiteurs remplacés:', locale.separator, price);

        // Conversion
        price = parseFloat(price);
        debug && console.log('[toPriceFormat] Après parseFloat:', price);

    }

    if (!price)
        return null;

    return price;
}