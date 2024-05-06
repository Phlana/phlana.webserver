import { ObjectId } from "mongodb";
import Attachment from "./attachment";
import Author from "./author";
import Embed from "./embed";

export default class Quote {
    constructor(
        public channel_id: string,
        public content: string,
        public timestamp: string,
        public author: Author,
        public attachments: Attachment[],
        public embeds: Embed[],
        public _id: string
    ) {
        
    }
};
