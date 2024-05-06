export default class Attachment {
    constructor(
        public id: string,
        public url: string,
        public proxy_url: string,
        public filename: string,
        public width: number,
        public height: number,
        public size: number
    ) {

    }
}