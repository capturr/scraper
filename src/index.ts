/*----------------------------------
- DEPENDANCES
----------------------------------*/

// Node.js
import request from 'request';

// Internal
import validate from './validate';
export { default as validate } from './validate';

/*----------------------------------
- TYPE
----------------------------------*/

import {
    TRequestWithExtractors,
    TExtractors,
    HttpMethod
} from './types';

type TOptions = Omit<TRequestWithExtractors, 'extract' | 'url'>;

/*----------------------------------
- SCRAPER
----------------------------------*/
export default function Scraper( apiKey: string ) {

    function scrape( method: HttpMethod, url: string, options?: Omit<TOptions, 'method'>, extract?: TExtractors ) {
        return new Promise((resolve, reject) => request({
            method: method,
            url: 'https://rapidapi.com/post',
            headers: {
                'content-type': 'application/json',
                'x-rapidapi-host': 'rapidapi.com',
                'x-rapidapi-key': this.apiKey,
                useQueryString: true
            },
            body: validate({
                url,
                method,
                extract,
                ...options
            }),
            json: true
        }, (error, response, body) => {

            if (error) {
                reject(error);
                return;
            }

            resolve(body);

        }));
    }

    function get( url: string, options?: TOptions, extract?: TExtractors ) {
        return scrape('GET', url, options, extract);
    }

    return { scrape, get }

}

module.exports = Scraper;