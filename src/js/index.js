// Import styles
import '../sass/app.scss';

import Query from './util/Query';
import App from './App';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize query
    Query.init();

    // Image for the ImageParticles
    const logoCut = '/img/logo-cut.png';
    const app = new App();
    // Set the image of the particles
    app.image = logoCut;
    // Date I started working
    app.startDate = new Date(2014, 10);
    // Initialize app
    app.init();

});