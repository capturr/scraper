/*----------------------------------
- DEPENDANCES
----------------------------------*/

// npm
import type { Cheerio, Element } from "cheerio"
import type { Options as TGotOptions } from 'got';

import type { TJsonldReader } from 'jsonld-extract';

// Libs
import type Proxies from '../ProxyManager';

/*----------------------------------
- GENERAL
----------------------------------*/

export type TDonnees = { [cle: string]: any }

type TFinder = (selector: string) => Cheerio<Element>

export type TScraperActions<TExtractedData extends TDonnees, TProcessedData extends TDonnees = {}> = {
    items?: ($: TFinder) => Cheerio<Element>,
    extract: (
        TDataList<TExtractedData>
        |
        (($: TFinder, $jsonld: TJsonldReader, element: Cheerio<Element>) => TDataList<TExtractedData>)
    ),
    process?: (data: TExtractedData, index: number) => Promise<TProcessedData | false>,
    required?: string/*(keyof Partial<TExtractedData>)*/[],
}

type TDataList<TExtractedData extends TDonnees> = {
    [name in keyof TExtractedData]: /* Extraction */TScraperActions<TExtractedData> | /* Raw data */ any
}

/*----------------------------------
- OPTIONS
----------------------------------*/

type TBaseOptions = {
    id: string,

    debug?: boolean,
    outputDir?: string,

    onError?: (
        type: 'request' | 'extraction' | 'processing',
        error: Error,
        options: TOptions,
        scraperOptions: TScraperActions<{}>
    ) => void
}

export type TRequestOptions = {
    url: string,
    method?: HttpMethod,
    body?: string,
    headers?: { [cle: string]: string },
}

export type TOptionsWithRequest = TBaseOptions & TRequestOptions & {
    proxy?: Proxies,
    request?: (options: TOptionsWithRequest) => Promise<string>,
}

export type TOptionsWithHtml = TBaseOptions & {
    html: string
}

export type TOptions = TOptionsWithRequest | TOptionsWithHtml;

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