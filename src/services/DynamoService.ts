import { 
    DynamoDBClient,
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput,
    GetItemCommand,
    GetItemCommandInput,
    PutItemCommand,
    PutItemCommandInput,
    DeleteItemCommand,
    DeleteItemCommandInput,
    DeleteItemCommandOutput,
    AttributeValue,
    GetItemCommandOutput,
    PutItemCommandOutput,
    BatchWriteItemCommand,
    BatchWriteItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { 
    marshall, 
    unmarshall 
} from "@aws-sdk/util-dynamodb";
import { Product } from "../models/Product";
import { ProductPrice } from "../models/ProductPrice";
import { ProductUrl } from "../models/ProductUrl";

export class DynamoService {
    private readonly productsTableName: string;
    private readonly pricesTableName: string;
    private readonly ddbClient: DynamoDBClient;
    constructor(
        ddbClient: DynamoDBClient, 
        productsTableName: string,
        pricesTableName: string
    ) {
        this.ddbClient = ddbClient;
        this.productsTableName = productsTableName;
        this.pricesTableName = pricesTableName;
    }

    /** PRIVATE METHODS **/
    private epochToDate(epoch: number): Date {
        return new Date(epoch * 1000);
    }

    private async queryProductsTable(pk: string, sk?: string): Promise<QueryCommandOutput> {
        const queryCmdInput: QueryCommandInput = {
            TableName: this.productsTableName,
            KeyConditionExpression: "pk = :pk",
            ExpressionAttributeValues: {
                ":pk": {
                    "S": pk
                }
            },
            ExclusiveStartKey: marshall({
                pk: pk,
                sk: sk
            })
        };
        const queryCmd = new QueryCommand(queryCmdInput);
        const res = await this.ddbClient.send(queryCmd);
        return res;
    }

    private async queryPricesTable(pk: string, sk?: number): Promise<QueryCommandOutput> {
        const queryCmdInput: QueryCommandInput = {
            TableName: this.pricesTableName,
            KeyConditionExpression: "pk = :pk",
            ExpressionAttributeValues: {
                ":pk": {
                    "S": pk
                }
            },
            ExclusiveStartKey: marshall({
                pk: pk,
                sk: sk
            }),
            ScanIndexForward: false
        };
        const queryCmd = new QueryCommand(queryCmdInput);
        const res = await this.ddbClient.send(queryCmd);
        return res;
    }

    private async getItemInProductsTable(pk: string, sk: string): Promise<GetItemCommandOutput> {
        const getItemCmdInput: GetItemCommandInput = {
            TableName: this.productsTableName,
            Key: marshall({
                "pk": pk,
                "sk": sk
            })
        };
        const getItemCmd = new GetItemCommand(getItemCmdInput);
        const res = await this.ddbClient.send(getItemCmd);
        return res;
    }

    private async addItemToProductTable(item: Record<string, AttributeValue>): Promise<PutItemCommandOutput> {
        const putItemCmdInput: PutItemCommandInput = {
            TableName: this.productsTableName,
            Item: item
        };
        const putItemCmd = new PutItemCommand(putItemCmdInput);
        const res = await this.ddbClient.send(putItemCmd);
        return res;
    }

    private async addItemToPricesTable(item: Record<string, AttributeValue>): Promise<PutItemCommandOutput> {
        const putItemCmdInput: PutItemCommandInput = {
            TableName: this.pricesTableName,
            Item: item
        };
        const putItemCmd = new PutItemCommand(putItemCmdInput);
        const res = await this.ddbClient.send(putItemCmd);
        return res;
    }

    private async deleteItemFromProductsTable(pk: string, sk: string): Promise<DeleteItemCommandOutput> {
        const deleteItemCmdInput: DeleteItemCommandInput = {
            TableName: this.productsTableName,
            Key: {
                "pk": {
                    "S": pk
                },
                "sk": {
                    "S": sk
                }
            }   
        };
        const deleteCmd = new DeleteItemCommand(deleteItemCmdInput);
        const res = await this.ddbClient.send(deleteCmd);
        return res;
    }

    private async batchDeleteItemsFromPricesTable(items: ProductPrice[]): Promise<BatchWriteItemCommandOutput> {
        const requestItems = items.map(item => {
            const ddbItem = item.toDynamoItem();
            return {
                DeleteRequest: {
                    Key: {
                        "pk": ddbItem["pk"],
                        "sk": ddbItem["sk"]
                    }
                }
            }
        });
        const batchWriteCmd = new BatchWriteItemCommand({
            RequestItems: {
                [this.pricesTableName]: requestItems
            }
        });
        const res = await this.ddbClient.send(batchWriteCmd);
        return res;
    }

    /** PUBLIC METHODS **/

    public closeConnection() {
        this.ddbClient.destroy();
    }

    public async getAllProducts(): Promise<Product[]> {
        let items = [];
        let productRes = await this.queryProductsTable("PRODUCT");
        if (!productRes.Items) return [];
        items.push(...productRes.Items);
        while (productRes.LastEvaluatedKey) {
            const sk = productRes.LastEvaluatedKey["sk"];
            productRes = await this.queryProductsTable("PRODUCT", sk.S);
            if (!productRes.Items) break;
            items.push(...productRes.Items);
        }
        const products = items?.map((item: Record<string, AttributeValue>) => {
            const unmarshalledItem = unmarshall(item);
            return new Product(
                unmarshalledItem["productName"],
                new Date(unmarshalledItem["createdAt"] * 1000),
                new Date(unmarshalledItem["updatedAt"] * 1000),
                unmarshalledItem["sk"]
            );
        });
        return products;
    }

    public async getProductUrlsForProductId(productId: string): Promise<ProductUrl[]> {
        let items = []; 
        let res = await this.queryProductsTable(productId, undefined);
        if (!res.Items) return [];
        while(res.LastEvaluatedKey) {
            const sk = res.LastEvaluatedKey["sk"];
            res = await this.queryProductsTable(productId, sk.S);
            if (!res.Items) break;
            items.push(...res.Items);
        }
        const productUrls = items?.map((item: Record<string, AttributeValue>) => {
            const unmarshalledItem = unmarshall(item);
            return new ProductUrl(
                productId,
                unmarshalledItem["productUrl"],
                new Date(unmarshalledItem["createdAt"] * 1000),
                new Date(unmarshalledItem["updatedAt"] * 1000),
                unmarshalledItem["xpath"],
                unmarshalledItem["cssSelectors"],
                unmarshalledItem["sk"]
            );
        });
        return productUrls;
    }

    public async getProductById(productId: string): Promise<Product> {
        const res = await this.getItemInProductsTable("PRODUCT", productId);
        const item = unmarshall(res.Item!);
        return new Product(
            item["productName"],
            this.epochToDate(item["createdAt"]),
            this.epochToDate(item["updatedAt"]),
            item["sk"]
        );
    }

    public async getProductUrlPrices(productUrlId: string): Promise<ProductPrice[]> {
        let items = [];
        let res = await this.queryPricesTable(productUrlId);
        if (!res.Items) return [];
        items.push(...res.Items);
        while(res.LastEvaluatedKey) {
            const sk = res.LastEvaluatedKey["sk"];
            res = await this.queryPricesTable(productUrlId, Number(sk.N));
            if (!res.Items) break;
            items.push(...res.Items);
        }
        const productPrices = items.map(item => {
            const unmarshalledItem = unmarshall(item);
            return new ProductPrice(
                unmarshalledItem["pk"],
                new Date(unmarshalledItem["sk"]),
                unmarshalledItem["price"],
                new Date(unmarshalledItem["expirationTimestamp"])
            )
        });
        return productPrices;
    }

    public async deleteProductUrl(productId: string, productUrlId: string): Promise<void> {
        await this.deleteItemFromProductsTable(productId, productUrlId);
        //delete all product prices for this url
        const productPrices = await this.getProductUrlPrices(productUrlId);
        await this.batchDeleteItemsFromPricesTable(productPrices);
    }

    public async addProduct(product: Product): Promise<Product> {
        await this.addItemToProductTable(product.toDynamoItem());
        return product;
    }

    public async addProductUrl(productUrl: ProductUrl): Promise<ProductUrl> {
        await this.addItemToProductTable(productUrl.toDynamoItem());
        return productUrl;
    }

    public async addProductPrice(productPrice: ProductPrice): Promise<ProductPrice> {
        await this.addItemToPricesTable(productPrice.toDynamoItem());
        return productPrice;
    }
}