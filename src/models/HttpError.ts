export class HttpError extends Error {
    private readonly statusCode: number;
    private readonly serviceMessage?: string;
    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.statusCode = statusCode;
        this.logError();
    }

    private logError() {
        console.error(this.message);
        console.error(this.stack);
    }
    public formatToResponse() {
        return {
            statusCode: this.statusCode,
            body: JSON.stringify({
                "message": this.message
            })
        }
    }
}