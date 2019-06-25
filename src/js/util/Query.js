class Query {
    init() {
        window.query = function (selector) {
            return document.querySelector(selector);
        }

        window.queryAll = function (selector) {
            return document.querySelectorAll(selector);
        }

        Element.prototype.query = function (selector) {
            return this.querySelector(selector);
        }

        Element.prototype.queryAll = function (selector) {
            return this.querySelectorAll(selector);
        }
    }
}

export default new Query;