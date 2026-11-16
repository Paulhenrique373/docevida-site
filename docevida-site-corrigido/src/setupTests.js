import "@testing-library/jest-dom";

// jsdom (Jest 27) não traz TextEncoder/TextDecoder, exigidos pelo react-router 7.
const util = require("util");
global.TextEncoder = global.TextEncoder || util.TextEncoder;
global.TextDecoder = global.TextDecoder || util.TextDecoder;

if (!window.matchMedia) {
    window.matchMedia = (query) => ({
        matches: false, media: query, onchange: null,
        addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
    });
}
window.scrollTo = window.scrollTo || (() => {});
class IO { observe() {} unobserve() {} disconnect() {} }
window.IntersectionObserver = window.IntersectionObserver || IO;
