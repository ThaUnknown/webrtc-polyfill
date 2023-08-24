<h1 align="center">
  <img height="120px" src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg" />&nbsp;&nbsp;&nbsp;&nbsp;
  <img height="120px" src="https://webrtc.github.io/webrtc-org/assets/images/webrtc-logo-vert-retro-dist.svg" />
</h1>

webrtc-polyfill is a Node.js Native Addon that provides bindings to [libdatachannel](https://github.com/paullouisageneau/libdatachannel). This project aims for spec-compliance and is tested using the W3C's [web-platform-tests](https://github.com/web-platform-tests/wpt) project, while offering performance better than any alternative. A number of [nonstandard APIs](docs/nonstandard-apis.md) for testing are also included.

Install
-------

```
pnpm install webrtc-polyfill
```
Supported Platforms
-------------------

For supported platforms see the [node-channel bindings compatibility table](https://github.com/murat-dogan/node-datachannel/#supported-platforms). Note that node versions under 14 require a global EventTarget and Event polyfill.

Testing
-------
Requirements: Python, Node.js