if (process.env.NODE_ENV === 'production') {
    console.log('PRODUCTIOn');

    module.exports = {
        plugins: [
            require('autoprefixer'),
            require('cssnano'),
            // More postCSS modules here if needed
        ]
    }
}