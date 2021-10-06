# Dopamyn Scraper

Simple & Human-Friendly HTML Scraper with Proxy Rotator.

[![npm](https://img.shields.io/npm/v/declarative-scraper)](https://www.npmjs.com/package/declarative-scraper)

**/!\ WARNING: This package is not enough mature to be used in production.**

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
    adapter?: Function,

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
* Strict type checking
* Fix typings for extracted data
* Tests