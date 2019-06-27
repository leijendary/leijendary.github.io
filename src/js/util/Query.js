class Query {

    /**
     * Extend .querySelector or .querySelectorAll of dom elements.
     * This will be the shorthand of the said methods.
     * Methods will be as follows:
     *  1. Element#query
     *  2. Element#queryAll
     */
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