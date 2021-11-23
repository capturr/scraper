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
    TExtractor,
    TScrapeResult
} from './types';

type TOptions = Omit<TRequestWithExtractors, 'extract' | 'url' | 'method'>;

/*----------------------------------
- SCRAPER
----------------------------------*/
export default class Scraper {

    public constructor( public apiKey: string ) {}

    public scrape<TData extends any = any>(requests: TRequestWithExtractors[]): Promise<TScrapeResult<TData>[]> {
        return new Promise((resolve, reject) => request({
            method: 'POST',
            url: 'https://fast-and-undetectable-scraping-proxy.p.rapidapi.com',
            headers: {
                'content-type': 'application/json',
                'x-rapidapi-host': 'fast-and-undetectable-scraping-proxy.p.rapidapi.com',
                'x-rapidapi-key': this.apiKey
            },
            body: {
                requests: validate(requests)
            },
            json: true
        }, (error, response, body) => {

            if (error) {
                reject(error);
                return;
            }

            resolve(body);

        }));
    }

    public get<TData extends any = any>( 
        url: string, 
        options?: TOptions, 
        extract?: TExtractor 
    ): Promise<TScrapeResult<TData>> {
        return this.scrape<TData>([{ method: 'GET', url, extract, ...options }]).then( res => res[0] );
    }

}

module.exports = (apiKey: string) => new Scraper(apiKey);