# Dopamyn Scraper

Simple & Human-Friendly HTML Scraper with Proxy Rotator.

[![npm](https://img.shields.io/npm/v/declarative-scraper)](https://www.npmjs.com/package/declarative-scraper)

## Installation

```bash
npm install --save declarative-scraper
```

## API

```typescript
Scraper.scrape({

    id: string,

    html?: string,
    url?: string,
    proxy?: ProxiesRotator,
    request?: Function,

    items?: Function,
    extract: Function,
    process?: Function,
    required?: string[],

    debug?: boolean

}): Promise<ProcessedData>;
```

## Usage Example

[Simple Usage: Cryptocurrencies price](https://github.com/dopamyn/scraper/blob/main/examples/simple.ts)

## TODO

* Better doc
* Fix typings for extracted data