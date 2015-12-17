module.exports = function() {

    var open = function() {
        if(false) {
            return true;
        } else {
            return false;
        }
    };

    var close = function() {

    };

    return {
        name: 'MongoDB',
        open: open,
        close: close
    };
}();
