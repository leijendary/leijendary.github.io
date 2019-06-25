import { ImageParticles } from './image-particles';
import ajax from './util/ajax';

export default class App {

    constructor() {
        // Cross browser support for the html element
        this.html = document.documentElement || document.body.parentNode || document.body;
        // Get the header element for the image particles
        this.header = query('header');
        // GIT REKT
        this.header.getRect = this.header.getBoundingClientRect;
        // Create Image Particles
        this.imageParticles = new ImageParticles(this.header, {
            imageX: 0.07,
            imageY: 3
        })
        // Elements with data-animate attribute
        this.dataAnimate = queryAll('[data-animate]');
        // Cirle cursor
        this.cursor = query('#cursor');
        // Years
        this.years = query('#years');
        // Contact form
        this.form = query('form');
    }

    init() {
        // Add the "ready" class into the html object
        this.html.classList.add('ready');
        // Set the image of the particles
        this.imageParticles.image = this.image;
        // Initialize image particles
        this.imageParticles.init();

        // Set the number of years i have been working
        this.years.innerHTML = this.yearsOfExperience();

        // Check all elements with data-animate attributes
        // that needs to be animated on page load
        this.checkDataAnimate();

        // Add mouse hover event on all projects and also update
        // the background based on the current selected project
        this.projectBackground();

        // Initialize all elements with the class ".ht"
        // to add a mouseover and mouseout event
        this.hoverTargets();

        // Wake up the emailer API
        this.wakeUpApi();

        // Add event listeners
        this.addListeners();
    }

    addListeners() {
        // Add an event on window scroll
        window.addEventListener('scroll', this.onScroll.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));

        // Add submit event for the form
        this.form.addEventListener('submit', this.onSubmit);
    }

    /**
     * Window scroll function
     */
    onScroll() {
        // If the heading can be seen in the window
        if (this.header.getRect().bottom > 0) {
            // Resize the image particles
            this.imageParticles.resize();
        }

        this.checkDataAnimate();
    }

    /**
     * Window mouse move function
     */
    onMouseMove(e) {
        this.cursor.style.left = e.clientX + 'px';
        this.cursor.style.top = e.clientY + 'px';
    }

    /**
     * Check for elements with data-animate tags if they should
     * be animated
     */
    checkDataAnimate() {
        for (let i = 0; i < this.dataAnimate.length; i++) {
            const element = this.dataAnimate[i];
            const classToAdd = element.dataset.animate;
            const padding = element.dataset.padding || 0;
            const delay = element.dataset.delay;
            const rect = element.getBoundingClientRect();

            if (padding && padding.substring(padding.length - 1) == '%') {
                const percent = padding.substring(0, padding.length - 1);

                padding = element.clientHeight * (percent * .01);
            }

            const isVisible = (
                (rect.bottom - padding < window.innerHeight)
                && (rect.bottom + padding - element.clientHeight > 0)
            );

            if (isVisible) {
                if (delay) {
                    createDelay(delay);
                }

                element.classList.add(classToAdd);
            }
        }

        /**
         * Create an animation delay style element in the <head> tag
         */
        function createDelay(delay) {
            // Get the current style element with the same delay
            const currentStyle = query('style[delay="' + delay + '"]');

            // If style with the same delay is already created,
            // do nothing and return
            if (currentStyle) {
                return;
            }

            // Get the head element
            const head = query('head');
            // Create a style element
            const style = document.createElement('style');
            // Set the delay attribute to identify what is the
            // animation delay of this style
            style.setAttribute('delay', delay);
            // Create an animation-delay attribute css style
            style.innerHTML =
                '[data-delay="' + delay + '"],' +
                '[data-delay="' + delay + '"]::after {' +
                '   animation-delay: ' + delay + ' !important;' +
                '}';

            // Append the created style into the <head> tag
            head.appendChild(style);
        }
    }

    /**
     * Add event listener for mouse hover on all .project elements.
     */
    projectBackground() {
        const hovers = queryAll('.project .hover');
        const bg = query('#featured-projects');
        // Update the background of the background container
        // based on the default selected project
        let selected = getSelected();

        // If there are no project elements with the class "selected",
        // set the default selected as the first parent element
        // of the project hover element
        if (!selected) {
            selected = hovers[0].parentElement;
            selected.classList.add('selected');
        }

        // Update the background image based on the current selected
        updateImage(selected.query('img').src);

        // For each project, add the mouse hover event action
        for (let i = 0; i < hovers.length; i++) {
            const hover = hovers[i];
            const parent = hover.parentElement;
            // Set the project hover's parent
            hover.parent = parent;

            // Create the index of the project
            const index = document.createElement('span');
            index.classList.add('index');
            index.innerHTML = ('00000' + (i + 1)).substr(-2);

            // Insert the index of the project before the first
            // element inside the project
            parent.insertBefore(index, parent.childNodes[0]);

            // Pre-load image of this project
            if (Image) {
                new Image().src = parent.query('img').src;
            }

            // Mouse events
            hover.onmouseover = onHover;
            hover.onmouseout = onOut;
        }

        /**
         * On project mouse hover
         */
        function onHover() {
            // Remove currently selected project
            const selected = getSelected();
            selected.classList.remove('selected');

            const description = this.parent.query('.description');

            // Add the ".selected" class
            this.parent.classList.add('selected');

            // Set the project's description as "in"
            description.classList.add('in');
            // Remove the project description's "out" class
            description.classList.remove('out');

            // Update the background image of the background container
            updateImage(this.parent.query('img').src);
        }

        /**
         * On project mouse out
         */
        function onOut() {
            const description = query('.project .description.in');

            if (description) {
                description.classList.add('out');
                description.classList.remove('in');
            }
        }

        /**
         * Update the image of the background container
         */
        function updateImage(image) {
            bg.style.backgroundImage =
                "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.8) 100%), " +
                "url('" + image + "')";
        }

        function getSelected() {
            return query('.project.selected');
        }
    }

    /**
     * .ht mouseenter and mouseout events
     */
    hoverTargets() {
        const targets = queryAll('.ht');

        for (let i = targets.length - 1; i >= 0; i--) {
            targets[i].addEventListener('mouseover', mouseOver);
            targets[i].addEventListener('mouseout', mouseOut);
        }

        function mouseOver() {
            cursor.classList.add('hover');
        }

        function mouseOut() {
            cursor.classList.remove('hover');
        }
    }

    /**
     * Get the number of years of work experience
     */
    yearsOfExperience() {
        const diff = Math.floor(Date.now() - this.startDate.getTime());
        const day = 1000 * 60 * 60 * 24;
        const days = Math.floor(diff / day);
        const months = Math.floor(days / 31);
        const exactYears = months / 12;
        const yearRemainder = exactYears % 1;
        const years = Math.floor(exactYears);
        let message;

        if (yearRemainder >= .5) {
            message = 'ALMOST ' + (years + 1);
        } else if (yearRemainder == .0) {
            message = years;
        } else {
            message = 'OVER ' + years;
        }

        return message;
    }

    /**
     * On submit of the contact form, process the input and send
     * to the email API
     */
    onSubmit(e) {
        e.preventDefault();

        // Get the response text element
        const responseElement = this.query('#response');
        responseElement.innerHTML = '';
        responseElement.classList.remove('error');

        // Disable the submit button
        const button = this.query('button');
        button.disabled = true;
        button.innerHTML = 'Sending...';

        // Get all error messages and remove the innerHTML
        const errorMessages = queryAll('.error');

        for (let i = errorMessages.length - 1; i >= 0; i--) {
            errorMessages[i].innerHTML = '';
        }

        // Get the form data
        // Name
        const name = this.query('input[name=name]');
        // Email
        const email = this.query('input[name=email]');
        // Message
        const message = this.query('textarea[name=message]');
        // Combine the form data into json format
        const data = {
            name: name.value,
            email: email.value,
            message: message.value,
        };

        // Create the ajax request
        ajax('https://inaapi.herokuapp.com', 'post', data, callback);

        /**
         * Ajax request callback
         */
        function callback() {
            let response;

            try {
                // Parse the responseText into JSON
                response = JSON.parse(this.responseText);
            } catch (e) {
                // If there is an error, write the error in the console
                console.error(e);

                // If there is a responseText, show the error message
                if (this.responseText) {
                    responseElement.innerHTML = this.responseText;
                    responseElement.classList.add('error');
                } else {
                    // If there is none just show a generic error message
                    responseElement.innerHTML = 'Could not send the email';
                    responseElement.classList.add('error');
                }

                // Enable submit button
                enableSubmit();
            }

            // If the response is success
            if (this.status == 200) {
                // Set the message of the response object
                responseElement.innerHTML = response.message;
            } else if (this.status == 400) {
                // If the response has validation errors
                if (response.errors) {
                    const errors = response.errors;

                    if (errors['name']) {
                        name.nextElementSibling.innerHTML = errors['name'];
                    }

                    if (errors['email']) {
                        email.nextElementSibling.innerHTML = errors['email'];
                    }

                    if (errors['message']) {
                        message.nextElementSibling.innerHTML = errors['message'];
                    }
                } else if (response.error) {
                    // If the response has a generic error
                    // Set the message of the response object
                    responseElement.innerHTML = response.error;
                    responseElement.classList.add('error');
                }
            }

            // Enable submit button
            enableSubmit();
        }

        /**
         * Enables the submit button and sets the innerHTML to "Send Message"
         */
        function enableSubmit() {
            button.disabled = false;
            button.innerHTML = 'Send Message';
        }
    }

    /**
     * Wake up the "inaapi" API
     */
    wakeUpApi() {
        // Wake up now
        wakeUp();

        // Wake up again after 5 minutes
        setInterval(function () {
            wakeUp();
        }, 300000)

        function wakeUp() {
            ajax('https://inaapi.herokuapp.com/wake-me-up', 'get');
        }
    }
}