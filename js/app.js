(function () {
    'use strict';

    // Cross browser support for the html element
    var html = document.documentElement || document.body.parentNode || document.body;
    // Get the header element for the image particles
    var header = query('header');
    // GIT REKT
    header.getRect = header.getBoundingClientRect;

    // Initialize Image Particles
    var imageParticles = new ImageParticles(header, '/img/logo-cut.png', {
        imageX: 0.07,
        imageY: 3
    });
    // Elements with data-animate attribute
    var dataAnimate = queryAll('[data-animate]');
    // Cirle cursor
    var cursor = query('#cursor');
    // Years
    var years = query('#years');
    // Date I started working
    var startDate = new Date(2014, 10);
    // Contact form
    var form = query('form');

    // Add the "ready" class into the html object
    html.classList.add('ready');
    // Initialize image particles effect
    imageParticles.init();

    // Set the number of years i have been working
    years.innerHTML = yearsOfExperience(startDate);

    // Add an event on window scroll
    window.addEventListener('scroll', onScroll);
    window.addEventListener('mousemove', onMouseMove);

    // Add submit event for the form
    form.addEventListener('submit', onSubmit);

    // Check all elements with data-animate attributes
    // that needs to be animated on page load
    checkDataAnimate();

    // Add mouse hover event on all projects and also update
    // the background based on the current selected project
    projectBackground();

    // Initialize all elements with the class ".ht"
    // to add a mouseover and mouseout event
    hoverTargets();

    /**
     * Window scroll function
     */
    function onScroll() {
        // If the heading can be seen in the window
        if (header.getRect().bottom > 0) {
            // Resize the image particles
            imageParticles.resize();
        }

        checkDataAnimate();
    }

    /**
     * Window mouse move function
     */
    function onMouseMove(e) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }

    /**
     * Check for elements with data-animate tags if they should
     * be animated
     */
    function checkDataAnimate() {
        for (var i = 0; i < dataAnimate.length; i++) {
            var element = dataAnimate[i];
            var classToAdd = element.dataset.animate;
            var padding = element.dataset.padding || 0;
            var delay = element.dataset.delay;
            var rect = element.getBoundingClientRect();

            if (padding && padding.substring(padding.length - 1) == '%') {
                var percent = padding.substring(0, padding.length - 1);

                padding = element.clientHeight * (percent * .01);
            }

            var isVisible = (
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
            var currentStyle = query('style[delay="' + delay + '"]');

            // If style with the same delay is already created,
            // do nothing and return
            if (currentStyle) {
                return;
            }

            // Get the head element
            var head = query('head');
            // Create a style element
            var style = document.createElement('style');
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
    function projectBackground() {
        var hovers = queryAll('.project .hover');
        var bg = query('#featured-projects');
        // Update the background of the background container
        // based on the default selected project
        var selected = getSelected();

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
        for (var i = 0; i < hovers.length; i++) {
            var hover = hovers[i];
            var parent = hover.parentElement;
            // Set the project hover's parent
            hover.parent = parent;

            // Create the index of the project
            var index = document.createElement('span');
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
            var selected = getSelected();
            selected.classList.remove('selected');

            var description = this.parent.query('.description');

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
            var description = query('.project .description.in');

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
    function hoverTargets() {
        var targets = queryAll('.ht');

        for (var i = targets.length - 1; i >= 0; i--) {
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
    function yearsOfExperience(startDate) {
        var diff = Math.floor(Date.now() - startDate.getTime());
        var day = 1000 * 60 * 60 * 24;
        var days = Math.floor(diff / day);
        var months = Math.floor(days / 31);
        var exactYears = months / 12;
        var yearRemainder = exactYears % 1;
        var years = Math.floor(exactYears);
        var message;

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
    function onSubmit(e) {
        e.preventDefault();

        // Get the response text element
        var responseElement = this.query('#response');
        responseElement.innerHTML = '';
        responseElement.classList.remove('error');

        // Disable the submit button
        var button = this.query('button');
        button.disabled = true;
        button.innerHTML = 'Sending...';

        // Get all error messages and remove the innerHTML
        var errorMessages = queryAll('.error');

        for (var i = errorMessages.length - 1; i >= 0; i--) {
            errorMessages[i].innerHTML = '';
        }

        // Get the form data
        // Name
        var name = this.query('input[name=name]');
        // Email
        var email = this.query('input[name=email]');
        // Message
        var message = this.query('textarea[name=message]');
        // Combine the form data into json format
        var data = {
            name: name.value,
            email: email.value,
            message: message.value,
        };

        // Create the AJAX object
        var ajax = new XMLHttpRequest();
        ajax.onreadystatechange = onReadyState;
        ajax.open('POST', 'https://inaapi.herokuapp.com', true);
        ajax.setRequestHeader('Content-Type', 'application/json');
        ajax.send(JSON.stringify(data));

        function onReadyState() {
            if (this.readyState == 4) {
                var response;

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
                        var errors = response.errors;

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
        }

        /**
         * Enables the submit button and sets the innerHTML to "Send Message"
         */
        function enableSubmit() {
            button.disabled = false;
            button.innerHTML = 'Send Message';
        }
    }

})();