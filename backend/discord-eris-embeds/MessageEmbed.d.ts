declare class MessageEmbed {
    get createdAt(): number;
    setTitle(title: string): MessageEmbed;
    setDescription(desc: string): MessageEmbed;
    addField(name: string, value: string, inline?: boolean): MessageEmbed;
    addFields(arr: Array<{name: string, value: string, inline?: boolean}>): MessageEmbed;
    setAuthor(name: string, icon: string, url?: string): MessageEmbed;
    setThumbnail(icon: string, options?: {height: number, width: number}): MessageEmbed
    setFooter(text: string, icon?: string): MessageEmbed;
    setUrl(url: string): MessageEmbed;
    setTimestamp(timestamp?: number): MessageEmbed;
    setImage(imgUrl: string, options?: {height: number, width: number}): MessageEmbed
    setColor(color: string): MessageEmbed;
    setVideo(video: string): MessageEmbed;
    get create(): any
    get toJson(): any
}

export default MessageEmbed
