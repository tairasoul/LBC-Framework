module.exports = class SlashBuilder {
    constructor() {
        this.construct = {}
        this.construct.name = null;
        this.construct.description = null;
        this.construct.options = [];
        this.construct.type = 1;
    }
    setName(string) {
        this.construct.name = string;
        return this;
    }
    setDescription(str) {
        this.construct.description = str;
        return this;
    }
    setOptions(arr) {
        this.construct.options = arr;
        return this;
    }
    setType(type) {
        this.construct.type = type;
        return this
    }
    constr() {
        return this.construct
    }
}
