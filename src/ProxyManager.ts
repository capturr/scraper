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
export default class ProxyRotator {

    private curproxy: TProxy | undefined;

    public constructor(
        private proxies: { [id: string]: TProxy }
    ) {

    }

    private async changeProxy(): Promise<TProxy> {

        // Recherche un proxy où il reste des crédits de requete
        for (const id in this.proxies) {
            const proxy = this.proxies[id];

            if (proxy.remaining === undefined)
                proxy.remaining = await proxy.getRemaining();

            if (proxy.remaining > 0)
                return proxy;
        }

        throw new Error(`Plus aucun proxy disponible.`);

    }

    public async get(): Promise<TProxy> {

        if (this.curproxy === undefined || this.curproxy.remaining === 0)
             this.curproxy = await this.changeProxy();

        debug && console.log(`[proxy]`,  this.curproxy , this.curproxy.remaining);

        this.curproxy.remaining--;

        return this.curproxy;

    }

}