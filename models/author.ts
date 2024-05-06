export default class Author {
    constructor(
        public id: string,
        public username: string,
        public avatar: string,
        public discriminator: string,
        public bot: boolean
    ) {
        
    }
}