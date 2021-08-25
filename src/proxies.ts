/*----------------------------------
- DEPENDANCES
----------------------------------*/

/*----------------------------------
- TYPES
----------------------------------*/
type TProxy = {
    prefix: string,
    getRemaining: () => Promise<number>,
    remaining?: number
}

/*----------------------------------
- CONFIG
----------------------------------*/

// TODO: Configure from Scraper instanciation
const debug = true;

/*----------------------------------
- DEPENDANCES
----------------------------------*/
export default class ProxyRotator<TProxyList extends { [id: string]: TProxy } = {}> {

    private curproxy: keyof TProxyList | undefined;

    public constructor(
        private proxies: TProxyList
    ) {

    }

    private async changeProxy(): Promise<keyof TProxyList> {

        // Recherche un proxy où il reste des crédits de requete
        for (const id in this.proxies) {
            const proxy = this.proxies[id];

            if (proxy.remaining === undefined)
                proxy.remaining = await proxy.getRemaining();

            if (proxy.remaining > 0)
                return id;
        }

        throw new Error(`Plus aucun proxy disponible.`);

    }

    public async get(): Promise<TProxy> {

        if (this.curproxy === undefined || this.proxies[ this.curproxy ].remaining === 0)
             this.curproxy = await this.changeProxy();

        debug && console.log(`[proxy]`,  this.curproxy , this.proxies[ this.curproxy ].remaining);

        this.proxies[ this.curproxy ].remaining--;

        return this.proxies[ this.curproxy ];

    }

}