// Import styles
import '../sass/app.scss';

import App from './App';
import Query from './util/Query';

/**
 * The document has finished loading, all assets including images are
 * also fully loaded
 */
window.onload = () => {
    // If ups is a function, set the progress value of ups to 100
    // and override the loader's progress bar
    if (progress !== 100 && typeof ups === 'function') {
        ups(100);
    }

    // Initialize Element extension
    Query.extend();

    // Remove hash from the url
    history.pushState(
        "",
        document.title,
        window.location.pathname + window.location.search
    );

    // The App object contains all the logic and actions of the website.
    // The purpose of this file (index.js) is to initialize the App and
    // also to set the window.app variable as the initialized app
    const app = window.app = new App();
    // Initialize app
    app.init();
}