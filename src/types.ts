/*----------------------------------
- CONST
----------------------------------*/

export const allowedMethods = ["GET", "POST"];
export const bodyTypes = ["form", "json"];
export const dataFilters = ["url", 'price'];
export const devices = ['desktop', 'tablet', 'mobile'];

/*----------------------------------
- GLOBAL CONFIGURATION TYPES
----------------------------------*/

export type TAdapter = (options: {
    method: string, 
    url: string, 
    headers: {[k: string]: string},
    body: {[k: string]: any}
}) => Promise<TScrapeResult[]>;

export type TGlobalOptions = {
    adapter?: TAdapter
}

/*----------------------------------
- REQUEST CONFIGURATION TYPES
----------------------------------*/

export type TBasicRequest = {
    url: string,
    method?: HttpMethod,
    cookies?: string,
    device?: typeof devices[number]
}

export type HttpMethod = typeof allowedMethods[number];

export type TRequestWithBody = TBasicRequest & {
    body: { [key: string]: any },
    bodyType: typeof bodyTypes[number]
}

export type TRequest = TBasicRequest | TRequestWithBody;

export type TRequestWithExtractors = TRequest & {
    extract?: TExtractor,
    withBody?: boolean,
    withHeaders?: boolean,
}

/*----------------------------------
- SCRAPER
----------------------------------*/

export type TExtractor = TItemsExtractor | TValueExtractor | ValueExtractor | TItemsIterator;

export type TSelector = "this" | string;
export type TAttribute = "text" | "html" | string;
export type TFilter = typeof dataFilters[number];

export type TValueExtractor = {
    select: TSelector,
    attr?: TAttribute,
    required?: boolean,
    filters?: TFilter[]
}

export type TItemsIterator = { 
    $foreach?: string,
    items: {
        [name: string]: TExtractor
    }
}

export type TItemsExtractor = { 
    [name: string]: TExtractor
}

export class ValueExtractor {

    public options: TValueExtractor;

    public constructor( select: TSelector ) {
        this.options = {
            select
        }
    }

    public attr( attribute: TAttribute ) {
        this.options.attr = attribute;
        return this;
    }

    public each( values: { [name: string]: TExtractor } ): TItemsIterator {
        return { $foreach: this.options.select, items: values };
    }

    public filter( filterName: TFilter ) {

        if (this.options.filters === undefined)
            this.options.filters = [filterName];
        else if (this.options.filters.includes( filterName ))
            throw new Error(`The ${this.filter} filter has already be set for this selector.`);
        else
            this.options.filters.push(filterName);

        return this;
    }

    public optional( isOptional: boolean = true ) {
        this.options.required = !isOptional;
        return this;
    }

}

/*----------------------------------
- RESPONSE
----------------------------------*/
export type TExtractedPrice = {
    amount: number,
    currency: string
}

export type TScrapeResult<TData extends any = any> = {
    url: string,
    status: number,
    headers?: { [key: string]: string },
    body?: string,
    data?: TData,
    time: number,
    bandwidth: number,
}