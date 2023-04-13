const Util = require("./utils/Utils");

module.exports = class MessageEmbed {
    constructor(options = {}) {
        this.EmbedBuilder = options;
        this._type = options.type || 'rich';
        this._title = options.title || null;
        this._description = options.description || null;
        this._fields = options.fields || [];
        this._thumbnail = options.icon || null;
        this._footer = options.footer || null;
        this._url = options.url || null;
        this._image = options.image || null;
        this._author = options.author || null;
        this._video = options.video || null;
        this._timestamp = 'timestamp' in options ? new Date(options._timestamp).getTime() : null;
    }

    get createdAt() {
        return this._timestamp ? new Date(this._timestamp) : null;
    }

    setTitle(title) {
        if (title.length > 256) throw new Error("The title of the embed can only be a maximum of 256 characters!")
        this._title = title;
        return this;
    }

    setDescription(desc) {
        if (desc.length > 2048) throw new Error("The description cannot exceed 2048 characters!");
        this._description = desc;
        return this;
    }

    addField(name, value, inline = false) {
        if (this._fields.length >= 25) throw new Error("The embed can only have up to 25 fields!");
        if (name.length >= 256) throw new Error("The field name can only be up to 256 characters long!");
        if (name.length >= 1024) throw new Error("The field description cannot exceed 2048 characters!");

        this._fields.push({ name, value, inline })
        return this;
    }
    
    addFields(...arr) {
        for (const item of arr) {
            if (item.inline) this.addField(item.name, item.value, item.inline)
            else this.addField(item.name, item.value);
        }
        return this
    }

    setAuthor(name, icon, url) {
        this._author = { name: name, icon_url: icon, url: url };
        return this;
    }

    setThumbnail(icon, options = {}) {
        this._thumbnail = { url: icon, height: options.height, width: options.width };
        return this;
    }

    setFooter(text, icon) {
        if (text.length > 2048) throw new Error("The footer cannot exceed 2048 characters!");
        this._footer = { text, icon };
        return this;
    }

    setUrl(url) {
        this._url = url;
        return this;
    }

    setTimestamp(timestamp = Date.now()) {
        if (timestamp instanceof Date) timestamp = timestamp.getTime();
        this._timestamp = timestamp;
        return this;
    }

    setImage(imgURL, options = {}) {
        this._image = { url: imgURL, height: options.height, width: options.width };
        return this;
    }

    setColor(color) {
        this._color = Util.color(color);
        return this;
    }

    setVideo(video) {
        this._video = video;
        return this;
    }

    get create() {
        return {
            embed: {
                title: this._title,
                type: this._type,
                description: this._description,
                url: this._url,
                timestamp: this._timestamp ? new Date(this._timestamp) : null,
                color: this._color,
                footer: this._footer,
                image: this._image,
                thumbnail: this._thumbnail,
                video: this._video,
                fields: this._fields,
                author: this._author,
                footer: this._footer
                    ? {
                        text: this._footer.text,
                        icon_url: this._footer.icon,
                    }
                    : null,
            }
        }
    }
   

    get toJson() {
        return {
            title: this._title,
            type: this._type,
            description: this._description,
            url: this._url,
            timestamp: this._timestamp ? new Date(this._timestamp) : null,
            color: this._color,
            image: this._image,
            thumbnail: this._thumbnail,
            video: this._video,
            fields: this._fields,
            author: this._author,
            footer: this._footer
                ? {
                    text: this._footer.text,
                    icon_url: this._footer.icon,
                }
                : null,
        }
    }
}
