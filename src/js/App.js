import { ImageParticles } from './image-particles';
import ajax from './util/ajax';
import mobile from './util/mobile';
import { query, queryAll } from './util/Query';
import requestAnimationFrame from './util/request-animation-frame';

export default class App {
  constructor() {
    this.basis = {
      height: 754,
      width: 1536,
    };
    // Width of the mobile threshold in pixels
    this.mobileWidth = 890;
    // Get the logo element for the image particles
    this.logoContainer = query('#logo');
    // Image for the image particles
    this.logo = '/img/logo.png';
    // Get the header element
    this.header = query('header');
    // GIT REKT
    this.header.getRect = this.header.getBoundingClientRect;
    // Create Image Particles
    this.headerParticles = new ImageParticles(this.logoContainer, {
      imageX: this.particlesXPosition.bind(this),
      imageY: this.particlesYPosition.bind(this),
      scale: this.particlesScale.bind(this),
      image: this.logo,
    });
    // Elements with data-animate attribute
    this.dataAnimate = queryAll('[data-animate]');
    // Cirle cursor
    this.cursor = query('#cursor');
    // Year Message
    this.yearMessage = query('#year-message');
    // Years
    this.years = query('#years');
    // API url
    this.apiUrl = 'https://z9ymkxxs3h.execute-api.eu-central-1.amazonaws.com/emailer';
    // Contact form
    this.form = query('form');
    // Date I started working
    this.startDate = new Date(2014, 10);
    // Set mouse position
    this.mousePosition = {
      x: 0,
      y: 0,
    };

    // Set the VH value
    this.setVh();
  }

  init() {
    // Add delay because there is also a delay in
    // removing the pre-loader
    setTimeout(() => {
      // Initialize image particles
      this.headerParticles.init();

      // Set the particle size
      this.setParticleSize();
    }, 1000);

    // Set the number of years i have been working
    this.yearsOfExperience();

    // Check all elements with data-animate attributes
    // that needs to be animated on page load
    this.checkDataAnimate();

    // Add mouse hover event on all projects and also update
    // the background based on the current selected project
    this.projectBackground();

    // Initialize all elements with the class ".ht"
    // to add a mouseover and mouseout event
    this.hoverTargets();

    // Add event listeners
    this.addListeners();

    // Initialize cursor animation frame
    this.initCursor();

    // Set the mobile view if this is a mobile browser
    if (mobile()) {
      this.mobileView();
    }
  }

  /**
   * Add application event listeners
   */
  addListeners() {
    // Add an event on window scroll
    window.addEventListener('scroll', this.onScroll.bind(this));
    // Add an event on window mouse move
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    // Add an event on window resize
    window.addEventListener('resize', this.onResize.bind(this));
    // Add submit event for the form
    this.form.addEventListener('submit', this.onSubmit.bind(this));
  }

  /**
   * Window scroll function
   */
  onScroll() {
    // If the heading can be seen in the window
    if (this.header.getRect().bottom > 0) {
      // Resize the image particles
      this.headerParticles.resize();
    }

    // Check data-animate attributes if to be animated
    this.checkDataAnimate();

    // Projects should be out
    this.onProjectOut();
  }

  /**
   * Window mouse move function
   */
  onMouseMove(e) {
    this.mousePosition = {
      x: e.clientX,
      y: e.clientY,
    };
  }

  /**
   * Window resize function
   */
  onResize() {
    // Update the VH value
    this.setVh();

    // Update the particle size
    this.setParticleSize();

    // Resize the image particles
    this.headerParticles.resize();
  }

  /**
   * Get the particles' X position based on the client height and width
   * of the logo container element
   */
  particlesXPosition() {
    const clientHeight = this.logoContainer.clientHeight;
    const clientWidth = this.logoContainer.clientWidth;

    // If the client width is less than the mobile
    // threshold, set the x position to 0
    if (clientWidth <= this.mobileWidth) {
      return 0;
    }

    return (clientWidth / clientHeight) * 70;
  }

  /**
   * Get the particles' Y position based on the client width
   * of the logo container element
   */
  particlesYPosition() {
    const clientWidth = this.logoContainer.clientWidth;

    // If the client width is less than the mobile
    // threshold, set the x position to 0
    if (clientWidth <= this.mobileWidth) {
      return 40;
    }

    return 0;
  }

  /**
   * Get the particles' scale value based on the client height and width
   * of the logo container element
   */
  particlesScale() {
    const clientHeight = this.logoContainer.clientHeight;
    const clientWidth = this.logoContainer.clientWidth;

    // If the client width is less than the mobile
    // threshold, set the scale to 1
    if (clientWidth <= this.mobileWidth) {
      return 0.4;
    }

    if (clientHeight > clientWidth) {
      return (clientWidth / clientHeight) * 0.3;
    } else {
      return clientWidth / (clientHeight * 3);
    }
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

        padding = element.clientHeight * (percent * 0.01);
      }

      const isVisible = rect.bottom - padding < window.innerHeight && rect.bottom + padding - element.clientHeight > 0;

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
      const currentStyle = query(`style[delay="${delay}"]`);

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
      style.innerHTML = `[data-delay="${delay}"],\
        [data-delay="${delay}"]::after { \
           animation-delay: ${delay} !important; \
        }`;

      // Append the created style into the <head> tag
      head.appendChild(style);
    }
  }

  /**
   * Add event listener for mouse hover on all .project elements.
   */
  projectBackground() {
    const hovers = queryAll('.project .hover');
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
      index.innerHTML = `00000${i + 1}`.substr(-2);

      // Insert the index of the project before the first
      // element inside the project
      parent.insertBefore(index, parent.childNodes[0]);

      // Mouse events
      hover.onmouseover = onHover;
      hover.onmouseout = this.onProjectOut.bind(this);
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
     * Update the image of the background container
     */
    function updateImage(image) {
      // Selector for featured projects' background image container
      const selector = '#featured-projects .bg';
      // Get the active background container
      const activeBg = query(`${selector}.active`);
      // Get the inactive background container
      const bg = query(`${selector}:not(.active)`);

      bg.style.backgroundImage = `radial-gradient(ellipse at center, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.9) 100%), \
        url(${image})`;
      bg.classList.add('active');

      // Remove the 'active' class from the active
      // background container
      if (activeBg) {
        activeBg.classList.remove('active');
      }
    }

    function getSelected() {
      return query('.project.selected');
    }
  }

  /**
   * On project mouse out
   */
  onProjectOut() {
    const description = query('.project .description.in');

    if (description) {
      description.classList.add('out');
      description.classList.remove('in');
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

    if (yearRemainder >= 0.5) {
      this.yearMessage.innerHTML = 'almost';
      this.years.innerHTML = years + 1;
    } else if (yearRemainder == 0.0) {
      this.yearMessage.remove();
      this.years.innerHTML = years;
    } else {
      this.yearMessage.innerHTML = 'over';
      this.years.innerHTML = years;
    }
  }

  /**
   * On submit of the contact form, process the input and send
   * to the email API
   */
  onSubmit(e) {
    e.preventDefault();

    // Get the response text element
    const responseElement = this.form.query('#response');
    responseElement.innerHTML = '';
    responseElement.classList.remove('error');

    // Disable the submit button
    const button = this.form.query('button');
    button.disabled = true;
    button.innerHTML = 'Sending...';

    // Get all error messages and remove the innerHTML
    const errorMessages = queryAll('.error');

    for (let i = errorMessages.length - 1; i >= 0; i--) {
      errorMessages[i].innerHTML = '';
    }

    // Get the form data
    // Name
    const name = this.form.query('input[name=name]');
    // Email
    const email = this.form.query('input[name=email]');
    // Message
    const message = this.form.query('textarea[name=message]');
    // Combine the form data into json format
    const data = {
      name: name.value,
      email: email.value,
      message: message.value,
    };

    // Create the ajax request
    ajax(this.apiUrl, 'post', data, callback.bind(this));

    /**
     * Ajax request callback
     */
    function callback(response) {
      console.log(response);

      if (!response.json) {
        // If there is a responseText, show the error message
        if (response.responseText) {
          responseElement.innerHTML = response.responseText;
          responseElement.classList.add('error');
        } else {
          // If there is none just show a generic error message
          responseElement.innerHTML = 'Could not send the email';
          responseElement.classList.add('error');
        }

        // Enable submit button
        enableSubmit();

        return;
      }

      const { data, errors, status } = response.json;
      let error;

      switch (status) {
        case 200:
          // Set the message of the response object
          responseElement.innerHTML = data.message;

          // Remove the value of the inputs and text area
          name.value = '';
          email.value = '';
          message.value = '';

          break;
        case 400:
          error = errors.reduce((map, error) => {
            map[error.field] = error;

            return map;
          }, {});

          console.log(error);

          if (error['name']) {
            name.nextElementSibling.innerHTML = error['name'].message;
          }

          if (error['email']) {
            email.nextElementSibling.innerHTML = error['email'].message;
          }

          if (error['message']) {
            message.nextElementSibling.innerHTML = error['message'].message;
          }

          break;
        case 500:
          error = errors[0];

          // If the response has a generic error
          // Set the message of the response object
          responseElement.innerHTML = error.message;
          responseElement.classList.add('error');
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

  initCursor() {
    const render = () => {
      const { x, y } = this.mousePosition;

      this.cursor.style.left = x + 'px';
      this.cursor.style.top = y + 'px';

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  /**
   * Set up the mobile view
   */
  mobileView() {
    // Hide cursor
    this.cursor.style.display = 'none';
  }

  /**
   * Set the VH using the inner height of the window.
   * This will fix the bug in mobile browsers wherein vh
   * includes the size of the address bar
   */
  setVh() {
    // First we get the viewport height and we multiply
    // it by 1% to get a value for a vh unit
    const vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property
    // to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  /**
   * Set the particles' size value using the height and width
   * basis and the current height and width of the logo container
   * element
   */
  setParticleSize() {
    let size;

    // If the window width is less than the mobile width basis,
    // set the size value default for mobile views
    if (window.innerWidth <= this.mobileWidth) {
      size = 0.4;
    } else {
      // Initial particle size value
      const initialValue = 1;
      // Ratio basis for the initial value
      const basis = this.basis.width / this.basis.height;
      // The current height and width of the logo container element
      const current = this.logoContainer.clientWidth / this.logoContainer.clientHeight;

      // The new value of the particles size
      size = initialValue * (current / basis);
    }

    // If the 3D object is already initialized, set the value of
    // the material uniform size.
    // Else, set the options size only
    if (this.headerParticles.particles.object3D) {
      // Update the value in the image particles object
      this.headerParticles.particles.object3D.material.uniforms.uSize.value = size;
    }

    this.headerParticles.options.particlesSize = size;
  }
}
