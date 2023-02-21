import { v4 } from "uuid";
import { marshall } from "@aws-sdk/util-dynamodb";
export class ProductUrl {
    public readonly productId: string;
    public readonly productUrlId: string;
    public readonly productUrl: string;
    public readonly xpath: string;
    public readonly cssSelectors: string;
    public readonly createdAt: Date;
    public updatedAt: Date;

    constructor(
        productId: string,
        productUrl: string,
        createdAt: Date,
        updatedAt: Date,
        xpath: string,
        cssSelectors: string,
        productUrlId: string = v4()
    ) {
        this.productId = productId;
        this.productUrl = productUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.xpath = xpath;
        this.cssSelectors = cssSelectors;
        this.productUrlId = productUrlId;
    }

    public updateTimestamp() {
        this.updatedAt = new Date(Date.now());
    }

    public toDynamoItem() {
        return marshall({
            "pk": this.productId,
            "sk": this.productUrlId,
            "productUrl": this.productUrl,
            "xpath": this.xpath,
            "cssSelectors": this.cssSelectors,
            "createdAt": this.createdAt.getTime() / 1000, //epoch seconds
            "updatedAt": this.updatedAt.getTime() / 1000 //epoch seconds
        })
    }
}