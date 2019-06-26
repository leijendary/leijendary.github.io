class Query {
    extend() {
        Element.prototype.query = function (selector) {
            return this.querySelector(selector);
        }

        Element.prototype.queryAll = function (selector) {
            return this.querySelectorAll(selector);
        }
    }
}

function query(selector) {
    return document.querySelector(selector);
}

function queryAll(selector) {
    return document.querySelectorAll(selector);
}

export default new Query;
export { query, queryAll };