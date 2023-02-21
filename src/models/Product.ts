import {v4} from 'uuid';
import {marshall} from '@aws-sdk/util-dynamodb'
export class Product {
    public readonly pk: string;
    public readonly productName: string;
    public readonly productId: string;
    public readonly createdAt: Date;
    public updatedAt: Date;
    constructor(
        name: string, 
        createdAt: Date, 
        updatedAt: Date,
        productId: string = v4()
    ) 
    {
        this.pk = "PRODUCT";
        this.productName = name;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.productId = productId;
    }

    public updateTimestamp() {
        this.updatedAt = new Date(Date.now());
    }

    public toDynamoItem() {
        return marshall({
            "pk": this.pk,
            "sk": this.productId,
            "productName": this.productName,
            "createdAt": this.createdAt.getTime() / 1000, //epoch seconds
            "updatedAt": this.updatedAt.getTime() / 1000 //epoch seconds
        });
    }
}
