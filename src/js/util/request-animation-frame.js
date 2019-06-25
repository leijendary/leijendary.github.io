function requestAnimationFrame() {
    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(func) {
            window.setTimeout(func, 1000 / 50);
        }
    );
}

export default requestAnimationFrame;