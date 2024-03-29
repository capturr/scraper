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

    TGlobalOptions,
    TAdapter,

    TRequestWithExtractors,
    TRequestWithBody,
    TScrapeResult,

    TExtractor,
    ValueExtractor
} from './types';

export type { TExtractedPrice } from './types';

type TOptions = Omit<TRequestWithExtractors, 'extract' | 'url' | 'method'>;

/*----------------------------------
- VARIOUS DELCARATIONS
----------------------------------*/

const local = process.argv.includes('-local');

class ApiError extends Error {
    public constructor( public code: number, message: string ) {
        super(message);
    }
}

const defaultAdapter: TAdapter = (options) => new Promise((resolve, reject) => request({
    ...options,
    json: true
}, (error, response) => {

    if (response && response.statusCode !== 200)
        error = new ApiError( response.statusCode, response.body );

    if (error) {
        reject(error);
        return;
    }

    resolve(response.body);

}));

/*----------------------------------
- SCRAPER
----------------------------------*/
export default class Scraper {

    public constructor( public apiKey: string, private options: TGlobalOptions = {} ) {}

    public scrape<TData extends any = any>( requests: TRequestWithExtractors[] ): Promise<TScrapeResult<TData>[]> {
        const sendRequest = this.options.adapter || defaultAdapter;
        return sendRequest({
            method: 'POST', 
            url: local ? 'http://localhost:3011/v0' : 'https://scrapingapi.io/v0',
            headers: {
                'content-type': 'application/json',
                'accepted': 'application/json',
                'Authorization': this.apiKey,
            },
            body: {
                requests: validate(requests)
            },
        });
    }

    public get<TData extends any = any>( 
        url: string, 
        options?: TOptions, 
        extract?: TExtractor | ValueExtractor
    ): Promise<TScrapeResult<TData>> {
        return this.scrape<TData>([{ method: 'GET', url, extract, ...options }]).then( res => res[0] );
    }

    public post<TData extends any = any>( 
        url: string, 
        body: TRequestWithBody["body"],
        bodyType: TRequestWithBody["bodyType"],
        options?: TOptions, 
        extract?: TExtractor | ValueExtractor
    ): Promise<TScrapeResult<TData>> {
        return this.scrape<TData>([{ method: 'POST', url, extract, body, bodyType, ...options }]).then( res => res[0] );
    }

}

export const $ = (selector: string) => new ValueExtractor(selector)

/*module.exports = (apiKey: string) => ({
    page: new Scraper(apiKey),
    $: $
})*/