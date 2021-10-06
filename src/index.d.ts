/*----------------------------------
- DEPENDANCES
----------------------------------*/

// npm
import type { Cheerio, Element } from "cheerio"
import type { TJsonldReader } from 'jsonld-extract';

// Libs
import type Proxies from './ProxyRotator';

/*----------------------------------
- GENERAL
----------------------------------*/

import type Scraper from '.';

export type TDonnees = { [cle: string]: any }

export type Got = (opts: any) => Promise<any>;

/*----------------------------------
- INSTANCE OPTIONS
----------------------------------*/

export type TInstanceOptions = {

    debug?: boolean,
    outputDir?: string,

    // For request extractors
    proxy?: Proxies,
    adapter?: (options: TRequestExtractor) => Promise<string>,
}

/*----------------------------------
- SCRAPING OPTIONS
----------------------------------*/

export type TExtractor<TExtractedData extends TDonnees, TProcessedData extends TDonnees = {}> = {

    id: string,

    items?: ($: TFinder) => Cheerio<Element>,
    extract: TExtractFunction<TExtractedData>,
    process?: (data: TExtractedData, index: number) => Promise<TProcessedData | false>,
    required?: string/*(keyof Partial<TExtractedData>)*/[],

    debug?: boolean

} & (
    THtmlExtractor
    | 
    TRequestExtractor
)

export type THtmlExtractor = {
    html: string
}

export type TRequestExtractor = TRequestOptions & {
    proxy?: Proxies,
    adapter?: (options: TRequestExtractor) => Promise<string>,
}

export type TRequestOptions = {
    url: string,
    method?: HttpMethod,
    body?: string,
    headers?: { [cle: string]: string },
}

// https://github.com/sindresorhus/got/blob/main/source/core/options.ts#L247
export type HttpMethod =
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'HEAD'
    | 'DELETE'
    | 'OPTIONS'
    | 'TRACE'
    | 'get'
    | 'post'
    | 'put'
    | 'patch'
    | 'head'
    | 'delete'
    | 'options'
    | 'trace';

/*----------------------------------
- EXTRACTION
----------------------------------*/

type TFinder = (selector: string) => Cheerio<Element>

type TExtractFunction<TExtractedData extends TDonnees> = (
    TDataList<TExtractedData>
    |
    (($: TFinder, $jsonld: TJsonldReader, element: Cheerio<Element>) => TDataList<TExtractedData>)
)

type TDataList<TExtractedData extends TDonnees> = {
    [name in keyof TExtractedData]: /* Extraction */TExtractor<TExtractedData> | /* Raw data */ any
}