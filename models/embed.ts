export default class Embed {
    constructor(
        public type: string,
        public url?: string,
        public title?: string,
        public description?: string,
        public color?: number
    ) {
        
    }
}