class PermissionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PermissionError'
    }
}

class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseError'
    }
}

class NotAnError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotAnError'
    }
}

module.exports = {PermissionError, DatabaseError, NotAnError}