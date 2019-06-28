// Import styles
import '../sass/app.scss';

import Query from './util/Query';
import App from './App';

/**
 * The document has finished loading, all assets including images are
 * also fully loaded
 */
window.onload = () => {
    // If ups is a function, set the progress value of ups to 100
    // and override the loader's progress bar
    if (progress !== 100 && typeof ups === 'function') {
        alert('overriden');
        ups(100);
    }

    // Initialize Element extension
    Query.extend();

    // Remove hash from the url
    history.pushState("", document.title, window.location.pathname + window.location.search);

    // Image for the ImageParticles
    const logoCut = '/img/logo-cut.png';
    // The App object contains all the logic and actions of the website.
    // The purpose of this file (index.js) is to initialize
    const app = new App();
    // Set the image of the particles
    app.image = logoCut;
    // Date I started working
    app.startDate = new Date(2014, 10);
    // Initialize app
    app.init();
}