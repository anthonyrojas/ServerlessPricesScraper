import {marshall} from '@aws-sdk/util-dynamodb';

export class ProductPrice {
    public readonly id: string;
    public readonly priceTimestamp: Date;
    public readonly price: number;
    public readonly expirationTimestamp: Date;

    constructor(
        id: string,
        priceTimestamp: Date,
        price: number,
        expirationTimestamp: Date
    ) {
        this.id = id,
        this.priceTimestamp = priceTimestamp;
        this.price = price;
        this.expirationTimestamp = expirationTimestamp;
    }

    public toDynamoItem() {
        return marshall({
            "pk": this.id,
            "sk": this.priceTimestamp.getTime() / 1000,
            "price": this.price,
            "expirationTimestamp": this.expirationTimestamp.getTime() / 1000
        });
    }
}