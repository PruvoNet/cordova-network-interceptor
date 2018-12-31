(function (window: Window, document: Document, NativeImage: typeof Image, ProxyClass: typeof Proxy,
           XMLHttpRequestClass: typeof XMLHttpRequest) {
    const fileProtocol = 'file:';
    if (window.location.protocol !== fileProtocol) {
        return;
    }
    const protocolToUse = 'https:';
    const fileRoot = '/';
    const relativeProtocol = '//';
    const fileProtocolFull = fileProtocol + relativeProtocol;
    const fileRootFull = fileProtocolFull + fileRoot;
    const relativeRootFull = relativeProtocol + fileRoot;

    function urlMutator(url?: string) {
        let ret;
        if (url && url.indexOf(fileProtocolFull) === 0 && url.indexOf(fileRootFull) < 0) {
            ret = url.replace(fileProtocol, protocolToUse);
            console.log('mutating url', url, 'to', ret);
            return ret;
        }
        if (url && url.indexOf(relativeProtocol) === 0 && url.indexOf(relativeRootFull) < 0) {
            ret = protocolToUse + url;
            console.log('mutating url', url, 'to', ret);
            return ret;
        }
    }

    const createElementBackup = document.createElement;

    function myCreateElement<K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions)
        : HTMLElementTagNameMap[K];
    function myCreateElement(tagName: string, options?: ElementCreationOptions): HTMLElement {
        const scriptElt = createElementBackup.call(document, tagName, options);
        if (tagName.toLowerCase() !== 'script') {
            return scriptElt;
        }
        const originalSetAttribute = scriptElt.setAttribute.bind(scriptElt);
        Object.defineProperties(scriptElt, {
            'src': {
                get() {
                    return scriptElt.getAttribute('src');
                },
                set(value: string) {
                    const mutated = urlMutator(value);
                    originalSetAttribute('src', mutated || value);
                    return true;
                }
            }
        });
        return scriptElt;
    }

    document.createElement = myCreateElement;

    class FakeImage {
        constructor(width?: number, height?: number) {
            const nativeImage = new NativeImage(width, height);
            const handler = {
                set: function (target: HTMLImageElement, prop: any, value: any) {
                    if (prop === 'src') {
                        value = urlMutator(value) || value;
                    }
                    return (nativeImage as any)[prop] = value;
                },
                get: function (target: HTMLImageElement, prop: any) {
                    let result = (target as any)[prop];
                    if (typeof result === 'function') {
                        result = result.bind(target);
                    }
                    return result;
                }
            };
            const proxy = new ProxyClass(nativeImage, handler);
            try {
                (proxy as any)[Symbol.toStringTag] = 'HTMLImageElement';
            } catch (e) {
            }
            FakeImage.prototype[Symbol.toStringTag] = NativeImage.prototype.toString();
            return proxy;
        }
    }

    Object.defineProperty(FakeImage, 'name', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: 'Image'
    });

    Object.defineProperty(FakeImage, 'toString', {
        enumerable: true,
        configurable: false,
        writable: true,
        value: function () {
            return NativeImage.toString();
        }
    });

    (window as any).Image = FakeImage;
    if (XMLHttpRequestClass) {
        const open = XMLHttpRequestClass.prototype.open;

        function myOpen(this: XMLHttpRequest, method: string, url: string): void;
        function myOpen(this: XMLHttpRequest, method: string, url: string, async: boolean, username?: string | null,
                        password?: string | null): void;
        function myOpen(this: XMLHttpRequest, method: string, url: string, async?: boolean, username?: string | null,
                        password?: string | null): void {
            const mutated = urlMutator(url);
            if (mutated) {
                url = mutated;
            }
            if (typeof async === 'undefined') {
                return open.call(this, method, url, true);
            } else {
                return open.call(this, method, url, async, username, password);

            }
        }

        XMLHttpRequestClass.prototype.open = myOpen;
    }
    if (window.fetch) {
        const fetch = window.fetch;
        window.fetch = function (request, config) {
            if (typeof request === 'string') {
                const mutated = urlMutator(request);
                if (mutated) {
                    request = mutated;
                }
                return fetch(request, config);
            } else {
                const mutated = urlMutator(request && request.url);
                if (mutated) {
                    (request as any).url = mutated;
                }
                return fetch(request, config);
            }
        };
    }
})(window, document, Image, Proxy, XMLHttpRequest);
