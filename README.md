[![Build Status](https://travis-ci.org/regevbr/cordova-network-interceptor.svg?branch=master)](https://travis-ci.org/regevbr/cordova-network-interceptor)

# cordova-network-interceptor
Network interceptor for cordova app that will fix all protocol relative url requests to use https

Cordova is essentially a web view that serves files from the file system. As such, the protocl of the "url" it uses is `file:` (e.g. `file://android_assets/www/index.html`).   
  
It is a common practice when writing modules, to reference urls to be used using the "relative protocol" `//` (e.g. `//www.googleapis.com/widget.js`).   

In cordova, this causes the url to be fetched with the `file:` protocol, which causes faliures and unloaded external libraries.   
For example,  `//www.googleapis.com/widget.js` will be translated to  `file://www.googleapis.com/widget.js`.   

To overcome the issue, the library will monkey patch a few things to force the urls to be using the `https:` protocol.

The library performs 4 operations:
1. Patch the `document.createElement` method, which is used (amongst other things) to add dynamic scripts to be fetched by the browser.
The patch will alter the script `src` property if needed to use a proper protocol.
2. Patch the `Image` constructor, which is commonly used to fire pixels. The patch will alter the image `src` property if needed to use a proper protocol.
3. Patch the `XMLHttpRequest` object, to alter the url if needed to use a proper protocol, before the request is being executed.
4. Patch the `fetch` API, to alter the url if needed to use a proper protocol, before the request is being executed.

So, for example, if any script, no matter how fetched and when, will use `//www.googleapis.com/widget.js` as its source, it will be translated and fetched by the `https://www.googleapis.com/widget.js` correct url.
## Installation 
```sh
npm install cordova-network-interceptor --save
```
or
```sh
yarn add cordova-network-interceptor
```
## Usage
Add at the __TOP__ of the `<head>` element
```html
<script src="node_modules/cordova-network-interceptor/dist/index.js"></script>
```
### Credits
The code introduced here is inspired by a mesh up of code examples taken from:
 - https://www.phpied.com/intercepting-new-image-src-requests/
 - https://stackoverflow.com/a/629724/2242402
 - https://stackoverflow.com/questions/45425169/intercept-fetch-api-responses-and-request-in-javascript
 - https://medium.com/snips-ai/how-to-block-third-party-scripts-with-a-few-lines-of-javascript-f0b08b9c4c0
