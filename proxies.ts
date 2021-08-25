import got from 'got';

type TProxy = {
    prefix: string,
    getRemaining: () => Promise<number>,
    remaining?: number
}

const debug = true;

let curproxy: keyof typeof list | undefined;

// Les plus rapides en premier
const list: { [id: string]: TProxy } = {

    // A tendance à etre plus rapide que scraperapi
    zenscrape: {
        prefix: 'https://app.zenscrape.com/api/v1/get?apikey=b67ca590-04b7-11ec-b079-3327bbba08e7&url=',
        getRemaining: () => got('https://app.zenscrape.com/api/v1/status?apikey=b67ca590-04b7-11ec-b079-3327bbba08e7', {
            responseType: 'json'
        }).then(res => {
            debug && console.log(`[proxy][getRemaining] zenscrape`, res.body);
            return res.body['remaining_requests'];
        })
    },

    scraperapi: {
        prefix: 'http://api.scraperapi.com/?api_key=00ed914a2d9010a5106946c7e1d25da1&url=',
        getRemaining: () => got('http://api.scraperapi.com/account?api_key=00ed914a2d9010a5106946c7e1d25da1', {
            responseType: 'json'
        }).then(res => {
            debug && console.log(`[proxy][getRemaining] scraperapi`, res.body);
            return res.body['requestLimit'] - res.body['requestCount'];
        })
    },
}

export const changeProxy = async () => {

    // Recherche un proxy où il reste des crédits de requete
    for (const id in list) {
        const proxy = list[id];

        if (proxy.remaining === undefined)
            proxy.remaining = await proxy.getRemaining();

        if (proxy.remaining > 0)
            return id;
    }

    throw new Error(`Plus aucun proxy disponible.`);

}

export default async () => {

    if (curproxy === undefined || list[ curproxy ].remaining === 0)
        curproxy = await changeProxy();

    debug && console.log(`[proxy]`, curproxy, list[curproxy].remaining);

    list[curproxy].remaining--;

    return list[curproxy];

}