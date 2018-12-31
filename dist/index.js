(function (window, document, NativeImage, ProxyClass, XMLHttpRequestClass) {
    var fileProtocol = 'file:';
    if (window.location.protocol !== fileProtocol) {
        return;
    }
    var protocolToUse = 'https:';
    var fileRoot = '/';
    var relativeProtocol = '//';
    var fileProtocolFull = fileProtocol + relativeProtocol;
    var fileRootFull = fileProtocolFull + fileRoot;
    var relativeRootFull = relativeProtocol + fileRoot;
    function urlMutator(url) {
        var ret;
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
    var createElementBackup = document.createElement;
    function myCreateElement(tagName, options) {
        var scriptElt = createElementBackup.call(document, tagName, options);
        if (tagName.toLowerCase() !== 'script') {
            return scriptElt;
        }
        var originalSetAttribute = scriptElt.setAttribute.bind(scriptElt);
        Object.defineProperties(scriptElt, {
            'src': {
                get: function () {
                    return scriptElt.getAttribute('src');
                },
                set: function (value) {
                    var mutated = urlMutator(value);
                    originalSetAttribute('src', mutated || value);
                    return true;
                }
            }
        });
        return scriptElt;
    }
    document.createElement = myCreateElement;
    var FakeImage = /** @class */ (function () {
        function FakeImage(width, height) {
            var nativeImage = new NativeImage(width, height);
            var handler = {
                set: function (target, prop, value) {
                    if (prop === 'src') {
                        value = urlMutator(value) || value;
                    }
                    return nativeImage[prop] = value;
                },
                get: function (target, prop) {
                    var result = target[prop];
                    if (typeof result === 'function') {
                        result = result.bind(target);
                    }
                    return result;
                }
            };
            var proxy = new ProxyClass(nativeImage, handler);
            try {
                proxy[Symbol.toStringTag] = 'HTMLImageElement';
            }
            catch (e) {
            }
            FakeImage.prototype[Symbol.toStringTag] = NativeImage.prototype.toString();
            return proxy;
        }
        return FakeImage;
    }());
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
    window.Image = FakeImage;
    if (XMLHttpRequestClass) {
        var open_1 = XMLHttpRequestClass.prototype.open;
        function myOpen(method, url, async, username, password) {
            var mutated = urlMutator(url);
            if (mutated) {
                url = mutated;
            }
            if (typeof async === 'undefined') {
                return open_1.call(this, method, url, true);
            }
            else {
                return open_1.call(this, method, url, async, username, password);
            }
        }
        XMLHttpRequestClass.prototype.open = myOpen;
    }
    if (window.fetch) {
        var fetch_1 = window.fetch;
        window.fetch = function (request, config) {
            if (typeof request === 'string') {
                var mutated = urlMutator(request);
                if (mutated) {
                    request = mutated;
                }
                return fetch_1(request, config);
            }
            else {
                var mutated = urlMutator(request && request.url);
                if (mutated) {
                    request.url = mutated;
                }
                return fetch_1(request, config);
            }
        };
    }
})(window, document, Image, Proxy, XMLHttpRequest);
